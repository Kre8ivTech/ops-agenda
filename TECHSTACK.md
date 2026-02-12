# Ops Agenda — Technology Stack

> **Status:** Pending Architecture phase finalization. This document captures confirmed requirements and initial stack decisions from the PRD.

---

## Application Type

**SaaS** — Multi-tenant web application with Microsoft 365 integration and AI-powered data processing.

---

## Confirmed Stack Decisions

| Layer | Technology | Status |
|-------|-----------|--------|
| **Framework** | Next.js | Confirmed |
| **Primary Integration** | Microsoft 365 (Graph API) | Confirmed (PRD) |
| **Auth** | Microsoft OAuth 2.0 | Confirmed (PRD) |
| **AI Output Format** | JSON-only, schema-validated | Confirmed (PRD) |
| **Payments** | Stripe | Planned |

---

## Pending Decisions (Architecture Phase)

| Layer | Options Under Consideration | Notes |
|-------|---------------------------|-------|
| **Database** | PostgreSQL (Supabase, Neon, self-hosted) | Must support tenant isolation |
| **AI/LLM Provider** | OpenAI, Anthropic, Azure OpenAI | Must support JSON structured output |
| **Hosting/Deployment** | Vercel, AWS, Railway | Must support background jobs |
| **Caching** | Redis, Upstash | For dashboard < 2s load target |
| **Queue/Background Jobs** | BullMQ, Inngest, Trigger.dev | For async M365 sync and AI processing |
| **File Storage** | S3, Supabase Storage | For any attachment handling |

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
- [ ] Caching layer for dashboard performance (< 2s load)
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

### AI/LLM Provider
- **Output:** JSON-only, schema validated on every response
- **Features:** Priority classification (P1/P2/P3/FYSA), due-out detection, narrative generation
- **Requirements:** Confidence scores on all classifications, user corrections logged
- **Constraint:** No autonomous actions (AI suggests, user approves)

### Payments (Stripe — TBD)
- **Features:** Subscription management, usage-based billing
- **Integration:** Stripe Checkout, Customer Portal, Webhooks

---

## Non-Functional Requirements

| Requirement | Target | Source |
|-------------|--------|--------|
| Dashboard load time | < 2 seconds | PRD |
| Data retention | 30 days default | PRD |
| Encryption | At rest + in transit | PRD |
| Audit logs | Immutable | PRD |
| Tenant isolation | Required | PRD |
| Background jobs | Async, non-blocking, idempotent | PRD |
| Graceful degradation | If AI unavailable, show raw data | PRD |

---

## Architecture Principles (from PRD)

- **Modular:** Each module (Daily Ops Brief, Priority Inbox, etc.) is independently deployable
- **Event-driven:** Internal communication between modules via events
- **Extensible:** Must support future team/org expansion without refactor
- **Security-first:** SOC 2 aligned, least-privilege, no raw email storage

---

> **Next step:** Complete Architecture phase to finalize pending decisions. See [TECHNOLOGY_DISCOVERY.md](setup/docs/TECHNOLOGY_DISCOVERY.md) for the full requirements checklist.
