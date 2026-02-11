# Workflow — Ops Agenda

## 1. Discovery
- Read the issue, PRD, and current code.
- Identify which Ops Agenda module is affected (Daily Ops Brief, Priority Inbox, Calendar Intelligence, Due-Out Detection, Draft Reply, Weekly Outlook, M365 Sync, AI Pipeline, Onboarding).
- Identify constraints, dependencies, and compliance requirements.
- Enter plan mode and ask all required intake questions (see `AGENT_HANDBOOK.md`).
- Do not modify files until intake questions are answered.

## 2. Planning
- Propose a minimal, testable change.
- Define acceptance criteria.
- Confirm the change respects modular architecture and event-driven boundaries.
- Verify the change stays within MVP scope (see PRD).

## 3. Implementation
- Apply small, focused commits.
- Keep formatting and style consistent.
- Ensure no raw email bodies are stored — metadata and AI summaries only.
- AI outputs must be JSON-only with schema validation and confidence scores.

## 4. Verification
- Run relevant tests.
- Verify dashboard load remains under 2 seconds.
- Verify background jobs are async and non-blocking.
- Update docs if behavior changes.

## 5. Release Readiness
- Ensure changelog and versioning are updated when required.
- Confirm compliance requirements are met (SOC 2 alignment, encryption, audit logging).
