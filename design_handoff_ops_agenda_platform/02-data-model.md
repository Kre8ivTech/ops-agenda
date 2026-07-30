# 2. Data model & tenancy

## 1. Tenancy

One **account** per paying customer. An account owns one or more **entities** — a personal context plus N business entities. Every record that can be attributed carries both `account_id` and `entity_id`.

```
account (1) ─── (N) user            people who can sign in
account (1) ─── (N) entity          "Personal", "Kre8ivTech LLC", …
account (1) ─── (N) connection      external systems
account (1) ─── (N) <record tables>
```

`account_id` is the tenant boundary. `entity_id` is an **attribution and filtering** dimension, plus an authorisation scope for team members.

### Row-level security — the load-bearing control

Every tenant table has RLS enabled and forced. The app connects as a role with **no** `BYPASSRLS`.

```sql
ALTER TABLE finances_transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances_transaction FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON finances_transaction
  USING      (account_id = current_setting('app.account_id')::uuid)
  WITH CHECK (account_id = current_setting('app.account_id')::uuid);
```

Per request, inside the transaction, before any query:

```sql
SELECT set_config('app.account_id', $1, true);   -- true = transaction-scoped
SELECT set_config('app.user_id',    $2, true);
```

Rules:

- Set via `set_config(..., true)` so it cannot leak across pooled connections. With RDS Proxy, **pin the session for the transaction**.
- The Drizzle client wrapper is the only place that opens a transaction; it always sets context first. Direct pool access is lint-banned.
- Entity-scoped team access adds a second predicate against a `grant` table — do not express it in application code only.
- `test:rls` in CI asserts isolation per table and fails the build on any gap (`01-architecture.md §6`).

## 2. Conventions

- `uuid` v7 primary keys (time-sortable, no enumeration).
- `created_at`, `updated_at` (`timestamptz`), `created_by`, `updated_by` on every table.
- **Soft delete** via `deleted_at`; RLS policies exclude soft-deleted rows by default. Hard delete only through the data-subject-deletion job.
- Money as `numeric(14,2)` **plus** a `currency char(3)`. Never floats. Never a bare integer of cents without the currency.
- Dates that are calendar dates (a filing deadline) are `date`. Instants are `timestamptz`. The 6:00 brief needs the user's IANA timezone on `user` — store it, never infer it.
- Enums as Postgres enums where the set is genuinely closed (`priority`, `flag_state`), otherwise a lookup table.
- `jsonb` for provider payload passthrough only, never for anything queried or authorised on.

## 3. Core tables

```
account            id, name, plan, plan_period_end, status, created_at
user               id, account_id, email, name, timezone, locale, role,
                   mfa_enrolled, last_seen_at, status
entity             id, account_id, name, kind(personal|llc|corp|sole_prop|nonprofit),
                   ein_ref, formation_state, formed_on, status(trading|dormant|marked_dissolve),
                   fiscal_year_end, upkeep_annual
entity_grant       id, account_id, user_id, entity_id, module, role(view|edit|admin)
module_state       account_id, module, enabled, enabled_at, disabled_at
connection         id, account_id, provider, kind(mail|calendar|tasks|bank|card|
                   payroll|storage|social), external_account_ref, scopes[],
                   status(healthy|degraded|pending|revoked), last_sync_at,
                   last_error_code, secret_arn
audit_event        id, account_id, actor_user_id, action, target_type, target_id,
                   before, after, justification, ip, user_agent, at
```

`connection.secret_arn` points at Secrets Manager. **Tokens never live in Postgres** (`03-security-compliance.md §4`).

## 4. The record pattern

~35 screens are collection screens over a record type. Give them one shared base so the table component, filters, audit and export work uniformly:

```
<module>_<record>   id, account_id, entity_id,
                    title, status, priority(p1|p2|p3),
                    due_on, owner_user_id,
                    flag_state(none|attention|at_risk|settled),
                    flag_reason_code, flag_reason_text,
                    handled_at, handled_by, source_connection_id, source_external_id,
                    <type-specific columns…>
```

Two fields carry the product's core promise and are **required**, not optional:

- `flag_reason_code` — a closed enum (`no_owner`, `no_time_booked`, `deadline_inside_window`, `balance_short`, `missing_document`, `stale_no_contact`, `expiring_credential`, …). Rankable, filterable, analysable.
- `flag_reason_text` — the one-sentence human explanation shown in the row's expansion, generated from the code plus the record's own data. Never free-form model output presented as fact without the code behind it.

`source_connection_id` + `source_external_id` are unique together where present — this is the idempotency key for connector writes.

### Filter contract

Every collection screen exposes **All / Needs attention / Settled** with live counts:

- *Needs attention* = `flag_state IN ('attention','at_risk') AND handled_at IS NULL`
- *Settled* = `handled_at IS NOT NULL OR flag_state = 'settled'`

Counts must come from one aggregate query per screen, not one per chip.

## 5. Module tables

Only the non-obvious shapes are called out; the rest follow the record pattern.

**Plan** — `goal` (target, progress derivation, linked records), `habit` + `habit_entry`, `project` + `project_milestone` + `project_task`, `journal_entry` (body, considered[], rationale, revisit_at, follow_ups[], tags[], links[]), `review` (period, kept/shrunk/dropped decisions with the cost of each).

`journal_entry.links` and `project.links` are typed cross-module references — `(kind, label, screen, group, target_id)`. This is how the prototype's "linked records" work. Model it as a real polymorphic `record_link` table with a check constraint on `kind`, not as jsonb.

**Productivity** — `brief` + `brief_item` (the generated agenda; see below), `email_ref` (metadata + ranking only — **never message bodies**; see `03-security-compliance.md §5`), `calendar_event`, `task`, `time_entry` (client, entity, billable), `capacity_week` (derived), `contact`.

**Finances** — `account_ref` (institution, mask, type, balance, as_of), `transaction`, `subscription` (vendor, cycle, monthly, renews_on, seats, last_used, card_mask), `budget` + `budget_period`, `tax_obligation` + `tax_setaside`, `forecast_assumption`, `investment_holding`, `insurance_policy`, `fin_document`, `report_definition` + `report_run`.

Forecast is **derived, not stored as a projection**: every forecast figure must be traceable to committed flows. The UI states this. Compute it from `transaction` + `subscription` + `tax_obligation` + `contract`, and persist only the assumptions.

**Business** — `entity` (above), `compliance_obligation` (jurisdiction, form, due_on, cadence, penalty_text, filed_at), `opportunity` (stage, value, probability, last_contact_at), `contract` (kind MSA/SOW/NDA, counterparty, start/end, auto_renew, notice_days, value), `vendor` (+ `w9_status` — this gates 1099 filing and is a red flag in the UI when missing).

**Health** — `checkin` (physical/nutritional/mental/spiritual, free-form, **never scored**), `activity`, `meal`, `hydration`, `sleep_record`, `practice`, `appointment`, `medication` + `refill`, `metric_reading` (type, value, unit, taken_at), `health_record` (document, provider, result), `claim` (insurer, amount_claimed, amount_reimbursed, status).

**Design constraint from the product**: there is no wellness index, no score, no trend verdict, and no alert that fires because a number moved. The only automatic behaviour is refill and appointment reminders. Do not add "helpful" health scoring — the UI promises its absence.

**Life** — `home_item` (+ warranty, maintenance_due_on), `vehicle` (registration, inspection, service, insurance), `person` (relationship, birthday, last_contact_at, gift plans), `trip` + `trip_expense` (feeds Finances), `life_document` (kind, expires_on — drives the expiry watch), `course` + `assignment` + `credential` (CEU/PDU progress), `continuity_entry` (see §6).

**Research** — `investigation` (prompt, status, trigger_record_ref, cost_tokens), `finding` + `citation` (url, title, retrieved_at, quote_span), `library_item` (note or saved finding, tags[]), `feed` + `feed_item` (topic, digest_at).

Citations are first-class rows, not text inside a summary. The UI shows "42 sources cited"; that number must be real and each source clickable.

**Social** — `brand`, `post_draft` (copy, assets[], approval_state), `schedule_slot`, `publish_attempt` (platform, external_id, error), `engagement_metric`.

## 6. Continuity — treat as a separate security domain

`continuity_entry` holds what a spouse or executor would need in an emergency. The prototype is explicit: **no credential storage, by design.** It records *where things are and who to call*, and points at 1Password/Bitwarden for secrets.

```
continuity_entry     id, account_id, label, category, body_ciphertext,
                     dek_wrapped, created_at, last_reviewed_at
trusted_contact      id, account_id, name, relationship, verified_at, notify_channel
access_request       id, account_id, requested_by_contact_id, requested_at,
                     identity_verified_at, releases_at, released_at,
                     denied_at, denied_by, notification_sent_at[]
```

Non-negotiable behaviours, all present in the design:

1. `body_ciphertext` is encrypted with a **per-entry data key wrapped by a per-account KMS key**, and the plaintext is only ever assembled in the user's session or during a completed release. No operator, no support tool, and no database dump reveals it.
2. Access requires **identity verification every time** — no exceptions, no "trusted device" shortcut.
3. A **72-hour waiting period** between a verified request and release, implemented as a Step Functions `Wait` state so it is auditable and cannot be skipped by a code path.
4. The account holder is notified **at request and at release**, on every channel on file. A notification failure does not silently proceed.
5. The account holder can deny during the window, which terminates the execution.
6. Every step writes to `audit_event`, and break-glass initiation pages the on-call.

Do not implement this module until its design has a dedicated review. It is the feature most likely to cause real-world harm if built casually.

## 7. Brief storage

```
brief         id, account_id, for_date, generated_at, model_id, prompt_version,
              input_digest, status, delivered_at
brief_item    id, brief_id, rank, record_type, record_id, entity_id,
              priority, reason_code, reason_text, proposed_action,
              approved_at, dismissed_at
```

Persist `model_id`, `prompt_version` and `input_digest` on every brief. Without them you cannot explain last Tuesday's ranking, reproduce a complaint, or evaluate a prompt change against history — and you will need all three.

## 8. Retention and deletion

- **Module off** → data retained 30 days (so re-enabling is not destructive), then hard-deleted by a scheduled job. The UI promises the module is "hidden completely"; make that true in storage too, on a timer.
- **Account closed** → 30-day grace, then hard delete of tenant data; audit events retained per the log policy with the tenant identifier pseudonymised.
- **Data-subject deletion request** → one job, one runbook, a completion certificate, and a test that proves it clears every table including S3 objects, OpenSearch documents and vector embeddings. Embeddings are personal data; people forget them.
- **Connector revoked** → tokens destroyed immediately; derived records retained but marked `source_revoked` so the UI can stop claiming freshness.

## 9. Migrations

Drizzle Kit, expand-contract, forward-only. Every migration reviewed for: RLS policy present on new tables (enforced by a CI check that fails on any tenant table without a policy), index for every foreign key and every filter the UI actually uses, and a rollback note. Backfills run as separate idempotent jobs, never inside a migration.
