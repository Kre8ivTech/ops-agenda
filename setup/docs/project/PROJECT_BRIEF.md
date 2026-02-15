# Ops Agenda — Project Brief

**Version:** 1.0  
**Date:** February 15, 2026  
**Status:** Approved for Build  
**Author:** Jeremiah Castillo, Kre8ivTech

---

## Vision Statement

Ops Agenda transforms how professionals manage their day by automatically converting scattered Microsoft 365 email and calendar data into a clear, prioritized operational agenda — delivered every morning with AI-powered insights.

---

## Problem Statement

Professionals spend 30+ minutes every morning:
- Scanning hundreds of emails to find what's urgent
- Manually checking calendars for conflicts and prep needs
- Mentally prioritizing tasks without clear deadlines
- Switching between email, calendar, and task apps

**Result:** Delayed starts, missed deadlines, meeting unpreparedness, and constant context-switching.

---

## Solution

Ops Agenda is an AI-powered SaaS dashboard that:

1. **Syncs** Microsoft 365 email and calendar data (read-only, metadata only)
2. **Analyzes** with OpenAI GPT-4o to detect priorities, deadlines, and meeting prep needs
3. **Generates** a single-screen Daily Ops Brief with:
   - Narrative summary of the day ahead
   - Visual timeline with meetings and focus blocks
   - Top 3 priorities (AI-ranked with confidence scores)
   - Due-outs with deadlines extracted from emails
   - Meeting prep materials
   - Suggested focus blocks

**North Star Feature:** Daily Ops Brief — one screen, complete situational awareness.

---

## Target Users

**Primary Persona:** Mid-to-senior professionals managing 50+ emails/day

- **Demographics:** 30-55 years old, knowledge workers
- **Industries:** Corporate, consulting, legal, finance, healthcare administration
- **Pain Points:** Email overload, meeting fatigue, deadline anxiety
- **Tech Savvy:** Comfortable with Microsoft 365, mobile apps, SaaS tools
- **Budget:** $10-30/month for productivity tools

**Secondary Persona:** Executive assistants managing executive calendars

---

## Success Metrics

### Business Metrics
- **User Acquisition:** 100 beta users in first 3 months
- **Activation Rate:** > 70% complete onboarding and connect M365
- **Retention:** > 60% weekly active users (WAU) after 30 days
- **Revenue:** $5K MRR by month 6

### Product Metrics
- **Dashboard Load Time:** < 2 seconds (p95)
- **AI Accuracy:** > 85% user agreement on priority classifications
- **User Feedback:** < 5% AI corrections per session
- **Sync Reliability:** 99%+ successful M365 syncs

### User Experience
- **Time Saved:** Average 20+ minutes/day vs. manual review
- **NPS Score:** > 40 within first 6 months
- **Feature Usage:** > 80% daily active users view Daily Ops Brief

---

## Core Modules (MVP v1)

| Module | Purpose | Priority |
|--------|---------|----------|
| **Daily Ops Brief** | North Star dashboard — narrative + timeline + Top 3 | P0 (Critical) |
| **Priority Inbox** | P1/P2/P3/FYSA email classification | P0 (Critical) |
| **Due-Out Detection** | AI-extracted deadlines from email content | P0 (Critical) |
| **Calendar Intelligence** | Meeting prep, focus block suggestions | P0 (Critical) |
| **M365 Sync** | Microsoft Graph integration (email + calendar) | P0 (Critical) |
| **AI Pipeline** | OpenAI processing engine with JSON validation | P0 (Critical) |
| **Onboarding** | User setup flow (M365 connect, preferences) | P0 (Critical) |
| **Weekly Outlook** | Week-ahead narrative summary | P1 (High) |
| **Draft Reply** | AI-suggested email responses (user approves) | P2 (Medium) |

---

## Constraints

### Technical Constraints
- **No Raw Email Storage:** Only metadata and AI-generated summaries
- **Read-Only Access:** Mail.Read and Calendars.Read scopes only
- **No Autonomous Actions:** AI suggests, user must approve all actions
- **JSON-Only AI Output:** Schema-validated structured output required
- **Dashboard Performance:** < 2 second load time requirement
- **Serverless Architecture:** Must run on Vercel (Next.js App Router)

### Security & Compliance
- **SOC 2 Alignment:** Encryption at rest/transit, audit logging, tenant isolation
- **Data Retention:** 30 days default, user-configurable deletion
- **GDPR/CCPA Ready:** Data export, deletion, consent tracking
- **Field-Level Encryption:** OAuth tokens encrypted with AES-256-GCM

### Business Constraints
- **Budget:** Bootstrap until product-market fit
- **Timeline:** MVP launch in 12-14 weeks
- **Team:** Solo developer (AI-assisted) initially

---

## Out of Scope (v1)

Explicitly **NOT** building in MVP:

- ❌ Auto-sending, auto-archiving, or auto-flagging emails
- ❌ Team workflows or shared inboxes
- ❌ Native mobile apps (responsive web only)
- ❌ Task manager integrations (Asana, Todoist, etc.)
- ❌ Chat integrations (Slack, Teams messages)
- ❌ File storage/document management
- ❌ CRM integrations
- ❌ Email providers other than Microsoft 365

**Rationale:** Focus on individual Microsoft 365 users, nail the Daily Ops Brief experience, validate product-market fit before expanding.

---

## Architecture Principles

1. **Modular:** Each module independently deployable
2. **Event-Driven:** Internal communication via Inngest events
3. **Extensible:** Support future team/org expansion without refactor
4. **Security-First:** SOC 2 aligned, least-privilege, no raw email storage
5. **AI-Transparent:** Show confidence scores, allow user corrections

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js (App Router) | React SSR, Vercel-optimized, API routes |
| **Database** | Supabase (PostgreSQL) | Managed Postgres + RLS + real-time + storage |
| **AI Provider** | OpenAI (GPT-4o/mini) | Best JSON structured output, function calling |
| **Hosting** | Vercel | Native Next.js, edge functions, preview deploys |
| **Background Jobs** | Inngest | Event-driven, serverless, retries, idempotency |
| **Caching** | Upstash Redis | Serverless Redis, dashboard load optimization |
| **Storage** | Supabase Storage | Same platform as DB, RLS consistency |
| **Auth** | NextAuth.js + Microsoft OAuth | Industry standard, Microsoft provider built-in |
| **Payments** | Stripe | Subscription management, usage-based billing |

**Full rationale:** See `TECHSTACK.md`

---

## Development Approach

### Methodology
- **TDD (Test-Driven Development):** Write tests before implementation
- **Incremental Delivery:** Ship working features every sprint
- **AI-Assisted Development:** Claude, Cursor, Copilot for velocity
- **Progressive Guardrails:** Enforce coding standards automatically

### Quality Gates
- **Unit Tests:** > 80% coverage
- **E2E Tests:** Critical user journeys (Playwright)
- **Security Scans:** Pre-merge (SonarQube, Snyk)
- **Accessibility:** WCAG 2.1 AA compliance
- **Performance:** Lighthouse score > 90

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Microsoft Graph API changes | High | Low | Use stable v1.0 endpoint, monitor changelog |
| OpenAI API costs exceed budget | High | Medium | Use GPT-4o-mini for bulk processing, cache results |
| < 2s dashboard load not achievable | High | Medium | Upstash Redis caching, edge functions, incremental static regeneration |
| User adoption < 70% | High | Medium | Onboarding UX optimization, user feedback loops |
| SOC 2 audit failure | Critical | Low | Follow security architecture from day 1 |

---

## Launch Plan

### Phase 1: Foundation (Weeks 1-4)
- Auth + M365 sync
- Database schema + RLS policies
- AI pipeline (priority classification)

### Phase 2: Core Features (Weeks 5-8)
- Daily Ops Brief dashboard
- Priority Inbox
- Due-Out Detection
- Calendar Intelligence

### Phase 3: Polish (Weeks 9-10)
- Weekly Outlook
- Draft Reply (optional feature)
- Performance optimization
- Accessibility audit

### Phase 4: Pre-Launch (Weeks 11-12)
- Security audit
- Beta user testing
- Documentation
- Monitoring setup

### Phase 5: Launch (Weeks 13-14)
- Production deployment
- Beta user onboarding
- Feedback collection
- Iteration planning

---

## Approval

- [x] PRD v1.0 approved (2026-02-09)
- [x] Technology stack finalized (2026-02-15)
- [x] Security architecture approved (2026-02-15)
- [x] Project brief approved for development (2026-02-15)

**Approved By:** Jeremiah Castillo, Kre8ivTech  
**Next Phase:** Requirements gathering and development sprint planning

---

## References

- **PRD Context:** See `AGENT_HANDBOOK.md`, `TECHSTACK.md`
- **Security:** See `setup/docs/SECURITY_ARCHITECTURE.md`
- **Workflow:** See `setup/docs/WORKFLOW.md`
- **Full Orchestration:** See `setup/docs/DEVELOPMENT_ORCHESTRATION.md`
