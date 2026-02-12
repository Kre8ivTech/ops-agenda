# Technology Discovery — Ops Agenda

> **Application Type, Capabilities, and Tech Stack for Ops Agenda**

This document captures the technology decisions for Ops Agenda based on the approved PRD.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Application Type](#2-application-type)
3. [Required Capabilities](#3-required-capabilities)
4. [Integration Requirements](#4-integration-requirements)
5. [Infrastructure Requirements](#5-infrastructure-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Extensibility Requirements](#7-extensibility-requirements)
8. [Completion Checklist](#8-completion-checklist)

---

## 1. Overview

### Project Context

```
PROJECT IDENTITY (complete) → Brand Discovery → TECHNOLOGY DISCOVERY (this) →
Conception → Requirements → Architecture → Planning → Development
```

### Application Summary

| Field | Value |
|-------|-------|
| **Product** | Ops Agenda |
| **Type** | SaaS Application |
| **Mission** | Transform email and calendar data into actionable daily/weekly agendas |
| **MVP Users** | Individual professionals (executives, military leaders, entrepreneurs, PMs, consultants) |
| **North Star** | Daily Ops Brief |

### Deliverables

| Artifact | Description |
|----------|-------------|
| `TECH_STACK.md` | Finalized technology decisions |
| `INTEGRATIONS.md` | Third-party integration requirements |
| `INFRASTRUCTURE.md` | Hosting and deployment requirements |

---

## 2. Application Type

**Selected:** SaaS Application (multi-tenant, individual users for MVP)

The architecture must support future team and organization expansion without refactor, but v1 is individual users only.

---

## 3. Required Capabilities

### Authentication & Users

- [x] **OAuth / Single Sign-On** — Microsoft 365 OAuth (required for M365 integration)
- [x] **User Registration** (self-service)
- [x] **User Profiles**
- [ ] Teams/Organizations — future expansion, architecture must support

### Payments & Billing

- [x] **Subscription/Recurring Billing** — user selects plan during onboarding
- [ ] Payment provider to be determined (Stripe recommended)
- [ ] Free trials — to be determined

### Communication

- [x] **Transactional Emails** — account notifications
- [x] **In-app Notifications** — Daily Ops Brief ready
- [ ] Push notifications — future (disruption alerts, due-out warnings, meeting prep reminders)

### Data & Storage

- [x] **Relational Database** — user accounts, preferences, AI summaries, metadata
- [x] **No raw email body storage** — transient processing only
- [x] **AI-generated summaries persisted** — metadata and summaries only
- [x] **30-day default retention** — configurable in future versions

### Frontend

- [x] **Responsive Design** (mobile-first)
- [x] **Server-Side Rendering or Hybrid** — dashboard < 2 second load
- [x] **Accessibility (WCAG 2.1 AA)**

### Backend & API

- [x] **REST API or equivalent**
- [x] **Background Jobs / Queues** — async email/calendar sync, AI processing
- [x] **Scheduled Tasks** — midday disruption scan, EOD wrap-up, incremental sync
- [x] **Webhooks (incoming)** — Microsoft Graph change notifications
- [x] **Rate Limiting**

### AI & ML

- [x] **AI/LLM Integration** — email summarization, action extraction, deadline extraction, priority scoring, draft reply generation
- [x] **JSON-only structured output** — schema validated on every response
- [x] **Confidence scores** — required for each analysis
- [x] **User correction logging** — system improves prioritization over time

### Analytics & Monitoring

- [x] **Error Tracking** — production monitoring
- [x] **Performance Monitoring** — dashboard load, API response times
- [x] **Audit Logging** — immutable, required for compliance

### Security & Compliance

- [x] **SOC 2 aligned architecture**
- [x] **Encryption at rest and in transit**
- [x] **OAuth tokens encrypted**
- [x] **Tenant isolation**
- [x] **Least-privilege integration scopes**
- [x] **Full audit logging**

---

## 4. Integration Requirements

### Microsoft 365 (Primary — MVP)

| Field | Detail |
|-------|--------|
| **Purpose** | Email inbox data and calendar events |
| **Direction** | We call their API (Microsoft Graph) + they call our webhooks (change notifications) |
| **Data exchanged** | Email metadata, calendar events (no raw bodies stored) |
| **Frequency** | Incremental sync + real-time change notifications |
| **Auth** | OAuth 2.0 with least-privilege scopes |
| **Scopes** | Mail.Read, Calendars.Read (minimum required) |

### AI/LLM Provider

| Field | Detail |
|-------|--------|
| **Purpose** | Email summarization, action/deadline extraction, priority scoring, draft replies |
| **Direction** | We call their API |
| **Data exchanged** | Email metadata/content (transient), structured JSON responses |
| **Frequency** | On-demand during sync and brief generation |
| **Output format** | JSON-only, schema-validated, confidence scores required |

### Payment Provider (TBD)

| Field | Detail |
|-------|--------|
| **Purpose** | Subscription billing |
| **Direction** | Bidirectional (checkout + webhooks) |
| **Frequency** | On subscription events |

### Future Integrations (Out of Scope for v1)

- Google email and calendar
- Task management systems
- Teams and Slack context
- Team and delegation workflows

---

## 5. Infrastructure Requirements

### Hosting

The specific hosting platform will be determined during Architecture phase. Key requirements:

- Must support background job processing (async, non-blocking)
- Must support scheduled tasks (cron-style)
- Must support webhook endpoints
- Must support encryption at rest and in transit
- Must provide tenant isolation capability

### Database

- Relational database required (PostgreSQL recommended)
- Must support encryption at rest
- Connection pooling required
- Must support future multi-tenant expansion

### Caching

- Session management
- AI response caching (for Weekly Outlook, cached data)
- Rate limiting storage

### Additional

- Message queue for async job processing
- Secure secret/credential management (OAuth tokens, API keys)

---

## 6. Non-Functional Requirements

### Performance

| Metric | Target |
|--------|--------|
| Dashboard load | < 2 seconds |
| Background jobs | Async and non-blocking |
| Sync operations | Idempotent with retry logic |
| AI processing | Graceful degradation if AI unavailable |

### Reliability

- Idempotent sync and AI jobs
- Graceful degradation if AI unavailable
- Incremental sync with retry logic for integration instability

### Security

- OAuth tokens encrypted
- No credentials stored
- Audit logs immutable
- SOC 2 aligned
- Least-privilege Microsoft Graph scopes

### Data Handling

- No raw email bodies stored
- Only metadata and AI-generated summaries persisted
- Transient processing only for email content
- Default 30-day retention (configurable in future)

---

## 7. Extensibility Requirements

### Modular Architecture (Required)

From the PRD:

- Core platform must not depend on optional features
- New capabilities implemented as modules
- Event-driven internal communication

### Supported Future Modules

| Module | Status |
|--------|--------|
| Google email and calendar | Future |
| Task management systems | Future |
| Teams and Slack context | Future |
| Team and delegation workflows | Future |

---

## 8. Completion Checklist

Before proceeding to Architecture phase:

- [x] Application type selected: SaaS
- [x] All required capabilities identified (see section 3)
- [x] Tech stack finalized: Next.js, Supabase, OpenAI, Vercel, Inngest, Upstash
- [x] Hosting/infrastructure decided: Vercel + Supabase + Inngest + Upstash
- [x] Integrations documented: Microsoft 365, AI/LLM, Payments
- [x] Non-functional requirements captured
- [x] Extensibility requirements captured
- [x] Security architecture documented: [`SECURITY_ARCHITECTURE.md`](SECURITY_ARCHITECTURE.md)

---

*Complete this discovery BEFORE detailed requirements and architecture.*
*See `DEVELOPMENT_ORCHESTRATION.md` for the full workflow.*
