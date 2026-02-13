# Security Architecture — Ops Agenda

> **Status:** Architecture reference — implementation-level security design
> **Last updated:** 2026-02-12
> **Applies to:** v1 (MVP)

This document is the implementation-level security reference for Ops Agenda. It bridges the gap between high-level requirements (TECHSTACK.md, TECHNOLOGY_DISCOVERY.md) and actual code patterns. Developers should consult this before implementing any feature that touches authentication, data storage, encryption, or external APIs.

---

## Table of Contents

1. [Data Classification & Sensitivity](#1-data-classification--sensitivity)
2. [Encryption Architecture](#2-encryption-architecture)
3. [Authentication Flow](#3-authentication-flow)
4. [Authorization & Tenant Isolation](#4-authorization--tenant-isolation)
5. [Data Protection & Privacy (GDPR/CCPA)](#5-data-protection--privacy-gdprccpa)
6. [API & Transport Security](#6-api--transport-security)
7. [Audit Logging](#7-audit-logging)
8. [Secret Management](#8-secret-management)
9. [Security Monitoring & Incident Response](#9-security-monitoring--incident-response)

---

## 1. Data Classification & Sensitivity

**Principle:** ALL user data is treated as sensitive. There is no "public" data tier.

| Tier | Data | Protection |
|------|------|------------|
| **CRITICAL** | OAuth access/refresh tokens, `ENCRYPTION_KEY`, `NEXTAUTH_SECRET` | Field-level AES-256-GCM encryption + environment variables only |
| **SENSITIVE-PII** | Email addresses, display names, calendar subjects, AI summaries containing names/topics | Field-level encryption + Supabase RLS |
| **SENSITIVE-OPERATIONAL** | Email metadata (timestamps, message IDs), AI priority scores, confidence scores, sync delta tokens | Supabase RLS + disk-level encryption |
| **SYSTEM** | Audit logs, Inngest job metadata | Service-role access only + disk-level encryption |

### Transient Data

Raw email bodies are **NEVER stored**. They are passed in-memory to the OpenAI API during AI processing and immediately discarded. This is a hard architectural constraint from the PRD.

### PII Inventory

The following fields constitute PII under GDPR/CCPA and require field-level encryption:

- Email addresses (sender, recipients)
- Display names
- Calendar event titles (may contain personal names)
- Email subject lines (may contain sensitive topics)
- AI-generated summaries (may reference people or sensitive content)

---

## 2. Encryption Architecture

Three layers of encryption protect data at different levels.

### 2.1 At Rest (Disk-Level)

Supabase provides AES-256 disk encryption by default for all stored data. This is the baseline — it protects against physical disk theft but not application-level access. No application code required.

### 2.2 In Transit (TLS 1.3)

All connections enforce TLS:

| Connection | Provider |
|------------|----------|
| Browser ↔ Vercel | Vercel (automatic TLS) |
| Next.js ↔ Supabase | Supabase (enforced TLS) |
| Next.js / Inngest ↔ OpenAI API | OpenAI (TLS) |
| Next.js ↔ Microsoft Graph API | Microsoft (TLS) |
| Next.js ↔ Upstash Redis | Upstash (REST over TLS) |
| Next.js ↔ Stripe API | Stripe (TLS) |

### 2.3 Field-Level Encryption (Application-Level AES-256-GCM)

Sensitive columns are encrypted in the application layer before writing to Supabase and decrypted after reading. This protects data even if the database is compromised.

#### Encrypted Columns

| Table | Column | Reason |
|-------|--------|--------|
| `accounts` | `access_token` | Microsoft OAuth access token |
| `accounts` | `refresh_token` | Microsoft OAuth refresh token |
| `email_metadata` | `subject` | Email subject line (PII) |
| `email_metadata` | `from_address` | Sender email address (PII) |
| `email_metadata` | `to_addresses` | Recipient emails (PII) |
| `ai_summaries` | `summary_text` | May contain PII from emails |

#### Algorithm & Implementation

- **Algorithm:** AES-256-GCM via Node.js built-in `crypto` module (no external dependency)
- **Key:** `ENCRYPTION_KEY` environment variable — 32-byte hex string (256 bits)
- **Storage format:** `v1:iv:authTag:ciphertext` (base64-encoded) — version prefix enables key rotation
- **Utility location:** `src/lib/crypto.ts`
- **Pattern:** Encrypt before every `.insert()` / `.update()`, decrypt after every `.select()` on encrypted columns

#### Key Generation

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Key Rotation

1. Add new key as `ENCRYPTION_KEY_V2` environment variable
2. Application reads version prefix (`v1` vs `v2`) to select the correct key
3. On read: if data is `v1`, decrypt with old key, re-encrypt with new key, write back (lazy migration)
4. Background Inngest job re-encrypts remaining rows
5. Once all rows migrated, remove old key

#### Caveat

Encrypted columns cannot be searched or indexed by PostgreSQL. Design queries to filter by non-encrypted columns (e.g., `user_id`, `message_id`, `created_at`) first, then decrypt results in application code.

---

## 3. Authentication Flow

### 3.1 OAuth Flow

Microsoft OAuth 2.0 Authorization Code Flow via NextAuth.js:

- **Scopes:** `openid`, `profile`, `email`, `offline_access`, `Mail.Read`, `Calendars.Read`
- **Redirect URI:** `{APP_URL}/api/auth/callback/microsoft`
- **Provider:** `MicrosoftProvider` in NextAuth.js configuration
- **Tenant:** `common` (supports personal and organizational accounts)

### 3.2 Database Sessions

Sessions are stored in Supabase, not as JWTs in cookies:

- **Strategy:** `strategy: "database"` with Supabase adapter (`@next-auth/supabase-adapter`)
- **Storage:** `sessions` table in Supabase with RLS enabled
- **Cookie:** Session ID sent as HttpOnly cookie — no user data or tokens in the cookie
- **Lookup:** Every authenticated request queries Supabase to validate the session
- **Benefits:** Server-side revocation, no token size limits, no sensitive data exposed to client

### 3.3 Token Lifecycle

1. User authenticates via Microsoft OAuth → Microsoft returns `access_token` (~1 hour) and `refresh_token` (long-lived)
2. Both tokens are encrypted with AES-256-GCM before storage in the `accounts` table
3. When `access_token` expires: decrypt `refresh_token` → call Microsoft token endpoint → encrypt and store new tokens
4. If `refresh_token` is revoked or expired: user must re-authenticate via OAuth flow
5. Token refresh runs server-side only (Inngest background function or API route)

### 3.4 Session Security

| Setting | Value | Reason |
|---------|-------|--------|
| `HttpOnly` | `true` | Prevents JavaScript access to session cookie |
| `Secure` | `true` (production) | Cookie only sent over HTTPS |
| `SameSite` | `Lax` | Protects against CSRF while allowing navigation |
| `maxAge` | 30 days | Session expiration (configurable via `NEXTAUTH_SESSION_MAX_AGE`) |
| Idle timeout | 7 days | Session expires after 7 days of inactivity |
| CSRF | NextAuth.js built-in | Double-submit cookie pattern, automatic |

---

## 4. Authorization & Tenant Isolation

### 4.1 Supabase RLS (Primary Mechanism)

Every table containing user data **MUST** have Row Level Security enabled — no exceptions.

- **Standard column:** `user_id UUID REFERENCES auth.users(id)` on every user-scoped table
- **Standard policy:** `USING (auth.uid() = user_id)` for SELECT/UPDATE/DELETE, `WITH CHECK (auth.uid() = user_id)` for INSERT
- **Default deny:** RLS enabled with no policies = no access (secure by default)

For SQL patterns and examples, see [`setup/skills/supabase-best-practices/rules/rls-enable-all-tables.md`](../skills/supabase-best-practices/rules/rls-enable-all-tables.md).

### 4.2 Service Role Key Restrictions

`SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS policies. Usage is strictly limited:

- **Allowed:** Inngest background functions, system-level operations (data retention cleanup, audit log writes)
- **Forbidden:** Client-side code, user-facing API routes, Server Components that handle user requests

### 4.3 API Route Authorization Pattern

Every API route and Server Action follows this sequence:

1. Call `getServerSession()` to retrieve the session
2. If no session → return `401 Unauthorized`
3. Extract `user_id` from session
4. Create Supabase client with user context (not service role)
5. All queries are automatically scoped by RLS — no manual `WHERE user_id =` needed

### 4.4 Verification

Periodically audit for tables missing RLS:

```sql
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT tablename FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE c.relrowsecurity = true
);
```

---

## 5. Data Protection & Privacy (GDPR/CCPA)

### 5.1 Data Subject Rights

| Right | Implementation |
|-------|---------------|
| **Access (Data Export)** | `GET /api/user/export` — returns JSON of all user data (profile, email metadata, AI summaries, calendar events, preferences, consent records, user's audit log entries) |
| **Deletion** | `DELETE /api/user/delete` — cascade deletes all user data across all tables, revokes Microsoft OAuth tokens, deletes Supabase auth user. Logs deletion event in audit log (audit entry retained for compliance) |
| **Rectification** | Settings page — users can update profile data directly |
| **Portability** | Same JSON export as data access endpoint |

### 5.2 Consent Tracking

`user_consents` table schema:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Consent record ID |
| `user_id` | UUID FK | References auth.users |
| `consent_type` | TEXT | e.g., `data_processing`, `email_sync`, `ai_analysis` |
| `granted_at` | TIMESTAMPTZ | When consent was given |
| `revoked_at` | TIMESTAMPTZ | When consent was revoked (null if active) |
| `ip_address` | INET | IP at time of consent action |

Consent is captured during the onboarding flow. Users can revoke consent via settings.

### 5.3 Data Retention

| Data Type | Retention | Cleanup Method |
|-----------|-----------|---------------|
| Email metadata + AI summaries | 30 days (default) | Inngest daily cron job |
| User account data | Until user deletes account | Manual via `/api/user/delete` |
| Audit logs | 1 year minimum | Inngest monthly cleanup for records > 1 year |
| Session data | 30 days (session maxAge) | NextAuth.js automatic cleanup |

Audit logs are **excluded** from user data deletion to maintain compliance records. They are included (read-only) in data export.

### 5.4 Cookies

v1 uses only essential cookies:

| Cookie | Purpose | Consent Required |
|--------|---------|-----------------|
| `next-auth.session-token` | Session ID | No (strictly necessary) |
| `next-auth.csrf-token` | CSRF protection | No (strictly necessary) |

No analytics or marketing cookies in v1. If added later, a cookie consent banner will be required.

---

## 6. API & Transport Security

### 6.1 Security Headers

Applied via `next.config.js` `headers` configuration or `middleware.ts`:

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.supabase.co https://graph.microsoft.com https://api.openai.com https://api.stripe.com` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

### 6.2 Rate Limiting

Via `@upstash/ratelimit` with Upstash Redis:

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Authenticated API routes | 100 requests | Per minute, per user |
| Auth endpoints (login, callback) | 10 requests | Per minute, per IP |
| Data export / deletion | 5 requests | Per hour, per user |

Implementation location: `middleware.ts` or per-route wrapper utility.

### 6.3 CORS

Same-origin only (Next.js default). No cross-origin API access in v1. If CORS is needed for a future mobile app, use an explicit allowlist — never `*`.

### 6.4 Webhook Validation

| Provider | Validation Method |
|----------|-------------------|
| **Microsoft Graph** | Verify `validationToken` query parameter on subscription creation; verify notification signatures with client state |
| **Stripe** | `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)` |
| **Inngest** | Verify `INNGEST_SIGNING_KEY` on incoming event payloads |

All webhook endpoints must validate signatures before processing. Reject unverified payloads with `400 Bad Request`.

---

## 7. Audit Logging

### 7.1 Audited Events

| Category | Events |
|----------|--------|
| **Authentication** | Login success/failure, logout, session creation/expiration, token refresh |
| **Data Access** | Data export requested, data deletion requested/completed |
| **User Actions** | Consent granted/revoked, settings changed, profile updated |
| **AI Processing** | Brief generated, priority classification run (log event type, not content) |
| **Sync** | M365 sync started/completed/failed |
| **Security** | Rate limit triggered, authorization denied, webhook validation failed |

### 7.2 Log Schema

`audit_logs` table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Log entry ID |
| `timestamp` | TIMESTAMPTZ | `DEFAULT NOW()`, not null |
| `user_id` | UUID | Nullable (some system events have no user) |
| `action` | TEXT | e.g., `auth.login`, `data.export`, `sync.completed` |
| `resource` | TEXT | e.g., `session`, `email_metadata`, `daily_brief` |
| `detail` | JSONB | Additional context (no PII in this field) |
| `ip_address` | INET | Client IP address |
| `user_agent` | TEXT | Client user agent string |
| `outcome` | TEXT | `success`, `failure`, or `denied` |

### 7.3 Immutability

- **RLS policies:** No UPDATE or DELETE policies on `audit_logs` — only INSERT via service role
- **Database-level safeguard:** `REVOKE UPDATE, DELETE ON audit_logs FROM authenticated`
- **Application code:** Never call `.update()` or `.delete()` on the `audit_logs` table

### 7.4 Retention

- Minimum 1 year retention (SOC 2 requirement)
- Excluded from user data deletion cascade (compliance)
- User's own audit entries included in data export (read-only)

---

## 8. Secret Management

### 8.1 Storage

| Environment | Storage | Encryption |
|-------------|---------|------------|
| Local development | `.env` file (git-ignored) | None (developer machine) |
| Production | Vercel environment variables | Encrypted at rest by Vercel |
| CI/CD | GitHub Actions secrets | Encrypted by GitHub |

Never hardcode secrets in source code. Never commit `.env` to version control.

### 8.2 Secrets Inventory

| Secret | Purpose | Rotation Cadence |
|--------|---------|-----------------|
| `NEXTAUTH_SECRET` | Session signing | Annually |
| `ENCRYPTION_KEY` | Field-level AES-256-GCM | With lazy re-encryption migration (Section 2) |
| `MICROSOFT_CLIENT_SECRET` | OAuth | Per Azure AD policy |
| `OPENAI_API_KEY` | AI API | Quarterly |
| `SUPABASE_SERVICE_ROLE_KEY` | DB admin | Via Supabase dashboard, as needed |
| `STRIPE_SECRET_KEY` | Payments | Via Stripe dashboard, as needed |
| `STRIPE_WEBHOOK_SECRET` | Webhook validation | Via Stripe dashboard, as needed |
| `INNGEST_SIGNING_KEY` | Background job auth | Via Inngest dashboard, as needed |
| `UPSTASH_REDIS_REST_TOKEN` | Cache auth | Via Upstash console, as needed |

### 8.3 Rotation Protocol

1. Generate new secret value
2. Add as new environment variable in Vercel
3. Deploy and verify application functions correctly
4. Revoke old secret at the provider
5. For `ENCRYPTION_KEY`, follow the lazy re-encryption migration in Section 2.3

---

## 9. Security Monitoring & Incident Response

### 9.1 Monitoring Tools

| Tool | Purpose | Frequency |
|------|---------|-----------|
| **Sentry** | Runtime error tracking, performance monitoring | Continuous |
| **SonarQube / Semgrep** | SAST (static analysis) | Every PR, block on critical findings |
| **Snyk / Dependabot** | Dependency vulnerability scanning | Daily alerts |
| **Supabase Dashboard** | Database metrics, auth logs, RLS audit | On-demand |

### 9.2 Incident Response Process

1. **Detect:** Sentry alerts, audit log anomalies, user reports, dependency vulnerability alerts
2. **Triage:** Assess severity (Critical / High / Medium / Low)
3. **Contain:** Rotate compromised secrets, revoke affected sessions, disable affected feature if necessary
4. **Resolve:** Fix vulnerability, deploy patch, verify fix
5. **Post-incident:** Document findings, update this document if architecture changes are needed, notify affected users if required by GDPR

---

## References

- [TECHSTACK.md](../../TECHSTACK.md) — Technology stack decisions and NFRs
- [TECHNOLOGY_DISCOVERY.md](TECHNOLOGY_DISCOVERY.md) — Security requirements checklist
- [DEVELOPMENT_ORCHESTRATION.md](DEVELOPMENT_ORCHESTRATION.md) — Phase 8 security audit, NFR-S01–S05
- [AGENT_HANDBOOK.md](AGENT_HANDBOOK.md) — Security constraints for developers
- [RLS Patterns](../skills/supabase-best-practices/rules/rls-enable-all-tables.md) — Supabase RLS SQL examples
