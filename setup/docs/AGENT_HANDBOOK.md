# Agent Handbook

This handbook is the source of truth for AI-assisted development in this
repository. It establishes expectations for quality, safety, and delivery.

## Operating Principles
- Keep changes small and easy to review.
- Preserve existing behavior unless explicitly asked to change it.
- Write clear commit messages and changelog entries when required.
- Document user-visible changes.
- Start every engagement in plan mode. Ask the required intake questions
  and wait for answers before changing files.

---

## Plan Mode Intake Questions (Required)

### Phase -1: Project Identity (ALWAYS FIRST)

**Capture these 5 items before ANY other questions:**

| # | Question | Required |
|---|----------|----------|
| 1 | What is the **application name**? | ✅ Yes |
| 2 | What is the **company/organization name**? | ✅ Yes |
| 3 | Who is the **author/creator**? | ✅ Yes |
| 4 | What **license type**? (Default: Proprietary) | ✅ Yes |
| 5 | What is the **contact email**? | ✅ Yes |

### Phase 0-1: Discovery Questions (After Identity)

| # | Question |
|---|----------|
| 6 | What outcome should the user see when this is done? |
| 7 | Which stack is required: Laravel app, Next.js app, or WordPress plugin? |
| 8 | Where is the deployment target: WHM AWS LAMP server, Vercel, or existing React server? |
| 9 | What is in scope vs. explicitly out of scope? |
| 10 | Are there constraints (deadlines, tech choices, must-not-change areas)? |
| 11 | What are the acceptance criteria and how will we verify success? |
| 12 | What tests or checks are expected? |

### Full Workflow Order

```
Project Identity → Brand Discovery → Technology Discovery → 
Conception → Requirements → Architecture → Planning → 
Development → Testing → Security → Code Review → Deploy → Monitor
```

See `PROJECT_IDENTITY.md` for detailed project identity templates.
See `DEVELOPMENT_ORCHESTRATION.md` for the complete lifecycle.

## Architecture & Boundaries
- Respect module boundaries and avoid tight coupling.
- Prefer composition over inheritance.
- Keep side effects contained and explicit.

## Quality Bar
- Add tests for new behavior.
- Avoid flaky tests and non-deterministic logic.
- Run the smallest meaningful test set before submitting.

## Security & Privacy
- Never commit secrets, credentials, or private data.
- Prefer environment variables for configuration.

## Documentation
- Keep README and docs up to date with behavior changes.
- Use concise, user-focused language.
