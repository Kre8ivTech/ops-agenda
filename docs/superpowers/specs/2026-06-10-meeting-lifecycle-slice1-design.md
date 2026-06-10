# Ops Agenda — Product Pivot & Slice 1 Design

**Date:** 2026-06-10
**Status:** Approved for build (supersedes the email-triage scope in TECHSTACK.md / README.md until those are rewritten)

## 1. Context & Pivot

Ops Agenda pivots from an email-triage product (Priority Inbox, Due-Out Detection, Daily Ops Brief built from mail) to a **meeting-lifecycle SaaS**. The product is now defined by six features:

| Feature | Value |
|---|---|
| Smart Agenda Builder | Creates focused agendas tied to priorities, goals, and previous actions |
| Decision Log | Captures key decisions, rationale, and next steps |
| Action Tracker | Assigns owners, deadlines, and status |
| Executive Summary Generator | Turns meeting notes into polished updates |
| Follow Up Assistant | Drafts task reminders and stakeholder emails |
| Risk and Issue Tracker | Surfaces blockers before they become failures |

The previously documented stack (Vercel + Supabase + OpenAI + Inngest + Upstash) is replaced by an **all-in AWS** stack with **Amazon Bedrock** for AI. A hard constraint applies while the brand is being built: **near-$0 monthly AWS cost** (free-tier / scale-to-zero services only).

Constraints that survive the pivot:
- AI output is JSON-only and schema-validated on every response
- No autonomous actions — AI suggests, user approves
- OAuth tokens encrypted at rest (AES-256-GCM per SECURITY_ARCHITECTURE.md §2.3)
- Least-privilege Microsoft Graph scopes — now **Calendars.Read only** (mail scopes dropped)
- Graceful degradation when external services fail

## 2. Slice 1 Scope

Slice 1 lights up three of the six features (Decision Log, Action Tracker, Executive Summary Generator) through one core flow:

1. Sign in with Microsoft (one OAuth flow grants login + calendar access)
2. `/meetings` — today + next 14 days, fetched on demand from Microsoft Graph `calendarView`, cached in DynamoDB (5-minute freshness)
3. `/meetings/[eventId]` — paste/edit meeting notes (≤100KB), stored in DynamoDB
4. **Process notes** — one synchronous Bedrock call extracts `{decisions[], actions[](owner, deadline, status), executive_summary}`, zod-validated, stored, rendered
5. `/decisions` (Decision Log) and `/actions` (Action Tracker) — cross-meeting list views

**Out of scope for slice 1:** Smart Agenda Builder, Follow Up Assistant, Risk & Issue Tracker, payments, multi-user/teams, mail scopes, background sync, custom domain.

## 3. Architecture

- **Deploy/IaC:** SST v3; Next.js (App Router, TypeScript) via OpenNext → Lambda + CloudFront, region **us-east-1**. No VPC, no NAT, no always-on compute.
- **Data:** one DynamoDB table (on-demand billing) + one GSI. No relational DB.
- **AI:** Bedrock **Claude Haiku 4.5** via US cross-region inference profile `us.anthropic.claude-haiku-4-5-20251001-v1:0`. Structured output via forced tool-use on the Converse API (`record_meeting_analysis` tool whose JSON schema is generated from the zod schema — single source of truth), then `safeParse` server-side. One corrective retry on validation failure, then graceful failure (notes remain saved).
- **Auth:** Auth.js v5 with the Microsoft Entra ID provider (`common` tenant, multitenant + personal accounts). JWT sessions, no DB adapter. Scopes: `openid profile email offline_access Calendars.Read`. Graph access/refresh tokens are encrypted (AES-256-GCM, `v1:<iv>:<ct>:<tag>`, key in an SST Secret / SSM SecureString — no KMS) and stored only in DynamoDB, never in cookies.
- **Token refresh:** cached access token reused if >2 min from expiry; otherwise refresh-grant against `login.microsoftonline.com/common`, persisting **both** rotated tokens; `invalid_grant` → connection deleted → re-auth redirect.
- **Calendar fetch:** simple `calendarView` (no delta sync in slice 1), `$top=50`, UTC normalized at the boundary (`Prefer: outlook.timezone="UTC"`); 429 honored with one Retry-After retry; Graph outage → stale cache + banner.

### DynamoDB single-table design

`userId` = Entra `oid` claim. Every query partitions on `USER#<id>` — tenant isolation by key design (replaces Supabase RLS).

| Entity | pk | sk | gsi1pk | gsi1sk |
|---|---|---|---|---|
| User | `USER#<id>` | `PROFILE` | — | — |
| Connection | `USER#<id>` | `CONNECTION#MSGRAPH` | — | — |
| Meeting | `USER#<id>` | `MEETING#<eventId>` | `USER#<id>#MEETING` | `<startUTC>` |
| Note | `USER#<id>` | `MEETING#<eventId>#NOTE` | — | — |
| Decision | `USER#<id>` | `MEETING#<eventId>#DECISION#<ulid>` | `USER#<id>#DECISION` | `<meetingStartUTC>#<ulid>` |
| Action | `USER#<id>` | `MEETING#<eventId>#ACTION#<ulid>` | `USER#<id>#ACTION` | `<status>#<deadline\|9999-12-31>#<ulid>` |
| Sync marker | `USER#<id>` | `CALSYNC` | — | — |

- Meeting detail page = one item-collection query (`begins_with(sk, "MEETING#<eventId>")`).
- No DynamoDB TTL (would orphan child items); freshness via `CALSYNC.lastFetchedAt`.
- Reprocessing notes idempotently replaces prior DECISION/ACTION items.

### AI extraction schema (zod)

```ts
{
  decisions: [{ description: string, context: string | null }],
  actions: [{ description: string, owner: string | null,
              deadline: "YYYY-MM-DD" | null,
              status: "open" | "in_progress" | "done" }],
  executive_summary: string (≤2000 chars)
}
```

Prompt rules: extract only what the notes support; `null` over guessing owners/deadlines; resolve relative dates against the meeting date; summary is 3–5 neutral sentences for someone who missed the meeting.

## 4. Project Structure

```
sst.config.ts  auth.ts  middleware.ts
app/  signin/  api/auth/[...nextauth]/
      (app)/{meetings, meetings/[eventId], decisions, actions}
lib/  db/{client,keys,repo/*}   crypto/encryption.ts
      graph/{token,calendar}.ts  ai/{schema,prompt,bedrock}.ts
tests/unit/   e2e/happy-path.spec.ts
```

`sst.config.ts` defines: the Dynamo table + GSI; secrets `AuthSecret`, `EncryptionKey`, `MicrosoftClientId`, `MicrosoftClientSecret`; the Nextjs component with 60s server timeout and Bedrock IAM covering the inference-profile ARN **and** the foundation-model ARNs for us-east-1/us-east-2/us-west-2.

## 5. Build Order (gated phases)

0. **Manual prereqs:** AWS credentials; Bedrock console model enablement (Claude Haiku 4.5, first-time Anthropic use-case form); Entra app registration (`common`, redirect URIs `…/api/auth/callback/microsoft-entra-id` for localhost + CloudFront, delegated `Calendars.Read openid profile email offline_access`, client secret). Verify with a CLI `converse` smoke test.
1. Scaffold + deploy hello-world (SST + Next.js on CloudFront).
2. Table, key builders, crypto, repos (unit tests local).
3. Auth + token storage/refresh — verify locally, **then deployed** (CloudFront/Auth.js issues only appear deployed).
4. Meetings list with cache + stale fallback.
5. Notes editor with 100KB cap.
6. Process-notes Bedrock flow.
7. Decision Log + Action Tracker pages.
8. Harden: e2e, production deploy, governance-doc rewrites.

## 6. Cost Model (demo usage: ~2 users, ~300 loads, ~100 AI runs/month)

Lambda, CloudFront, DynamoDB storage, SSM, CloudWatch: $0 (always-free tiers). DynamoDB on-demand R/W ≈ $0.02; S3 (OpenNext assets) ≈ $0.03; Bedrock Haiku ≈ $0.80. **Total ≈ $0.85/month**, linear in Bedrock usage.

## 7. Risks

1. Auth.js behind CloudFront: `trustHost`, stage-correct `AUTH_URL`, no custom cache behaviors over `/api/auth/*`; failures appear only deployed (Phase 3 gate exists for this).
2. Bedrock model access is a manual per-account console step; IAM must include all profile-region foundation-model ARNs (silent AccessDenied otherwise).
3. Entra: exact callback path; missing `offline_access` silently yields no refresh token; refresh tokens rotate on every use; client secrets expire ≤24 months.
4. DynamoDB 400KB item limit → 100KB note cap enforced server-side.
5. Time zones: UTC at every boundary or GSI date sorting breaks across DST.
6. Haiku may infer owners/deadlines from vague notes → nullable fields + prompt forbids guessing.

## 8. Testing

- **Unit (vitest, no AWS):** crypto roundtrip/tamper/IV uniqueness; zod accept/reject matrix + corrective-retry trigger (mocked Converse); token refresh state machine (fresh / expired / rotation persisted / `invalid_grant` / concurrent refresh); Graph event mapper from a real JSON fixture; key builders.
- **E2E (Playwright):** sign in → meetings list → open meeting → paste fixture notes → process → decisions/actions/summary render → appear on `/decisions` and `/actions`. CI runs with `FAKE_INTEGRATIONS=1` (fixture Graph/Bedrock/auth); a manual pre-release run uses a real test M365 account.

## 9. Documentation Updates (in scope)

- `TECHSTACK.md`: full rewrite to the AWS stack above.
- `README.md`: mission/North Star → meeting-lifecycle pitch; module list → the six features with slice-1 status.
- `.env.example`: drop Supabase/OpenAI/Stripe/Inngest/Upstash; keep `AUTH_*`, `ENCRYPTION_KEY`; add `AWS_REGION`, `BEDROCK_MODEL_ID`.
- `setup/docs/AGENT_HANDBOOK.md`: module list / MVP scope → six features.
- `setup/docs/SECURITY_ARCHITECTURE.md`: follow-up flagged — RLS section becomes DynamoDB per-user-partition isolation; §2.3 encryption spec carries over unchanged.
