# 1. Architecture — AWS + Next.js

## 1. Principles

1. **One system of record.** Aurora PostgreSQL holds canonical state. Caches, search indexes and vector stores are derived and rebuildable from it plus S3.
2. **Connectors are asynchronous and untrusted.** Every external system is polled or webhooked into a queue, normalised, and written by an idempotent worker. The web tier never calls a third-party API in a request path.
3. **The request path is boring.** Read the database, render, return. All ranking, summarisation and enrichment happens ahead of time in the brief pipeline.
4. **Private by default.** Only CloudFront and the ALB are public. Compute, data and inference egress live in private subnets with VPC endpoints.
5. **Everything is IaC.** No console changes in any environment above dev; drift detection on.

## 2. Hosting shape — decide first

**Recommended: ECS Fargate behind CloudFront + ALB.**

- Full control of the runtime, network path and patch cadence — the posture you must be able to describe in a SOC 2 audit and in a customer security review.
- Standard VPC networking, so VPC endpoints, PrivateLink to Bedrock, and strict egress control are straightforward.
- Only viable path if the GovCon/CUI question (see `03-security-compliance.md §3`) resolves to "yes" — GovCloud does not support Amplify Hosting.

**Alternative: AWS Amplify Hosting** (or OpenNext on Lambda@Edge). Faster to stand up and cheaper at low traffic, and fine for a consumer-only launch. Costs you network-level control and complicates the CUI path. If you take this route, do it knowing you may migrate.

The rest of this document assumes Fargate. Where Amplify differs materially it is noted.

### Topology

```
Route 53 (opsagenda.com)
  └── CloudFront ── AWS WAF (managed rules + rate limiting + bot control)
        ├── /_next/static/*, /assets/*  → S3 (OAC, immutable, long TTL)
        └── /*                          → ALB (HTTPS only, TLS 1.3, ACM cert)
                                            └── ECS Fargate service: web (Next.js standalone)
                                                  ├── private subnets, 2+ AZs
                                                  ├── autoscaling on ALB RPS + CPU
                                                  └── read-only root filesystem, non-root user

Private subnets
  ├── Aurora PostgreSQL Serverless v2 (Multi-AZ, IAM auth, RDS Proxy, Performance Insights)
  ├── ElastiCache Valkey (session/rate-limit/derived-read cache)
  ├── ECS Fargate service: workers (connector sync, normalisation, export generation)
  ├── OpenSearch Serverless (global search across records; also the vector store for Research)
  └── VPC endpoints: bedrock-runtime, bedrock-agent-runtime, s3, kms, secretsmanager,
                     sqs, sns, states, logs, ssm, ecr, events
```

**Async and scheduled work**

| Concern | Service | Notes |
|---|---|---|
| 6:00 local brief | EventBridge Scheduler → Step Functions | One schedule per user timezone, not per user. Fan out inside the state machine. |
| Brief generation | Step Functions (Express for fan-out, Standard for the run) | Retries, per-step timeouts, full execution history for debugging ranking |
| Connector sync | EventBridge rules → SQS → Fargate workers | Per-connector FIFO queue keyed by connection id; DLQ with alarm |
| Webhooks in | API Gateway → Lambda → SQS | Signature verification at the edge; never trust payload contents |
| Exports / accountant pack | SQS → Fargate worker → S3 presigned URL | Long-running; never in a request |
| Continuity break-glass | Step Functions with a 72-hour `Wait` state | See `03-security-compliance.md §6` — this one needs its own review |
| Document OCR / classification | S3 event → Lambda → Textract → Bedrock | Health records, filings, W-9s |
| Notifications | SNS + SES (email), Pinpoint or APNs/FCM (push) | Defaults are quiet by design |

## 3. Next.js application structure

Next.js 15+, App Router, TypeScript strict, React Server Components by default, `output: "standalone"` for the container.

```
app/
  (marketing)/                     public site, statically rendered
  (auth)/
    sign-in/                       redirects into Cognito Hosted UI
    callback/                      OIDC code exchange → session cookie
  (onboarding)/
    welcome/ modules/ accounts/ entities/ finance/ notifications/ brief/
  (app)/
    layout.tsx                     shell: sidebar, top bar, command palette, sync banner
    dashboard/
    ask/
    plan/{goals,habits,projects,journal,review}/
    productivity/{briefs,email,calendar,tasks,capacity,time,contacts}/
    finances/{overview,personal,business,subscriptions,budgets,taxes,
              forecast,investments,insurance,documents,reports}/
    business/{entities,compliance,pipeline,contracts,vendors}/
    health/{overview,exercise,food,mental,spiritual,appointments,
            medications,metrics,records}/
    life/{home,vehicles,people,travel,documents,education,continuity}/
    research/{seek,library,news}/
    social/{calendar,drafts,publishing,analytics}/
    alerts/
    settings/{profile,modules,security,integrations,automations,
              notifications,entities,billing,team}/
  api/
    webhooks/{provider}/route.ts   signature-verified ingress
    trpc/[trpc]/route.ts           or Server Actions only — pick one and be consistent

components/
  ui/                              primitives from the design system
  records/                         RecordTable, RecordDrawer, RecordForm, FilterChips
  brief/                           BriefCard, WhyFlagged, RankedList
  chrome/                          Sidebar, TopBar, CommandPalette, SyncBanner, Lockup

lib/
  auth/          session, RBAC, step-up challenge
  db/            Drizzle schema + client (RLS-aware; sets tenant context per request)
  modules/       module registry, plan entitlement checks
  connectors/    provider adapters behind one interface
  ai/            Bedrock clients, prompt assembly, guardrails, eval harness
  audit/         append-only audit writer
  policy/        field-level classification + redaction helpers
```

### Rendering and data rules

- **Server Components read the database directly** through a per-request client that sets the RLS tenant context. No REST hop for first render.
- **Server Actions for mutations**, each one: validate with Zod → authorise (module entitlement + RBAC + entity scope) → mutate → write audit → revalidate tag.
- **Client Components only where interaction demands it**: tables with filter/search/expand, forms, command palette, the Ask surface (streaming).
- **Streaming**: brief generation and Ask responses stream to the client. Everything else renders complete — no skeleton-heavy UI; the prototype's density looks broken half-loaded.
- **Cache tags per record type and entity** (`revalidateTag('finances:entity:123')`). Set `dynamic = 'force-dynamic'` on nothing; be explicit with tags instead.
- **No client-side fetch of sensitive collections.** Health, Finances detail and Continuity render server-side only, so the payload never contains more than the screen shows.

### The shell

The app shell (`(app)/layout.tsx`) owns: sidebar with live counts, module filtering by entitlement, the degraded-sync banner, the command palette (⌘K), and the entity switcher. Counts come from one cached aggregate query, not N queries — the prototype shows counts on ~12 nav items simultaneously.

## 4. Identity

**Amazon Cognito user pools with the Hosted UI** — matches the sign-in design.

- OIDC authorization code flow + PKCE. Tokens are exchanged server-side; the browser gets an httpOnly, Secure, SameSite=Lax session cookie. **Never put a Cognito access token in localStorage.**
- MFA: TOTP and WebAuthn/passkeys. Required, not optional, for any account with the Finances, Business or Life modules enabled — this is the client's data, and the Continuity module alone justifies it.
- Advanced security features on: compromised-credential detection, adaptive risk, IP reputation.
- **Step-up authentication** required for: viewing Continuity entries, changing MFA or recovery, adding a financial connection, exporting anything, and granting team access. Implement as a re-authentication challenge with a short-lived elevated session claim.
- Session: 30-minute idle, 12-hour absolute, sliding refresh only on real interaction. Device list and remote sign-out in Settings → Security.
- Team access (Settings → Team) is RBAC with roles scoped **per module and per entity** — an accountant sees Finances for two entities and nothing else. Model this from day one; retrofitting scoped sharing is painful.

## 5. Environments

Four AWS accounts under Organizations with SCPs: `management`, `dev`, `staging`, `prod`. Optionally `audit` for log archive (recommended — see below).

- **No production data in any lower environment, ever.** Seed with synthetic data generated from the fixtures in the prototype.
- Staging mirrors production topology at minimum scale, including WAF and RLS.
- Log archive account holds CloudTrail + audit logs in S3 with Object Lock (compliance mode) and no human write path.

## 6. IaC and CI/CD

**AWS CDK (TypeScript)** — same language as the app, and the constructs make the security defaults reviewable.

Pipeline (GitHub Actions with OIDC to AWS, no long-lived keys):

1. `lint` · `typecheck` · `unit`
2. `test:rls` — **tenant-isolation test suite; blocking.** Asserts that a request in tenant A's context cannot read or write tenant B's rows, per table. Non-negotiable gate.
3. `test:e2e` — Playwright against an ephemeral stack; covers the critical flows in `07-delivery-plan.md`
4. `a11y` — axe-core on every route; WCAG 2.2 AA violations fail the build
5. `sast` (CodeQL) · `deps` (audit + license check) · `secrets` (gitleaks) · `iac` (cdk-nag, checkov)
6. `container` — Trivy/Inspector scan; build fails on High/Critical with no accepted exception
7. Deploy to staging → smoke → **manual approval** → production blue/green via CodeDeploy, auto-rollback on alarm

Migrations run as a one-off ECS task before the new task set takes traffic; expand-contract only, never a destructive migration in the same deploy as the code that needs it.

## 7. Observability

- OpenTelemetry from the app → CloudWatch (or Datadog/Honeycomb if the team already has one).
- **Redaction is a library, not a discipline.** A single structured logger that accepts only allowlisted fields; any attempt to log an object marked `sensitive` throws in dev and drops in prod. Verified by test.
- SLOs: p95 shell render < 400 ms; p95 table screen < 700 ms; **brief delivered by 06:05 local for 99.5% of users** (this is the product's core promise — page on it); connector freshness < 60 min for mail/calendar.
- Alarms that page: brief pipeline failure, connector error rate > 5% for a provider, auth failure spike, RLS denial spike (indicates a bug or an attack), Bedrock throttling, DLQ depth > 0, any Continuity break-glass initiation.
- Dashboards per module owner, plus a single "is the brief healthy" board.

## 8. Cost shape

Dominant line items at low scale: Aurora Serverless v2 minimum ACUs, OpenSearch Serverless minimum OCUs, and Bedrock tokens. Controls:

- Aurora min 0.5 ACU in dev/staging; auto-pause in dev.
- Consider deferring OpenSearch Serverless — Postgres full-text search covers launch scope, and OpenSearch has a meaningful floor cost. Add it when search quality demands.
- Bedrock: prompt caching on the brief's stable system prompt, a small model for classification and a frontier model only for ranking and Seek (`04-ai-bedrock.md §6`), and a hard per-tenant monthly token budget with a circuit breaker.
- Tag everything `module`, `env`, `tenant-tier`; Cost Anomaly Detection on.
