# Ops Agenda — Technology Stack

> **Status:** Architecture decision updated 2026-07-29. Phase 1 spine will be built on AWS using free-tier-optimized services for security control and tenant isolation. The previous Supabase/Vercel/Inngest stack is superseded for v1.

---

## Application Type

**SaaS** — Multi-tenant web application with Microsoft 365 integration and AI-powered data processing.

---

## Technology Stack

| Layer                   | Technology                                                     | Status          |
| ----------------------- | -------------------------------------------------------------- | --------------- |
| **Framework**           | Next.js 15+ (App Router, TypeScript strict, standalone output) | Confirmed       |
| **Database**            | Amazon RDS PostgreSQL 16+ (forced RLS, IAM auth)               | Confirmed       |
| **Auth**                | Amazon Cognito (Hosted UI, OIDC + PKCE, MFA ready)             | Confirmed       |
| **AI/LLM Provider**     | Amazon Bedrock (OpenAI reserved as fallback)                   | Phase 2         |
| **Hosting/Deployment**  | Amazon ECS (EC2 launch type) + CloudFront                      | Confirmed       |
| **Background Jobs**     | Amazon SQS + Lambda + EventBridge                              | Confirmed       |
| **Caching**             | Deferred to Phase 2/3 (ElastiCache has no free tier)           | Planned         |
| **File Storage**        | Amazon S3 (audit mirror, exports, attachments)                 | Confirmed       |
| **Secrets**             | AWS Systems Manager Parameter Store (Standard tier)            | Confirmed       |
| **Primary Integration** | Microsoft 365 (Graph API)                                      | Confirmed (PRD) |
| **AI Output Format**    | JSON-only, schema-validated                                    | Confirmed (PRD) |
| **Payments**            | Stripe                                                         | Planned         |
| **IaC / CI/CD**         | AWS CDK (TypeScript) + GitHub Actions (OIDC)                   | Confirmed       |

### Decision Rationale

| Choice                                        | Why                                                                                                                                                       |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AWS (vs. Supabase/Vercel)**                 | Required by project owner for direct control over security, data protection, VPC networking, and SOC 2 evidence collection.                               |
| **RDS PostgreSQL (vs. Aurora Serverless v2)** | `db.t3.micro` is included in the 12-month AWS free tier; Aurora Serverless v2 has no free tier and a higher floor cost.                                   |
| **ECS EC2 launch type (vs. Fargate)**         | `t3.micro` free-tier hours can cover the container host; Fargate is pay-per-use with no free tier.                                                        |
| **Amazon Cognito**                            | 50,000 MAUs free tier; built-in hosted UI, OIDC/PKCE, MFA, and adaptive security features.                                                                |
| **SQS + Lambda + EventBridge**                | Free-tier generous; replaces Inngest for async, idempotent background processing.                                                                         |
| **SSM Parameter Store**                       | Standard parameters are free; replaces Secrets Manager to avoid per-secret cost in dev/staging.                                                           |
| **CloudFront**                                | Free-tier data transfer; placed in front of the origin to enable CDN caching and future WAF integration.                                                  |
| **ALB deferred**                              | ~$18–22/mo minimum; for Phase 1 free-tier target, CloudFront points directly at the ECS service origin. ALB can be added later for multi-service routing. |
| **OpenSearch / ElastiCache deferred**         | Neither has a free tier; Postgres full-text search covers launch search needs.                                                                            |

---

## Required Capabilities (from PRD)

### Must Have

- [x] Microsoft Graph API integration (Mail.Read, Calendars.Read)
- [x] OAuth 2.0 authentication flow
- [ ] AI/LLM API integration with JSON structured output (Phase 2)
- [x] PostgreSQL database with tenant isolation (forced RLS)
- [x] Background job processing (async, idempotent)
- [ ] Real-time or near-real-time dashboard updates (cached reads in Phase 1)
- [x] Responsive web UI (no native mobile in v1)

### Should Have

- [ ] Caching layer for dashboard performance (< 2s load) — deferred
- [ ] Webhook support for M365 push notifications (Phase 2)
- [ ] Subscription/payment processing (Stripe) (Phase 3)
- [x] Audit logging (immutable, SOC 2 aligned) — S3 mirror

---

## Integration Requirements

### Microsoft 365 (Primary)

- **Protocol:** Microsoft Graph API v1.0
- **Auth:** OAuth 2.0 Authorization Code Flow via Cognito OIDC or direct M365 OAuth
- **Scopes:** `Mail.Read`, `Calendars.Read` (least-privilege)
- **Data:** Email metadata only — no raw bodies stored
- **Sync:** Incremental sync with delta tokens, idempotent
- **Background:** SQS → Lambda for async sync processing

### AI / LLM (Phase 2)

- **Target:** Amazon Bedrock (Claude / Nova)
- **Fallback:** OpenAI GPT-4o / GPT-4o-mini if Bedrock models are insufficient
- **Output:** JSON-only via tool-use / response format
- **Features:** Priority classification (P1/P2/P3/FYSA), due-out detection, narrative generation, draft replies
- **Requirements:** Confidence scores on all classifications, user corrections logged
- **Constraint:** No autonomous actions (AI suggests, user approves)

### Stripe (Payments)

- **Features:** Subscription management, usage-based billing
- **Integration:** Stripe Checkout, Customer Portal, Webhooks

---

## Non-Functional Requirements

| Requirement          | Target                           | Solution                                                                  |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------- |
| Dashboard load time  | < 2 seconds                      | Server Components, lean queries, no client fetch of sensitive collections |
| Data retention       | 30 days default                  | PostgreSQL + S3 lifecycle policies                                        |
| Encryption           | At rest + in transit             | RDS storage encryption + TLS 1.3 via CloudFront/origin                    |
| Audit logs           | Immutable                        | Append-only `audit_event` table + S3 Object Lock mirror                   |
| Tenant isolation     | Required                         | Forced RLS policies + transaction-scoped `app.account_id`                 |
| Background jobs      | Async, non-blocking, idempotent  | SQS + Lambda with idempotency keys                                        |
| Graceful degradation | If AI unavailable, show raw data | Application-level fallback                                                |

---

## Architecture Principles (from PRD)

- **Modular:** Each module (Daily Ops Brief, Priority Inbox, etc.) is independently deployable
- **Event-driven:** Internal communication between modules via SQS events
- **Extensible:** Must support future team/org expansion without refactor
- **Security-first:** SOC 2 aligned, least-privilege, no raw email storage

---

## Security Architecture

For implementation-level security design (encryption, authentication flows, RLS patterns, GDPR/CCPA compliance), see [SECURITY_ARCHITECTURE.md](setup/docs/SECURITY_ARCHITECTURE.md).

---

> See [TECHNOLOGY_DISCOVERY.md](setup/docs/TECHNOLOGY_DISCOVERY.md) for the original requirements checklist.
