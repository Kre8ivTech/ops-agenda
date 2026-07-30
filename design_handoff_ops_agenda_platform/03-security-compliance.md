# 3. Security & compliance

> Read this before writing data-handling code. Sections 2, 3 and 4 constrain the schema and the hosting choice, and are expensive to retrofit.

## 1. Why this app is unusual

One database holds: self-logged health data and provider records, full financial position across personal and business accounts, legal filings and entity records, estate papers, and an emergency-access vault for a living person. Most products carry one of these categories. Ops Agenda carries all of them for a single user.

Consequences:

- A tenant-isolation bug is not an embarrassment, it is a reportable breach across several regimes at once.
- "Encrypted at rest" via RDS is table stakes and insufficient for Continuity and Health. Those need field-level encryption where the operator cannot read plaintext.
- Insider risk dominates the threat model. There is no legitimate business reason for any employee to read a customer's Continuity entries or health logs, so build so that they cannot.

## 2. Threat model (abbreviated STRIDE)

| Threat | Vector | Control |
|---|---|---|
| Cross-tenant read | Missing/incorrect predicate, pooled connection leak | Forced RLS + transaction-scoped `set_config` + blocking CI isolation suite (`02-data-model.md §1`) |
| Insider access to sensitive fields | Support tooling, DB access, log spelunking | Field-level encryption for Continuity/Health; no prod DB human access (break-glass only, paged, session-recorded); logger allowlist |
| Credential theft → external systems | Stolen refresh tokens | Secrets Manager only, per-connection, rotated; read-only scopes; short-lived tokens; egress allowlist |
| Account takeover | Phishing, password reuse | Mandatory MFA (TOTP/WebAuthn), Cognito advanced security, step-up for sensitive reads, device list + remote sign-out |
| Prompt injection via ingested content | Malicious email, web page fetched by Seek | Untrusted-content framing, no tool use from ingested text, Bedrock Guardrails, human approval of every action (`04-ai-bedrock.md §5`) |
| Data exfil via AI | Model returns another tenant's data; prompt leakage | Per-request tenant-scoped retrieval only; no shared vector namespace; no training on customer data |
| Continuity abuse | Coerced or fraudulent emergency access | Identity verification + 72h delay + dual notification + deny window + paging (`§6`) |
| Repudiation | "I never approved that" | Append-only audit with actor, before/after, justification, immutable store |
| Supply chain | Malicious dependency | Pinned lockfiles, provenance, SAST/SCA gates, no post-install scripts in CI |
| DoS / scraping | Volumetric, credential stuffing | CloudFront + WAF managed rules, rate limits per IP and per principal, Shield Advanced if the client wants the DDoS response team |

## 3. Regulatory posture — two open decisions

### 3a. Health data — HIPAA, FTC HBNR, and state health-privacy laws

**The nuance matters.** A consumer app storing data the *user* logs about themselves is generally **not** subject to HIPAA, because the app is neither a covered entity nor (absent a contract) a business associate. But:

- The **FTC Health Breach Notification Rule** applies to non-HIPAA health apps and requires notification of unauthorised disclosures — including some disclosures to third parties that the app *intended*. Third-party analytics or ad SDKs on any Health screen is the classic violation. **Ship zero third-party trackers on Health, Life and Finances screens.**
- **Washington's My Health My Data Act** is the aggressive one: broad definition of consumer health data, consent requirements, a right to deletion, a ban on selling without a signed authorisation, **and a private right of action**. Nevada SB 370 is similar. Assume WA-resident users; comply globally rather than geofencing.
- **HIPAA does apply** the moment the platform ingests records *from a provider or insurer under a contract* — Health → Records and Health → Claims are exactly that shape. Then you need a BAA with AWS (available; use only HIPAA-eligible services), plus the Security Rule's administrative, physical and technical safeguards.

**Action:** the client's counsel must determine applicability before Health → Records/Claims ships. **Engineer to the HIPAA Security Rule regardless** — it is the higher bar and it is what a BAA will require later. Note that a determination of "not a covered entity" does not reduce the encryption or audit requirements in this document.

### 3b. Government contract data — CMMC / NIST SP 800-171

Business → Pipeline references GovCon deals. If the platform ever stores **Federal Contract Information** or **Controlled Unclassified Information**:

- **NIST SP 800-171** controls and **CMMC Level 2** assessment become required by contract flow-down.
- Realistically that means **AWS GovCloud**, FedRAMP-authorised services only, US-person access restrictions, and a separate assessment boundary. Amplify Hosting is not available there; Bedrock model availability differs.

**This is the single most expensive fork in the build.** Resolve it before Phase 1 exit. If the answer is "maybe later," the mitigation is to keep the GovCon-touching data in a separable module with its own storage boundary, so a future CUI enclave does not require re-architecting the whole platform.

### 3c. Everything else

| Regime | Applies because | What it costs you |
|---|---|---|
| **SOC 2 Type II** | Every prospective business customer will ask | Controls + evidence collection from day one; observation window typically 3–12 months. Start the evidence trail at Phase 1, not at the audit. |
| **GLBA Safeguards Rule** | Financial account aggregation may bring the platform in scope | Written infosec program, designated qualified individual, risk assessments, vendor oversight, incident response plan, board reporting |
| **PCI DSS** | Subscription billing | Use Stripe Checkout/Elements so card data never touches your servers → SAQ A. Never accept a PAN in your own form. |
| **CCPA/CPRA + state laws** | Consumer users | Access/deletion/correction/portability, opt-out of sale/share (do neither), privacy notice, DPA with subprocessors |
| **GDPR/UK GDPR** | Any EU/UK user | Lawful basis, DPIA (justified by the data mix), DSR workflow, records of processing, EU data residency decision, SCCs |
| **FTC Act §5** | Everyone | The UI makes explicit promises — "read-only", "cannot move money", "will never store credentials", "does not assess you". **Every one is an enforceable representation.** If the code diverges from the copy, that is a deceptive practice. Treat the copy as a spec. |
| **CAN-SPAM / notification consent** | Daily brief email, alerts | Consent capture, unsubscribe honoured within 10 days, no dark patterns |

## 4. Encryption and key management

**In transit.** TLS 1.3 only (1.2 minimum where a partner forces it), HSTS with preload, CloudFront minimum protocol enforced. Internal ALB→task traffic over TLS. No plaintext hops anywhere, including to Bedrock (use VPC endpoints).

**At rest.** Customer-managed KMS keys per environment and per data class — do not use the AWS-managed default for anything. Aurora, S3, EBS, ElastiCache, SQS, SNS, Secrets Manager, CloudWatch Logs all encrypted with CMKs. Automatic annual rotation; key policies grant only the specific task roles, and `kms:ViaService` conditions restrict usage.

**Field-level encryption** for the tiers where operator access must be impossible:

| Tier | Data | Approach |
|---|---|---|
| **Tier 0 — operator-opaque** | Continuity entries, Health check-in free text, journal bodies | Per-record data key, wrapped by a **per-account** CMK. Plaintext exists only in the request that renders it to the authenticated user. Never indexed, never logged, never in a backup in plaintext. |
| **Tier 1 — encrypted + audited read** | Health records/metrics/claims, financial account identifiers, tax identifiers, estate documents | Column encryption with a per-account CMK; every decrypt writes an audit event. Search on blind indexes (HMAC), not plaintext. |
| **Tier 2 — standard** | Tasks, calendar metadata, contacts, vendors, pipeline | Storage-level encryption + RLS |

Consequence to plan for: **Tier 0 and Tier 1 fields cannot be searched or sorted normally.** Decide per field whether you need a blind index, and accept that some columns simply are not sortable. Do not quietly downgrade a field's tier because a table needs to sort by it — change the design instead.

**Secrets.** Secrets Manager only; per-connection secrets with rotation; IAM auth to Aurora rather than a static password where possible. No secrets in environment variables of a task definition, no secrets in the repo, gitleaks in CI. External OAuth tokens **never** land in Postgres.

## 5. Data minimisation — the highest-leverage control

The connectors are where scope creep becomes liability. Two rules:

1. **Request the narrowest scope that works, always read-only.** Gmail `readonly` not `modify`. Calendar `readonly` unless the user has explicitly enabled write-back. Bank aggregation read-only — the product promises it cannot move money, so do not hold a permission that could.
2. **Store the least you can and still rank.** Productivity → Email exists to *rank* mail, not to be a mail client. Store: sender, recipients, subject, timestamps, thread id, labels, read state, and derived signals. **Do not store message bodies or attachments.** If ranking needs body content, process it in memory during sync and persist only the derived signal (`awaiting_reply`, `commitment_detected`, `deadline_mentioned` + the extracted date). Link out to the provider for the content.

This one decision removes the largest single category of breach exposure in the product, and it is invisible to the user because the design links out to the source anyway.

Also: no third-party analytics, session replay, or advertising SDK anywhere in the authenticated app. Use first-party server-side telemetry with the redaction library. This is both an FTC HBNR requirement and the only defensible answer to "who else sees my data."

## 6. Continuity break-glass

Specified in `02-data-model.md §6`. Security requirements restated because they are the ones people cut:

- Identity verification **every time**, no trusted-device shortcut.
- 72-hour delay as a Step Functions `Wait` state — auditable, not skippable by any code path.
- Notification to the account holder at request and at release, on every channel on file; a send failure blocks progression rather than proceeding silently.
- A deny action during the window terminates the execution immediately.
- Initiation **pages the on-call** and writes an audit event. Any anomaly (multiple requests, unusual geography) escalates.
- Release grants a time-boxed, read-only, watermarked view — not a download of the vault, not a permanent grant.
- Do not build this module without a dedicated design review, and consider an external review before it ships. It is the feature most capable of real-world harm.

## 7. Audit logging

Append-only. `audit_event` in Postgres for queryability, mirrored to S3 in the log-archive account with **Object Lock in compliance mode** so it cannot be altered or deleted by anyone, including a root user with a stolen credential.

Every event records: actor, action, target type and id, before/after (with Tier 0/1 values redacted to a hash), justification where required, IP, user agent, timestamp, request id.

Audited at minimum: all authentication events; all step-up challenges; every decrypt of a Tier 0/1 field; every connector grant, scope change and revocation; every export or report generation; every team-access grant/revocation; every module enable/disable; every Continuity request lifecycle step; all admin and support actions; every data-subject request.

CloudTrail (all regions, org trail, log file validation on), GuardDuty, Security Hub, AWS Config with conformance packs, Macie on document buckets, Inspector on images. Route findings to a single queue with an owner and an SLA — findings nobody triages are worse than none, because they establish that you knew.

## 8. Application security

- Input validation with Zod at every boundary; parse, don't validate.
- Output encoding by default via React; `dangerouslySetInnerHTML` is lint-banned. If rendering user or model markdown, sanitise server-side with a strict allowlist.
- CSP with nonces, no `unsafe-inline`, no `unsafe-eval`; frame-ancestors none; strict Referrer-Policy; Permissions-Policy denying camera/mic/geolocation unless a feature needs it.
- CSRF: Server Actions with origin checks + SameSite cookies; explicit tokens on any non-Action mutation route.
- Authorisation checked on **every** Server Action and route handler — module entitlement, RBAC role, entity scope, and record ownership. A shared `authorize()` helper, and a test that fails if any Action file lacks a call to it.
- IDOR: never trust a client-supplied id without re-checking scope; RLS is the backstop, not the only check.
- Rate limits per principal on expensive endpoints (exports, Ask, Seek), not just per IP.
- File uploads: type sniffing not extension trust, size caps, S3 quarantine bucket → scan → promote, never served from the app origin, always via short-lived presigned URLs with `Content-Disposition: attachment`.
- Dependency policy: renovate with automerge for patch, human review for major; no unmaintained packages in the auth, crypto or data path.

## 9. Business continuity

- Aurora: automated backups 35 days, PITR, cross-region snapshot copy, **restore tested quarterly with the result written down**.
- S3: versioning + replication for documents; Object Lock on audit.
- Documented RPO 15 min / RTO 4 h for the app; the brief is allowed to be late in a disaster, the data is not allowed to be lost.
- Incident response plan with severities, roles, a communications template, and a 72-hour regulatory notification clock (GDPR) plus FTC HBNR and state-law timelines. Run one tabletop before launch.

## 10. Launch gates

Do not go live without all of these:

1. `test:rls` green, covering every tenant table
2. Third-party penetration test complete, all High/Critical remediated and retested
3. Field-level encryption implemented for Tier 0 and Tier 1
4. MFA enforced; step-up implemented on every sensitive action
5. Audit log immutable and verified by attempting deletion
6. No third-party trackers in the authenticated app (verified by network diff)
7. Zero secrets in the repo (verified by history scan, not just HEAD)
8. Data-subject access and deletion runbooks executed end-to-end against staging
9. Privacy notice and terms consistent with actual behaviour — a line-by-line check of the UI's promises against the code
10. GovCon/CUI decision documented; HIPAA applicability determination documented
11. Backup restore drill completed
12. Incident response tabletop completed
13. WCAG 2.2 AA audit passed
14. Continuity module either shipped after dedicated review, or feature-flagged off
