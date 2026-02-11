# Agent Handbook — Ops Agenda

This handbook is the source of truth for AI-assisted development on the
Ops Agenda project. It establishes expectations for quality, safety, and delivery.

## Operating Principles
- Keep changes small and easy to review.
- Preserve existing behavior unless explicitly asked to change it.
- Write clear commit messages and changelog entries when required.
- Document user-visible changes.
- Start every engagement in plan mode. Ask the required intake questions
  and wait for answers before changing files.

---

## Plan Mode Intake Questions (Required)

### Phase -1: Project Identity (COMPLETE)

| # | Field | Value |
|---|-------|-------|
| 1 | **Application Name** | Ops Agenda |
| 2 | **Company Name** | Kre8ivTech |
| 3 | **Author** | Jeremiah Castillo |
| 4 | **License** | Proprietary |
| 5 | **Contact Email** | info@kre8ivtech.com |

### Phase 0-1: Discovery Questions (For Each Task)

| # | Question |
|---|----------|
| 6 | What outcome should the user see when this is done? |
| 7 | Which Ops Agenda module does this change target? (e.g., Daily Ops Brief, Priority Inbox, Calendar Intelligence, Due-Out Detection, Draft Reply, Weekly Outlook, M365 Sync, AI Pipeline, Onboarding) |
| 8 | What is in scope vs. explicitly out of scope? |
| 9 | Are there constraints (deadlines, must-not-change areas, compliance requirements)? |
| 10 | What are the acceptance criteria and how will we verify success? |
| 11 | What tests or checks are expected? |

### Full Workflow Order

```
Project Identity (complete) → Brand Discovery → Technology Discovery →
Conception → Requirements → Architecture → Planning →
Development → Testing → Security → Code Review → Deploy → Monitor
```

See `PROJECT_IDENTITY.md` for completed project identity.
See `DEVELOPMENT_ORCHESTRATION.md` for the complete lifecycle.

## Architecture & Boundaries
- Respect module boundaries and avoid tight coupling.
- Prefer composition over inheritance.
- Keep side effects contained and explicit.
- Core platform must not depend on optional features (modular architecture per PRD).
- New capabilities should be implemented as modules with event-driven communication.

## Quality Bar
- Add tests for new behavior.
- Avoid flaky tests and non-deterministic logic.
- Run the smallest meaningful test set before submitting.
- Dashboard load must remain under 2 seconds.
- Background jobs must be async and non-blocking.

## Security & Privacy
- Never commit secrets, credentials, or private data.
- Prefer environment variables for configuration.
- No raw email bodies stored — only metadata and AI-generated summaries.
- OAuth tokens must be encrypted; no credentials stored.
- Audit logs must be immutable.
- SOC 2 aligned architecture; encryption at rest and in transit.

## Documentation
- Keep README and docs up to date with behavior changes.
- Use concise, user-focused language.

## MVP Scope Reference

**In Scope (v1):**
- Microsoft 365 email (Inbox only) and calendar (multiple calendars)
- AI-driven prioritization and due-out detection
- Daily Ops Brief, Weekly Outlook, Midday disruption scan, EOD wrap-up
- Optional AI-generated draft replies
- User feedback to correct AI
- Compliance-first data handling

**Out of Scope (v1):**
- Auto-sending, auto-archiving, or auto-flagging emails
- Team workflows or shared inboxes
- Task manager, chat, file, or CRM integrations
