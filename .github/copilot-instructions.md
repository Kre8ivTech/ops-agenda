# GitHub Copilot Instructions

This file provides comprehensive guidance to GitHub Copilot when working with code in this repository.

## Core Directives

Follow the policies in `docs/AGENT_HANDBOOK.md` and `docs/WORKFLOW.md`.
Start in **plan mode**, ask the required intake questions, and wait for answers before making changes.

---

## Ground Rules

### Primary Principles

1. **Plan Mode First**: Always enter plan mode before making changes
2. **Ask Before Acting**: Ask all intake questions before writing code
3. **Minimal Changes**: Make small, well-scoped, reviewable changes
4. **Preserve Behavior**: Don't change existing code unless explicitly asked
5. **Document Changes**: Update docs when user-facing behavior changes
6. **No Secrets**: Never commit credentials, API keys, or sensitive data

### Code Quality

- Match existing style and formatting
- Add tests when behavior changes
- Update documentation when user-facing behavior changes
- Follow language-specific best practices
- Prefer simple solutions over complex ones

---

## Plan Mode Intake Questions (Required)

**IMPORTANT**: Ask these questions before making ANY changes.

### Phase -1: Project Identity (ALWAYS FIRST)

**Capture these 5 items before ANY other questions:**

| # | Field | Required |
|---|-------|----------|
| 1 | **Application Name** - What is the name of the app/product? | ✅ |
| 2 | **Company Name** - What is the company/organization name? | ✅ |
| 3 | **Author Name** - Who is the primary author/creator? | ✅ |
| 4 | **License Type** - Proprietary (default), MIT, Apache 2.0, etc.? | ✅ |
| 5 | **Contact Email** - What is the primary contact email? | ✅ |

### Phase 0+: Discovery Questions (After Identity)

| # | Question |
|---|----------|
| 6 | What outcome should the user see when this is done? |
| 7 | Which stack is required: Laravel app, Next.js app, or WordPress plugin? |
| 8 | Where is the deployment target: WHM AWS LAMP server, Vercel, or existing React server? |
| 9 | What is in scope vs. explicitly out of scope? |
| 10 | Are there constraints (deadlines, tech choices, must-not-change areas)? |
| 11 | What are the acceptance criteria and how will we verify success? |
| 12 | What tests or checks are expected? |

### Workflow Order

```
Project Identity → Brand Discovery → Technology Discovery → 
Conception → Requirements → Architecture → Development → Deploy
```

### When Questions Are Needed

- Starting any new project (Identity is REQUIRED)
- Starting any new feature
- Making changes to existing functionality
- Modifying architecture or structure
- Any change affecting user-visible behavior

See `docs/PROJECT_IDENTITY.md` for identity templates.

---

## Memory Bank System

This project uses a structured memory bank system. Check these files for context:

### Core Context Files

| File | Purpose | When to Check |
|------|---------|---------------|
| `CLAUDE-activeContext.md` | Current session state | Always first |
| `CLAUDE-patterns.md` | Code patterns & conventions | Before implementing |
| `CLAUDE-decisions.md` | Architecture decisions | Before major changes |
| `CLAUDE-troubleshooting.md` | Known issues & solutions | When debugging |

### Memory Bank Rules

- Check active context for session state
- Follow patterns from CLAUDE-patterns.md
- Reference decisions for architectural guidance
- Never commit memory bank files

---

## Workflow Phases

### Phase 1: Discovery

```
1. Read the issue/request
2. Check CLAUDE-activeContext.md
3. Enter PLAN MODE
4. Ask ALL intake questions
5. Wait for answers
```

### Phase 2: Planning

```
1. Propose minimal change
2. Define acceptance criteria
3. Confirm target & stack
4. Wait for approval
```

### Phase 3: Implementation

```
1. Small, focused commits
2. Match existing style
3. Preserve behavior
4. Update tests
```

### Phase 4: Verification

```
1. Run tests
2. Verify criteria
3. Update docs
4. Update activeContext
```

---

## Code Generation Guidelines

### General Rules

- Generate code matching project style
- Use existing patterns and conventions
- Include appropriate error handling
- Add tests for new functionality
- Document complex logic

### Style Guidelines

```typescript
// TypeScript/JavaScript
- Use TypeScript for type safety
- Prefer const over let
- Use async/await over callbacks
- Use optional chaining (?.)
- Use nullish coalescing (??)
```

```python
# Python
- Use type hints
- Follow PEP 8
- Use context managers
- Prefer list comprehensions
- Use f-strings
```

```php
// PHP
- Use strict types
- Follow PSR-12
- Use type declarations
- Prefer named arguments
- Use null coalescing
```

### Security Guidelines

- Never generate hardcoded secrets
- Use environment variables for config
- Validate all user input
- Sanitize data before database ops
- Follow OWASP guidelines

---

## Git Standards

### Conventional Commits

```
<type>[scope]: <description>

Types:
- feat: New feature (MINOR version)
- fix: Bug fix (PATCH version)
- docs: Documentation only
- style: Formatting changes
- refactor: Code restructure
- test: Adding tests
- chore: Maintenance
- perf: Performance improvement
```

### Commit Rules

- Keep commits small and focused
- Write clear, descriptive messages
- Never commit secrets or credentials
- Never commit CLAUDE-*.md files
- Update CHANGELOG for significant changes

---

## Project Documentation

### Key Files

| File | Purpose |
|------|---------|
| `docs/AGENT_HANDBOOK.md` | Source of truth for behavior |
| `docs/WORKFLOW.md` | Phased build process |
| `docs/VIBE_CODING_WORKFLOW.md` | Complete master guide |
| `docs/QUICK_START.md` | 5-minute getting started |
| `TECHSTACK.md` | Technology stack documentation |
| `CHANGELOG.md` | Version history |

### Domain-Specific Configs

| File | Domain |
|------|--------|
| `CLAUDE-cloudflare.md` | Cloudflare Workers/Pages |
| `CLAUDE-wordpress.md` | WordPress development |
| `CLAUDE-vercel.md` | Vercel deployment |

---

## Quick Reference Checklists

### Before Every Task

- [ ] Check `CLAUDE-activeContext.md`
- [ ] Enter Plan Mode
- [ ] Ask intake questions
- [ ] Wait for approval
- [ ] DON'T jump into coding

### During Implementation

- [ ] Make small, focused commits
- [ ] Match existing patterns
- [ ] Update tests for new behavior
- [ ] Update documentation
- [ ] DON'T over-engineer

### Before Committing

- [ ] Run all relevant tests
- [ ] Check for secrets
- [ ] Update CHANGELOG if needed
- [ ] Use conventional commits
- [ ] DON'T commit memory bank files

---

## Inline Suggestions

When providing inline suggestions:

### DO ✅

- Match surrounding code style
- Use existing variable names
- Follow established patterns
- Complete logical code blocks
- Add appropriate types

### DON'T ❌

- Introduce new dependencies without context
- Change existing patterns
- Add unnecessary complexity
- Generate placeholder values
- Include hardcoded secrets

---

## Chat Mode Guidelines

When responding to chat queries:

### Investigation First

- Read referenced files before answering
- Check existing patterns
- Understand current context
- Verify claims against code

### Response Format

- Provide direct answers
- Include relevant code examples
- Reference file locations
- Suggest next steps when appropriate

---

## Error Handling

### When Encountering Errors

1. Read the complete error message
2. Check `CLAUDE-troubleshooting.md`
3. Identify root cause
4. Propose minimal fix
5. Add test for prevention
6. Document solution

### Common Patterns

```typescript
// TypeScript error handling
try {
  // operation
} catch (error) {
  if (error instanceof SpecificError) {
    // handle specific case
  }
  throw error; // re-throw if unhandled
}
```

---

## Best Practices Summary

### DO ✅

- Ask questions first
- Make small, focused changes
- Match existing patterns
- Update documentation
- Preserve existing behavior
- Run tests before committing

### DON'T ❌

- Jump into coding without questions
- Make large, sweeping changes
- Create new abstractions unnecessarily
- Leave documentation stale
- Change things "while you're there"
- Commit secrets or memory bank files

---

*For complete documentation, see `docs/VIBE_CODING_WORKFLOW.md`*
