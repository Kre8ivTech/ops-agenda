# CODEX.md

This file provides comprehensive guidance to OpenAI Codex when working with code in this repository.

## Core Directives

This repository follows the policies in `docs/AGENT_HANDBOOK.md`.
Use `docs/WORKFLOW.md` to guide the implementation lifecycle.
Start in **plan mode**, ask the required intake questions, and wait for answers before making changes.

---

## AI Guidance

### Primary Directive

You are a code-focused AI assistant. Your primary function is to generate, modify, and explain code with precision while following established project conventions.

### Core Principles

1. **Plan Mode First**: Always enter plan mode before making changes
2. **Ask Before Acting**: Ask all intake questions before writing code
3. **Minimal Changes**: Make small, well-scoped, reviewable changes
4. **Preserve Behavior**: Don't change existing code unless explicitly asked
5. **Document Changes**: Update docs when user-facing behavior changes
6. **No Secrets**: Never generate or commit credentials, API keys, or sensitive data

### Code Generation Rules

- Generate code that matches existing project style
- Follow language-specific best practices
- Include appropriate error handling
- Add comments only for complex logic
- Prefer simple, readable solutions over clever ones

---

## Plan Mode Intake Questions (Required)

**CRITICAL**: Ask these questions before making ANY changes.

### Phase -1: Project Identity (ALWAYS FIRST)

**Capture these 5 items before ANY other questions:**

| # | Field | Required | Purpose |
|---|-------|----------|---------|
| 1 | **Application Name** | ✅ | Name of the app/product |
| 2 | **Company Name** | ✅ | Company/organization name |
| 3 | **Author Name** | ✅ | Primary author/creator |
| 4 | **License Type** | ✅ | Proprietary (default), MIT, Apache 2.0, etc. |
| 5 | **Contact Email** | ✅ | Primary contact email |

### Phase 0+: Discovery Questions (After Identity)

| # | Question | Purpose |
|---|----------|---------|
| 6 | What outcome should the user see when this is done? | Define success criteria |
| 7 | Which stack is required: Laravel app, Next.js app, or WordPress plugin? | Technology selection |
| 8 | Where is the deployment target: WHM AWS LAMP server, Vercel, or existing React server? | Infrastructure decisions |
| 9 | What is in scope vs. explicitly out of scope? | Boundary definition |
| 10 | Are there constraints (deadlines, tech choices, must-not-change areas)? | Risk identification |
| 11 | What are the acceptance criteria and how will we verify success? | Quality gates |
| 12 | What tests or checks are expected? | Verification strategy |

### Workflow Order

```
Project Identity → Brand Discovery → Technology Discovery → 
Conception → Requirements → Architecture → Development → Deploy
```

See `docs/PROJECT_IDENTITY.md` for identity templates.

---

## Memory Bank System

This project uses a structured memory bank system. Always check these files before starting work.

### Core Context Files

| File | Purpose | When to Check |
|------|---------|---------------|
| `CLAUDE-activeContext.md` | Current session state, goals, progress | **Always first** |
| `CLAUDE-patterns.md` | Established code patterns and conventions | Before implementing |
| `CLAUDE-decisions.md` | Architecture decisions and rationale | Before major changes |
| `CLAUDE-troubleshooting.md` | Common issues and proven solutions | When debugging |
| `CLAUDE-config-variables.md` | Configuration variables reference | When configuring |

### Memory Bank Rules

1. **Check First**: Reference active context before starting work
2. **Update Progress**: Keep activeContext current with progress
3. **Log Solutions**: Add solutions to troubleshooting when fixing bugs
4. **Maintain Patterns**: Follow patterns from CLAUDE-patterns.md
5. **Never Commit**: Don't include memory bank files in commits

---

## Workflow Phases

### Phase 1: Discovery
```
1. Read the issue/request
2. Examine current code
3. Check CLAUDE-activeContext.md
4. Enter PLAN MODE
5. Ask ALL intake questions
6. DO NOT modify files until answered
```

### Phase 2: Planning
```
1. Propose minimal, testable change
2. Define acceptance criteria
3. Confirm deployment target
4. Document in activeContext
5. Wait for approval
```

### Phase 3: Implementation
```
1. Apply small, focused commits
2. Match existing code style
3. Preserve existing behavior
4. Follow patterns from CLAUDE-patterns.md
5. Update tests as needed
```

### Phase 4: Verification
```
1. Run relevant tests
2. Verify acceptance criteria
3. Update documentation
4. Log issues in troubleshooting
5. Update progress in activeContext
```

---

## Code Quality Standards

### Style Guidelines

- Match existing project formatting
- Use consistent naming conventions
- Follow language-specific idioms
- Keep functions small and focused
- Prefer explicit over implicit

### Architecture Rules

- Respect module boundaries
- Avoid tight coupling
- Prefer composition over inheritance
- Keep side effects contained
- Follow SOLID principles where applicable

### Security Rules

- **NEVER** generate hardcoded secrets
- **NEVER** commit credentials
- Use environment variables for config
- Validate all user input
- Sanitize data before database operations

---

## Language-Specific Guidelines

### JavaScript/TypeScript

```typescript
// Preferred patterns
- Use TypeScript for type safety
- Prefer const over let
- Use async/await over callbacks
- Use optional chaining (?.)
- Use nullish coalescing (??)
```

### Python

```python
# Preferred patterns
- Use type hints
- Follow PEP 8 style
- Use context managers (with)
- Prefer list comprehensions
- Use f-strings for formatting
```

### PHP

```php
// Preferred patterns
- Use strict types
- Follow PSR-12 style
- Use type declarations
- Prefer named arguments (PHP 8+)
- Use null coalescing (??)
```

---

## Command Reference

### Fast File Operations

```bash
# List files
fd . -t f              # All files recursively
rg --files             # Files respecting .gitignore

# Search content
rg "search_term"       # Search everywhere
rg -i "term"           # Case-insensitive
rg "pattern" -t py     # Only Python files

# Find by name
fd "filename"          # Find by pattern
```

### Banned Commands

- ❌ `tree` - Use `fd`
- ❌ `find` - Use `fd` or `rg --files`
- ❌ `grep -r` - Use `rg`
- ❌ `ls -R` - Use `rg --files`

---

## Git Standards

### Conventional Commits

```
<type>[scope]: <description>

Types:
- feat: New feature (MINOR)
- fix: Bug fix (PATCH)
- docs: Documentation
- style: Formatting
- refactor: Code restructure
- test: Tests
- chore: Maintenance
```

### Commit Rules

- Keep commits small and focused
- Write clear, descriptive messages
- Never commit secrets
- Never commit memory bank files
- Update CHANGELOG for significant changes

---

## Project Documentation

### Key Files

| File | Purpose |
|------|---------|
| `docs/AGENT_HANDBOOK.md` | Source of truth |
| `docs/WORKFLOW.md` | Build process |
| `docs/VIBE_CODING_WORKFLOW.md` | Complete guide |
| `TECHSTACK.md` | Tech stack docs |
| `CHANGELOG.md` | Version history |

---

## Quick Reference

### Before Every Task

- [ ] Read `CLAUDE-activeContext.md`
- [ ] Enter Plan Mode
- [ ] Ask intake questions
- [ ] Wait for approval

### During Implementation

- [ ] Small, focused commits
- [ ] Match existing patterns
- [ ] Update tests
- [ ] Update documentation

### Before Committing

- [ ] Run tests
- [ ] Check for secrets
- [ ] Update CHANGELOG if needed
- [ ] Use conventional commits

---

## Best Practices

### DO ✅

- Ask questions first
- Make small changes
- Match existing patterns
- Update documentation
- Write tests

### DON'T ❌

- Jump into coding
- Make large changes
- Create new abstractions unnecessarily
- Leave docs stale
- Commit secrets

---

*For complete documentation, see `docs/VIBE_CODING_WORKFLOW.md`*
