# 8. Portal feature requirements

**Status:** Confirmed 2026-07-29  
**Authoritative product definition:** this handoff package (`01`–`07` + prototype).  
**Legacy mapping:** `setup/docs/DEVELOPMENT_ORCHESTRATION.md` FR-001–006 map into Dashboard / Productivity / Ask — do not build a parallel MVP app.

Behavioural copy and interaction detail: `design/Ops Agenda - Prototype.dc.html`.

---

## 0. Confirmed analysis scope

| Decision | Choice |
|----------|--------|
| Primary inventory | **Full portal** — 11 nav groups, ~63 screens, 8 gated modules |
| Depth artefacts | Per-screen FR/AC matrix (§2) + Phase 1 shell/Tasks acceptance checklist (§3) |
| Scaffold gap | Current `src/` vs Phase 1 exit criteria (§3.3) |
| Deferred | Continuity + Social (Phase 5); Health scoring forever forbidden |

**Module gating:** Plan, Productivity, Finances, Business, Health, Life, Research, Social are plan-limited and user-toggleable. Off = **absent** (not greyed). Dashboard, Ask, Alerts, Settings always present.

**Plans:** Personal $19/mo (Plan + Productivity; 1 entity) · Professional $39/mo (+ Finances, Research; 3 entities) · Operator $79/mo (all 8; unlimited).

**Product principle:** AI proposes; user approves. Read-mostly external systems. No money movement, no credential storage, no autonomous filing/sending.

---

## 1. Shared contracts (apply unless a screen is custom)

### 1.1 Scaffolded table (`06-screens.md` §2) — ~35 screens

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| ST-01 | Page header: eyebrow (group, `signal`), H1, one-sentence subtitle, primary action | Matches prototype density/tokens |
| ST-02 | Four metric cards above the table | Live counts from aggregate queries |
| ST-03 | Filter chips: All / Needs attention / Settled with live counts | Predicates per `02-data-model.md` §4; one aggregate query, not one per chip |
| ST-04 | Server-side pagination, sort, filter, search | No client-side filter over full fetch |
| ST-05 | Flagged rows: 3px left border in status colour | Handled rows: plain border only — never strikethrough / grey text |
| ST-06 | Row expansion: fields + why-flagged sentence (evidence-quote) | Non-flagged rows must not use flagged language |
| ST-07 | Actions: Flagged → Mark handled · Handle now · Edit; Handled → Reopen · Edit; Neutral → Edit | Contextual only |
| ST-08 | Edit form uses screen-specific columns | Save persists across filter, search, navigation |
| ST-09 | Filter/search/selection reset on screen change | Intentional |
| ST-10 | Mobile (`< lg`): stacked cards, no horizontal table scroll | Phone = triage (read, mark handled, open); full edit = desktop |

### 1.2 Record pattern (`02-data-model.md` §4)

Every collection record carries: `account_id`, `entity_id`, `title`, `status`, `priority`, `due_on`, `owner_user_id`, `flag_state`, **`flag_reason_code`**, **`flag_reason_text`**, `handled_at`/`handled_by`, optional `source_connection_id` + `source_external_id` (idempotency).

### 1.3 Per-screen definition of done (`07-delivery-plan.md` §2)

1. Server-side render; no client fetch of sensitive collections  
2. Mutations: Zod → `authorize()` (module + role + entity + record) → mutate → audit → revalidate  
3. Tenant isolation covered by `test:rls`  
4. Pagination/sort/filter/search server-side  
5. Empty, loading, error states designed (no spinner-only / cheerful empty)  
6. Keyboard operable; axe clean; visible focus  
7. Copy matches prototype, including compliance sentences  
8. No sensitive fields in logs/traces/errors  
9. Playwright: happy path + one failure path  
10. Responsive per `06-screens.md` §9  

### 1.4 Cross-cutting NFRs

| ID | Requirement |
|----|-------------|
| NFR-T | Forced RLS on `account_id`; transaction-scoped `set_config` |
| NFR-A | Cognito Hosted UI; MFA required when Finances/Business/Life enabled; step-up for sensitive actions |
| NFR-AI | Structured/validated AI output where consumed by code; no autonomous side effects |
| NFR-C | Connectors read-only; tokens in Secrets Manager only; health states `healthy\|degraded\|pending\|revoked` |
| NFR-P | Dashboard load &lt; 2s (handbook) |
| NFR-A11Y | WCAG 2.2 AA in CI |
| NFR-COPY | Prototype copy is enforceable (FTC Act §5 representations) |

---

## 2. Per-screen FR / AC matrix

**Legend — Pattern:** `solo` · `table` · `custom` · `wizard`  
**Phase:** delivery phase from `07-delivery-plan.md`  
**Legacy:** maps from handbook FR-001–006 where applicable

### 2.1 Always-on chrome & flows

| ID | Screen | Route | Pattern | Phase | Functional requirements | Acceptance criteria |
|----|--------|-------|---------|-------|-------------------------|---------------------|
| CH-01 | App shell | `(app)/layout` | custom | 1 | Sidebar with live counts (~12), module gating by entitlement, entity switcher (persist **per screen**), command palette (⌘K), degraded sync banner | Off modules absent; counts from one cached aggregate; banner copy names cause + time; pending included in degraded list |
| CH-02 | Degraded banner | shell | custom | 1–2 | Surfaced when any connection `degraded\|pending\|revoked` | Cleared via Settings → Integrations reconnect; agrees with Integrations badge |
| CH-03 | Command palette | shell | custom | 1 | Jump to any screen or record with module path | Record-level results when indexed |
| ON-01 | Onboarding Welcome | `(onboarding)/welcome` | wizard | 1 | Explain read / decide / watch | Exact prototype copy |
| ON-02 | Choose modules | `…/modules` | wizard | 1 | Enable only needed modules | Off modules hidden completely after finish |
| ON-03 | Connect accounts | `…/accounts` | wizard | 1 stub / 2 real | Mail + calendar incl. shared; **read-only** | Honest failure (no fake success); compliance copy present |
| ON-04 | Set up entities | `…/entities` | wizard | 1 | Name personal + business entities | Attribution ready for deadlines/transactions/filings |
| ON-05 | Financial sources | `…/finance` | wizard | 1 stub / 3 real | Balances/transactions/payouts read-only | Promise: see/flag/forecast, never move money |
| ON-06 | Notifications | `…/notifications` | wizard | 1 | Brief every morning; quiet defaults | Consent captured for email/push |
| ON-07 | First brief | `…/brief` | wizard | 1 stub / 2 real | Run live with connected data | Failures surfaced honestly |
| AUTH-01 | Sign-in / callback | `(auth)/*` | custom | 1 | Cognito Hosted UI, OIDC+PKCE, session cookie | MFA enrol path; device management hooks |

### 2.2 Dashboard, Ask, Alerts

| ID | Screen | Route | Pattern | Phase | Functional requirements | Acceptance criteria |
|----|--------|-------|---------|-------|-------------------------|---------------------|
| DA-01 | Dashboard | `/dashboard` | custom | 2 | Today’s ranked agenda, metrics, at-risk callouts, cross-module jumps | Loads &lt; 2s; every item explainable; Top priorities scannable &lt; 30s (**legacy FR-001**) |
| ASK-01 | Ask | `/ask` | custom | 3+ | Streaming chat over tenant + enabled-module data only | May draft/navigate; must not send/schedule/pay/file/delete; drafts need approval (**legacy FR-005** draft path) |
| AL-01 | Alerts | `/alerts` | solo/table | 2–3 | Cross-module alert inbox; sidebar badge | Everything flagged can land here and in the 6:00 brief |

### 2.3 Plan

| ID | Screen | Route | Pattern | Phase | Functional requirements | Acceptance criteria |
|----|--------|-------|---------|-------|-------------------------|---------------------|
| PL-01 | Goals | `/plan/goals` | table | 3 | Targets; **progress derived** from Projects/Compliance/Capacity — not hand-entered | ST-* + derived progress visible |
| PL-02 | Habits | `/plan/habits` | table | 3 | Habit + entries | ST-* |
| PL-03 | Projects | `/plan/projects` | custom | 3 | Milestones, task list, linked records, activity feed | Bidirectional `record_link` navigable |
| PL-04 | Journal | `/plan/journal` | custom | 3 | Body, considered options, rationale, revisit date, follow-ups, tags, typed links | Tier 0 body encryption; links are typed refs |
| PL-05 | Review | `/plan/review` | custom | 3 | Keep / shrink / drop ritual with **real cost** of each | Cost figures traceable to source records |

### 2.4 Productivity

| ID | Screen | Route | Pattern | Phase | Functional requirements | Acceptance criteria |
|----|--------|-------|---------|-------|-------------------------|---------------------|
| PR-01 | Briefs | `/productivity/briefs` | table/custom | 2 | History of generated `brief` + `brief_item` | `model_id`, `prompt_version`, `input_digest` persisted; dismiss/reorder feedback captured |
| PR-02 | Email | `/productivity/email` | table | 3 | **Ranking surface only** — metadata + derived signals | **Never store bodies/attachments**; open in provider (**legacy FR-002, FR-003**) |
| PR-03 | Calendar | `/productivity/calendar` | table/custom | 3 | Multi-calendar events; prep + conflict signals | All calendars reflected (**legacy FR-004**) |
| PR-04 | Tasks | `/productivity/tasks` | table | **1** | Full CRUD over `task` record pattern | Phase 1 exit: ST-* + authorize + audit + a11y + Playwright |
| PR-05 | Capacity | `/productivity/capacity` | custom/derived | 3 | Week capacity from time/calendar | Derived, not free-form forecast dump |
| PR-06 | Time | `/productivity/time` | table | 3 | Time entries (client, entity, billable) | Feeds Capacity + Project health |
| PR-07 | Contacts | `/productivity/contacts` | table | 3 | Contact records | ST-* |

### 2.5 Finances

| ID | Screen | Route | Pattern | Phase | Functional requirements | Acceptance criteria |
|----|--------|-------|---------|-------|-------------------------|---------------------|
| FI-01 | Overview | `/finances/overview` | custom | 3 | Committed-flow model, safe-to-spend | Figures traceable; never “move money” |
| FI-02 | Personal | `/finances/personal` | table | 3 | Personal account refs + transactions | Tier 1 encryption on identifiers |
| FI-03 | Business | `/finances/business` | table | 3 | Business accounts/transactions by entity | Entity switch scopes data |
| FI-04 | Subscriptions | `/finances/subscriptions` | table | 3 | Vendor, cycle, renews_on, seats, last_used | Flag renewals / unused seats |
| FI-05 | Budgets | `/finances/budgets` | table | 3 | Budget + periods | ST-* |
| FI-06 | Taxes | `/finances/taxes` | table | 3 | Obligations + set-aside; W-9→1099 gate from Vendors | Missing W-9 blocks 1099 path |
| FI-07 | Forecast | `/finances/forecast` | custom | 3 | **Derived** from committed flows + assumptions only | UI states figures are traceable; no stored projection rows as truth |
| FI-08 | Investments | `/finances/investments` | table | 3 | Holdings | ST-* |
| FI-09 | Insurance | `/finances/insurance` | table | 3 | Policies | ST-* |
| FI-10 | Documents | `/finances/documents` | table | 3 | Financial documents | Tier 1 where applicable |
| FI-11 | Reports | `/finances/reports` | table/custom | 3 | Report defs + runs; export via presigned URL | Export writes audit event |

### 2.6 Business

| ID | Screen | Route | Pattern | Phase | Functional requirements | Acceptance criteria |
|----|--------|-------|---------|-------|-------------------------|---------------------|
| BU-01 | Entities | `/business/entities` | custom | 3 | Detail tabs: overview / compliance / finance; dormancy; dissolution | Dissolution **not offered** while revenue flows through entity |
| BU-02 | Compliance | `/business/compliance` | custom | 3 | Obligation calendar: jurisdiction, form, due, cadence, penalty, reminder ladder | Penalty text visible; reminders fire on ladder |
| BU-03 | Pipeline | `/business/pipeline` | custom | 3 | Stage board, weighted value, staleness | **GovCon/CUI decision** gates FCI/CUI storage |
| BU-04 | Contracts | `/business/contracts` | table | 3 | MSA/SOW/NDA; auto_renew; notice_days | Renewal feeds Compliance + Forecast |
| BU-05 | Vendors | `/business/vendors` | table + detail | 3 | Vendor records; W-9 status | Missing W-9 red-flags and gates 1099 |

### 2.7 Health

| ID | Screen | Route | Pattern | Phase | Functional requirements | Acceptance criteria |
|----|--------|-------|---------|-------|-------------------------|---------------------|
| HE-01 | Overview | `/health/overview` | custom | 3 | Logging hub | **No scoring / wellness index / trend verdicts** |
| HE-02 | Exercise | `/health/exercise` | custom | 3 | Activity logging | Trends not verdicts |
| HE-03 | Food | `/health/food` | custom | 3 | Meal/hydration | Same constraints |
| HE-04 | Mental | `/health/mental` | custom | 3 | Check-ins as written | Support resources without recording why asked |
| HE-05 | Spiritual | `/health/spiritual` | custom | 3 | Practice logging | No scoring |
| HE-06 | Appointments | `/health/appointments` | table/custom | 3 | Appointments | Reminder allowed |
| HE-07 | Medications | `/health/medications` | table/custom | 3 | Meds + refill | **Refill reminders only** — never dose/symptom/habit alerts |
| HE-08 | Metrics | `/health/metrics` | custom | 3 | Metric readings as trends | No alert because a number moved |
| HE-09 | Records | `/health/records` | table | 3 | Provider documents/claims | Counsel HIPAA BA determination first; Tier 0/1 encryption; no third-party trackers |

### 2.8 Life

| ID | Screen | Route | Pattern | Phase | Functional requirements | Acceptance criteria |
|----|--------|-------|---------|-------|-------------------------|---------------------|
| LI-01 | Home | `/life/home` | table | 3 | Home items, warranty, maintenance | ST-* |
| LI-02 | Vehicles | `/life/vehicles` | table | 3 | Registration, inspection, service, insurance | ST-* |
| LI-03 | People | `/life/people` | table | 3 | Relationships, birthdays, last contact, gifts | ST-* |
| LI-04 | Travel | `/life/travel` | table/custom | 3 | Trips + expenses | Expenses land in Finances |
| LI-05 | Documents | `/life/documents` | table | 3 | Docs with `expires_on` | Expiry watch feeds Alerts/brief |
| LI-06 | Education | `/life/education` | table/custom | 3 | Courses, assignments, credentials (CEU/PDU) | Progress → Documents expiry watch |
| LI-07 | Continuity | `/life/continuity` | custom | **5** | Break-glass vault: pointers only, **no credentials** | Identity verify every time; 72h delay; dual notify; deny window; Tier 0 encryption; dedicated security review before build |

### 2.9 Research

| ID | Screen | Route | Pattern | Phase | Functional requirements | Acceptance criteria |
|----|--------|-------|---------|-------|-------------------------|---------------------|
| RE-01 | Seek | `/research/seek` | custom | 3 | Investigation: plan → retrieve → synthesise → persist | Citations are real clickable rows; per-tenant KB namespace; bounded cost/time; untrusted web content |
| RE-02 | Library | `/research/library` | table | 3 | Saved findings/notes with tags | Citable in decisions / Journal |
| RE-03 | News | `/research/news` | table | 3 | Feeds + digest items | ST-* |

### 2.10 Social (post-launch)

| ID | Screen | Route | Pattern | Phase | Functional requirements | Acceptance criteria |
|----|--------|-------|---------|-------|-------------------------|---------------------|
| SO-01 | Calendar | `/social/calendar` | custom | 5 | Content calendar | Feature-gated until platforms connected |
| SO-02 | Drafts | `/social/drafts` | table | 5 | Post drafts + approval_state | Human approval before publish |
| SO-03 | Publishing | `/social/publishing` | custom | 5 | Per-platform publish attempts | Blocked on app reviews (multi-week external dependency) |
| SO-04 | Analytics | `/social/analytics` | custom | 5 | Engagement metrics | Post-launch |

### 2.11 Settings

| ID | Screen | Route | Pattern | Phase | Functional requirements | Acceptance criteria |
|----|--------|-------|---------|-------|-------------------------|---------------------|
| SE-01 | Profile | `/settings/profile` | form | 1 | Name, timezone (IANA — required for 6:00 brief), locale | Timezone stored, never inferred |
| SE-02 | Modules | `/settings/modules` | form | 1 | Enable/disable modules within plan | Off = absent; data retained 30 days then hard-deleted |
| SE-03 | Security | `/settings/security` | form | 1 | MFA, devices, remote sign-out | Step-up for sensitive actions |
| SE-04 | Integrations | `/settings/integrations` | custom | 1 stub / 2 real | Connection health + reconnect | States + banner agreement (`06-screens.md` §6) |
| SE-05 | Automations | `/settings/automations` | table | 3 | User automations (propose-only) | No autonomous external side effects without approval |
| SE-06 | Notifications | `/settings/notifications` | form | 1–2 | Brief + alert prefs | Unsubscribe honoured ≤10 days |
| SE-07 | Entities | `/settings/entities` | form/table | 1 | Manage entities | Aligns with Business → Entities |
| SE-08 | Billing | `/settings/billing` | form | 3–4 | Plan/Stripe Checkout | Card data never on own forms (SAQ A) |
| SE-09 | Team | `/settings/team` | table | 5 (partial 1 model) | RBAC per **module** and **entity** | Accountant can see Finances for two entities only |

### 2.12 Brief pipeline (feeds Dashboard / Briefs — not a nav screen)

| ID | Step | Phase | Requirement | Acceptance criteria |
|----|------|-------|-------------|---------------------|
| BP-01 | Gather / Enrich / Pre-rank | 2 | Deterministic SQL; ~40 candidate cap | No model; enabled modules only |
| BP-02 | Rank (Bedrock) | 2 | Structured JSON: priority, reason_code, reason_text, proposed_action | Eval harness + golden set gate regressions |
| BP-03 | Validate / Persist / Deliver | 2 | Reject hallucinated records; SES + push by 06:05 local | Fallback to deterministic ranking; paged SLO |

### 2.13 Cross-module flows (must not be lost)

| ID | Flow | Acceptance criteria |
|----|------|---------------------|
| XF-01 | Travel expenses → Finances | Expense creates/links finance record |
| XF-02 | Time → Capacity → Project health | Derived, not duplicated manually |
| XF-03 | Contract renewal → Compliance + Forecast | Both surfaces update |
| XF-04 | Missing W-9 → blocks 1099 → Taxes | UI red flag + gate |
| XF-05 | CEU progress → Documents expiry watch | Alerts/brief eligible |
| XF-06 | Goal progress from Projects/Compliance/Capacity | Not hand-entered |
| XF-07 | Journal/Project linked records | Bidirectional typed `record_link` |
| XF-08 | Research → Library → citable | Citation rows preserved |
| XF-09 | Any record → Seek | Trigger ref stored on investigation |
| XF-10 | Everything flagged → 6:00 brief + Alerts | Flag predicates consistent |

### 2.14 Legacy FR mapping

| Legacy | Portal home |
|--------|-------------|
| FR-001 Daily Ops Brief | DA-01 Dashboard + PR-01 Briefs + BP-* |
| FR-002 Priority Inbox | PR-02 Email ranking |
| FR-003 Due-Out Detection | Flags on email/tasks → brief/Alerts |
| FR-004 Calendar Intelligence | PR-03 Calendar |
| FR-005 Draft Reply | ASK-01 drafts (never auto-sent) |
| FR-006 Weekly Outlook | PR-05 Capacity + brief horizon |

---

## 3. Phase 1 — Shell + Productivity → Tasks acceptance checklist

Source: `07-delivery-plan.md` Phase 1 exit + §2 DoD + critical E2E subset that applies without live connectors.

### 3.1 Platform spine

| # | Criterion | Verify |
|---|-----------|--------|
| P1-01 | Cognito Hosted UI, OIDC+PKCE, session cookies | Sign-in/callback round-trip on staging |
| P1-02 | MFA enrolment path + device management hooks | Enrol TOTP or WebAuthn in UI |
| P1-03 | Step-up challenge stub wired for sensitive actions | Attempt sensitive action → challenge |
| P1-04 | Tables: `account`, `user`, `entity`, `entity_grant`, `module_state`, `audit_event`, `connection` (stub), `task` | Drizzle schema + migrations |
| P1-05 | Forced RLS + transaction-scoped tenant context | `test:rls` blocking in CI |
| P1-06 | Cross-tenant probe denied at DB | E2E #10 (tenant A cannot read B by id) |
| P1-07 | Audit writer + immutable S3 mirror | Mutation writes `audit_event` + S3 object |
| P1-08 | Redacting logger (allowlist) | Unit test: sensitive fields stripped |
| P1-09 | Design system primitives + `Lockup` | Tokens from `05-design-system.md` |
| P1-10 | WCAG harness in CI | axe (or equivalent) on Tasks + shell |

### 3.2 App shell & onboarding

| # | Criterion | Verify |
|---|-----------|--------|
| P1-11 | Sidebar live counts (fixture/aggregate OK) | Counts render without N+1 |
| P1-12 | Module gating by entitlement | Disabled module route absent from nav and 404/redirect |
| P1-13 | Entity switcher persists **per screen** | Switch on Tasks; other screen retains its own entity |
| P1-14 | Command palette jumps to screens | ⌘K → Tasks / Settings |
| P1-15 | Degraded banner placeholder | Renders from connection status fixture |
| P1-16 | Onboarding wizard: all 7 steps present | Navigate end-to-end; connectors stubbed |
| P1-17 | Onboarding honest failure stub | Failed connector shows failure, not success |

### 3.3 Scaffolded table + Tasks (exit criterion)

| # | Criterion | Verify |
|---|-----------|--------|
| P1-18 | RecordTable anatomy complete (ST-01–ST-10) | Visual + interaction review vs prototype |
| P1-19 | Tasks: list with All / Needs attention / Settled | Counts update on handle |
| P1-20 | Tasks: expand shows why-flagged when flagged | Copy accurate to state |
| P1-21 | Tasks: Mark handled / Reopen / Edit | Audit events for each |
| P1-22 | Tasks: create + edit Zod Server Actions | `authorize(module=productivity, entity, record)` |
| P1-23 | Tasks: filter/search/sort server-side | Large fixture set does not ship full client fetch |
| P1-24 | Tasks: empty/loading/error states | No spinner-only |
| P1-25 | Tasks: keyboard + axe clean | CI green |
| P1-26 | Playwright: Tasks happy path + one failure | e.g. validation error on edit |
| P1-27 | Responsive: stacked cards below `lg` | No horizontal scroll |

**Phase 1 exit statement:** Productivity → Tasks is fully real end-to-end (table, filters, expansion, actions, edit, audit, a11y). Every later module repeats this pattern.

### 3.4 Scaffold gap analysis (`src/` / `packages/` as of 2026-07-29)

| Area | Expected (Phase 1) | Current state | Gap |
|------|-------------------|---------------|-----|
| App routes | `(auth)`, `(onboarding)`, `(app)/…` tree | Default `src/app/page.tsx` Next starter only | **Missing** entire route tree |
| Shell | Sidebar, CmdK, entity switcher, banner | Absent | **Missing** |
| Design system | Tokens + `Lockup` + record components | Absent | **Missing** |
| Drizzle / RLS | Spine tables + `test:rls` | Absent from app packages | **Missing** |
| Cognito auth | Hosted UI + session | Absent | **Missing** |
| Audit / logger | Writer + S3 mirror + redaction | Absent | **Missing** |
| Tasks module | Full ST-* CRUD | Absent | **Missing** |
| Onboarding | 7-step shell | Absent | **Missing** |
| Infra CDK | VPC, ECS EC2, RDS, Cognito, S3, SQS, CF | `packages/infra/` skeletons present | Partial — continue wiring |
| Tooling | Next, Vitest, Playwright, ESLint | `package.json` scripts present; `priority.ts` sample | Starter only |
| AI / Brief / M365 | Phase 2+ | Out of Phase 1 scope | N/A (correctly deferred) |

**Verdict:** Phase 1 portal work is essentially **greenfield in `src/`**; infra package is the only meaningful head start. Use this checklist as the build backlog order: tenancy/RLS → shell → RecordTable → Tasks → onboarding shell → auth polish.

### 3.5 Phase 1 critical E2E (subset)

| # | Flow | Phase 1 expectation |
|---|------|---------------------|
| E2E-01 | Sign up → MFA → onboarding 7 steps | Shell + stubs; first brief stubbed |
| E2E-04 | Table filter → search → expand → edit → persist | **Must pass** on Tasks |
| E2E-05 | Entity switch scopes data | **Must pass** on Tasks across ≥2 entities |
| E2E-06 | Module disable → absent → re-enable ≤30d data intact | **Must pass** for Productivity |
| E2E-10 | Cross-tenant read denied at DB | **Must pass** |

Flows requiring live mail/brief (E2E-02, E2E-03) are Phase 2.

---

## 4. Open decisions that still gate later portal work

1. **GovCon/CUI** — before Pipeline stores FCI/CUI (`03-security-compliance.md` §3b).  
2. **HIPAA BA** — before Health Records/Claims.  
3. **Financial aggregator** — before Finances connectors.  
4. **Hosting shape** — handoff prefers Fargate; Phase 1 ADR uses ECS EC2 free-tier; revisit before compliance audit.  
5. **Logotype** — Poppins vs Geist 900 (Lockup single component).

---

## 5. Document control

| Field | Value |
|-------|-------|
| Created | 2026-07-29 |
| Sources | `README.md`, `01`–`07`, `03` §5 email rules, `04` brief/Ask/Seek, active Phase 1 context |
| Supersedes | Narrow handbook MVP as the portal inventory (legacy FRs remain mapped in §2.14) |
