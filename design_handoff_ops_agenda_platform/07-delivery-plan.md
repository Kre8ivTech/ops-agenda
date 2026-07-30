# 7. Delivery plan

## 1. Sequence

Ordered so the expensive-to-retrofit decisions land first and every phase ships something demonstrable.

### Phase 0 — Decisions and foundations (1–2 weeks)

Nothing else starts cleanly until these are answered.

- [ ] **GovCon/CUI decision.** Determines commercial AWS vs. GovCloud and the whole assessment boundary (`03-security-compliance.md §3b`). Highest-cost fork in the build.
- [ ] **HIPAA applicability determination** by counsel (`§3a`). Engineer to the Security Rule regardless.
- [ ] Hosting shape: Fargate (recommended) vs. Amplify (`01-architecture.md §2`).
- [ ] Financial aggregation provider selected, contract and scopes reviewed.
- [ ] Logotype typeface resolved (Poppins vs. Geist 900).
- [ ] AWS Organizations, four accounts, SCPs, CDK skeleton, CI/CD with OIDC.
- [ ] Threat model workshop; write the register down.

**Exit:** an empty app deploys through the pipeline to staging and production, with WAF, RLS-enabled Postgres and audit logging already in place.

### Phase 1 — Spine (4–6 weeks)

The platform's load-bearing structure. Resist building screens here.

- Cognito hosted auth, session cookies, MFA, step-up challenge, device management
- Tenancy: `account`, `user`, `entity`, `entity_grant`, `module_state` + **forced RLS and the blocking `test:rls` suite**
- The app shell: sidebar with live counts, module gating by entitlement, entity switcher, command palette, degraded banner
- The **record pattern** and the **scaffolded table** component, complete (`06-screens.md §2`)
- Audit writer + immutable S3 mirror; the redacting logger
- Design system primitives as real components; `Lockup`; WCAG harness in CI
- Onboarding wizard shell (steps present, connectors stubbed)

**Exit:** one module (Productivity → Tasks) is fully real end-to-end — table, filters, expansion, actions, edit, audit, a11y. Every other module is then a repetition of a proven pattern.

### Phase 2 — The brief (4–6 weeks)

The product's core promise. Ship it before breadth.

- Connectors: mail + calendar (read-only, minimal fields — no bodies)
- Connector health model and the degraded/pending/revoked states
- Brief pipeline steps 1–3 and 5–7 with a **stubbed** model step; verify correctness deterministically
- **Eval harness and golden set first**, then the Bedrock ranking call (`04-ai-bedrock.md §7`)
- Guardrails, injection test suite, output validation
- Delivery: SES email + push; the 06:05 local SLO with paging
- Dashboard and Productivity → Briefs

**Exit:** a real user gets a correct, explainable brief at 6:00 for two weeks running, with evals gating prompt changes.

### Phase 3 — Modules by value (8–12 weeks)

Each module is the table pattern plus its custom screens. Order by user value and risk:

1. **Productivity** complete (Email ranking, Calendar, Capacity, Time, Contacts)
2. **Plan** (Goals, Habits, Projects, Journal, Review) + the `record_link` graph
3. **Business** (Entities, Compliance, Pipeline, Contracts, Vendors)
4. **Finances** (Overview, accounts, transactions, Subscriptions, Budgets, Taxes, Forecast, Reports) — needs the aggregation provider and Tier 1 encryption
5. **Life** minus Continuity
6. **Research** (Seek, Library, News) — Bedrock Knowledge Base, per-tenant namespace
7. **Health** — Tier 0/1 encryption, no scoring, HIPAA determination resolved

### Phase 4 — Hardening and launch (3–4 weeks)

- Third-party penetration test; remediate and retest
- SOC 2 readiness assessment; evidence collection running
- Backup restore drill; incident response tabletop
- Load test to 10× expected launch traffic; brief pipeline at 100× users
- Full WCAG 2.2 AA audit
- Privacy notice and terms reconciled **line by line** against actual behaviour
- All 14 launch gates in `03-security-compliance.md §10`

### Phase 5 — Post-launch

- **Continuity** after dedicated (ideally external) security review
- **Social** — per-platform app review is a multi-week external dependency
- Team/RBAC sharing beyond the initial model
- Mobile apps if wanted; the API surface should already support it

## 2. Definition of done, per screen

A screen is not done until all of it is true:

1. Renders server-side; no client fetch of a sensitive collection
2. Every mutation goes through a Server Action with Zod validation, `authorize()` (module + role + entity + record), and an audit write
3. Tenant isolation covered by `test:rls`
4. Pagination, sort, filter and search are server-side
5. Empty, loading and error states designed — no spinner-only states, no cheerful empty state
6. Keyboard operable end to end; axe clean; visible focus
7. Copy matches the prototype exactly, including the compliance sentences
8. No sensitive field in any log, trace or error report
9. Playwright covers the happy path plus one failure path
10. Responsive behaviour per `06-screens.md §9`

## 3. Critical E2E flows

Must be green before every production deploy:

1. Sign up → MFA enrol → onboarding all seven steps → first brief generated
2. Sign in → dashboard → open a flagged record → read why → mark handled → confirm it leaves the brief
3. Connect a mail account → sync → email ranked → degraded state simulated → banner appears → reconnect → banner clears
4. Table: filter → search → expand → edit → save → verify persistence across filter and navigation
5. Entity switch → confirm data scoping across three modules
6. Module disable → confirm absence everywhere → re-enable within 30 days → data intact
7. Plan downgrade → confirm modules become unavailable without data loss
8. Export a report → presigned URL → audit event written
9. Step-up: attempt a sensitive action → challenge → complete → action allowed
10. **Cross-tenant probe: authenticate as tenant A, attempt to read tenant B by id → denied at the database**

## 4. Team shape

Realistic minimum for the timeline above:

- 1 tech lead / architect (owns the security model and reviews every data-path PR)
- 2 full-stack engineers (Next.js + Postgres)
- 1 platform/DevOps engineer (CDK, pipelines, observability)
- 1 AI engineer (brief pipeline, Seek, evals) — can be shared from Phase 2
- 1 designer (part-time; the system exists, so this is application and edge cases)
- Security review: external, at Phase 1 exit and Phase 4
- Counsel: Phase 0 determinations, privacy notice, DPAs

A single engineer with Claude Code can move quickly through Phases 1–3, but **Phase 0's decisions and Phase 4's external reviews cannot be compressed** — they gate legally, not technically.

## 5. Cost envelope

Order-of-magnitude monthly infrastructure at low scale (< 1,000 users), commercial region:

| Item | Estimate |
|---|---|
| Fargate (web + workers, 2 AZ) | $150–400 |
| Aurora Serverless v2 (Multi-AZ, low ACU) | $200–500 |
| CloudFront + WAF + ALB | $60–150 |
| Bedrock (briefs + Seek) | $100–600, usage-driven |
| S3, KMS, Secrets, SQS, Step Functions, logs | $50–150 |
| OpenSearch Serverless (if enabled) | $350+ — **defer; Postgres FTS covers launch** |
| **Total** | **~$600–1,800/mo** before OpenSearch |

GovCloud raises this materially. Bedrock is the line that scales with users — the ~40-item candidate cap is what keeps it predictable (`04-ai-bedrock.md §6`).

## 6. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| GovCon/CUI decided late | Re-platform to GovCloud | Force the decision in Phase 0 |
| Brief ranking quality poor | Product fails regardless of everything else | Evals before tuning; deterministic fallback; ship Phase 2 to real users early |
| Tenant isolation bug | Multi-regime reportable breach | Forced RLS + blocking CI suite + pen test + cross-tenant E2E probe |
| Table component built shallow | 35 screens of rework | Full build in Phase 1, one module proven before scaling out |
| Connector API changes / rate limits | Stale data, visible to users | Adapter interface, health model, honest degraded UI, per-provider alarms |
| Scope creep into money movement or filing | Whole new regulatory surface, breaks stated promises | The UI's promises are the spec; changing them is a client decision with a compliance review |
| Health scoring added "helpfully" | Medical-device / CDS exposure | Documented constraint (`06-screens.md §4`); review any Health PR against it |
| Continuity built casually | Real-world harm | Feature-flag off until dedicated review |
| SOC 2 evidence started late | Audit slips by a quarter or more | Collect from Phase 1 |
| Social app review timelines | Feature slips | Post-launch phase, start submissions early |

## 7. First week for the implementing agent

1. Read `README.md`, then `03-security-compliance.md` in full.
2. Open `design/Ops Agenda - Prototype.dc.html` in a browser. Click every nav item. Expand table rows, run the filters, walk the onboarding wizard. Do not skip this — the cross-module flows are the product and they do not read well as prose.
3. Open `design/Ops Agenda - Design System.dc.html` and `- Brand Guide.dc.html` side by side; extract tokens into the styling layer verbatim.
4. Raise the Phase 0 decisions with the client **as questions, in writing**, before writing feature code.
5. Stand up the CDK skeleton, the pipeline, and an empty Next.js app that deploys to staging.
6. Build the tenancy tables with forced RLS and the `test:rls` suite **before** the first feature. Everything after that is safer.
