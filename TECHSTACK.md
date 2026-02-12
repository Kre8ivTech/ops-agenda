# Ops Agenda — Technology Stack

> **Status:** Architecture phase complete. All technology decisions finalized.

---

## Application Type

**SaaS** — Multi-tenant web application with Microsoft 365 integration and AI-powered data processing.

---

## Technology Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| **Framework** | Next.js (App Router) | Confirmed |
| **Database** | Supabase (PostgreSQL) | Confirmed |
| **AI/LLM Provider** | OpenAI (GPT-4o / GPT-4o-mini) | Confirmed |
| **Hosting/Deployment** | Vercel | Confirmed |
| **Background Jobs** | Inngest | Confirmed |
| **Caching** | Upstash Redis | Confirmed |
| **File Storage** | Supabase Storage | Confirmed |
| **Auth** | Microsoft OAuth 2.0 (via NextAuth.js) | Confirmed (PRD) |
| **Primary Integration** | Microsoft 365 (Graph API) | Confirmed (PRD) |
| **AI Output Format** | JSON-only, schema-validated | Confirmed (PRD) |
| **Payments** | Stripe | Planned |

### Decision Rationale

| Choice | Why |
|--------|-----|
| **Supabase** | Managed PostgreSQL with built-in RLS for tenant isolation, real-time subscriptions, auth helpers, storage — all in one platform |
| **OpenAI** | Best JSON structured output support (`response_format`), function calling, GPT-4o for quality + GPT-4o-mini for cost optimization |
| **Vercel** | Native Next.js hosting, edge functions, automatic preview deployments, serverless-friendly |
| **Inngest** | Event-driven background jobs, serverless-compatible with Vercel, built-in retries and idempotency for M365 sync and AI processing |
| **Upstash Redis** | Serverless Redis compatible with Vercel edge, pay-per-request pricing, dashboard caching for < 2s load target |
| **Supabase Storage** | Consolidated platform — same project as database, consistent auth/RLS model |

---

## Required Capabilities (from PRD)

### Must Have
- [x] Microsoft Graph API integration (Mail.Read, Calendars.Read)
- [x] OAuth 2.0 authentication flow
- [x] AI/LLM API integration with JSON structured output
- [x] PostgreSQL database with tenant isolation
- [x] Background job processing (async, idempotent)
- [x] Real-time or near-real-time dashboard updates
- [x] Responsive web UI (no native mobile in v1)

### Should Have
- [x] Caching layer for dashboard performance (< 2s load) — Upstash Redis
- [ ] Webhook support for M365 push notifications
- [ ] Subscription/payment processing (Stripe)
- [ ] Audit logging (immutable, SOC 2 aligned)

---

## Integration Requirements

### Microsoft 365 (Primary)
- **Protocol:** Microsoft Graph API v1.0
- **Auth:** OAuth 2.0 Authorization Code Flow
- **Scopes:** `Mail.Read`, `Calendars.Read` (least-privilege)
- **Data:** Email metadata only — no raw bodies stored
- **Sync:** Incremental sync with delta tokens, idempotent
- **Background:** Inngest events for async sync processing

### OpenAI (AI/LLM)
- **Models:** GPT-4o (quality), GPT-4o-mini (cost optimization)
- **Output:** JSON-only via `response_format: { type: "json_object" }`
- **Features:** Priority classification (P1/P2/P3/FYSA), due-out detection, narrative generation, draft replies
- **Requirements:** Confidence scores on all classifications, user corrections logged
- **Constraint:** No autonomous actions (AI suggests, user approves)

### Stripe (Payments)
- **Features:** Subscription management, usage-based billing
- **Integration:** Stripe Checkout, Customer Portal, Webhooks

---

## Non-Functional Requirements

| Requirement | Target | Solution |
|-------------|--------|----------|
| Dashboard load time | < 2 seconds | Upstash Redis caching + Vercel edge |
| Data retention | 30 days default | Supabase PostgreSQL |
| Encryption | At rest + in transit | Supabase (at rest) + Vercel (TLS) |
| Audit logs | Immutable | Supabase table with RLS |
| Tenant isolation | Required | Supabase RLS policies |
| Background jobs | Async, non-blocking, idempotent | Inngest |
| Graceful degradation | If AI unavailable, show raw data | Application-level fallback |

---

## Architecture Principles (from PRD)

- **Modular:** Each module (Daily Ops Brief, Priority Inbox, etc.) is independently deployable
- **Event-driven:** Internal communication between modules via Inngest events
- **Extensible:** Must support future team/org expansion without refactor
- **Security-first:** SOC 2 aligned, least-privilege, no raw email storage

---

> See [TECHNOLOGY_DISCOVERY.md](setup/docs/TECHNOLOGY_DISCOVERY.md) for the full requirements checklist.
