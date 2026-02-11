# BLACKBOX.md

This file provides comprehensive guidance to Blackbox AI when working with code in this repository.

## Core Directives

Follow the guidance in `docs/AGENT_HANDBOOK.md` and `docs/WORKFLOW.md`.
Start in **plan mode**, ask the required intake questions, and wait for answers before making changes.

---

## AI Guidance

### Primary Directive

You are a specialized AI assistant. Your primary function is to execute the user's instructions with precision and within the specified scope.

### Core Principles

1. **Plan Mode First**: Always enter plan mode before making changes
2. **Ask Before Acting**: Ask all intake questions before writing code
3. **Minimal Changes**: Make small, well-scoped, reviewable changes
4. **Preserve Behavior**: Don't change existing code unless explicitly asked
5. **Document Changes**: Update docs when user-facing behavior changes
6. **No Secrets**: Never commit credentials, API keys, or sensitive data

### Behavioral Guardrails

- **No Unsolicited Changes**: Do not make changes beyond what is explicitly requested
- **No Proactive Refactoring**: Do not refactor code unless asked
- **Task-Specific Focus**: Concentrate solely on the task at hand
- **Clarification Protocol**: If an instruction is ambiguous, ask for clarification before proceeding

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

### When to Skip Questions

Only skip intake questions if:
- User explicitly says "skip questions" or "just do it"
- Task is trivially simple (single line change)
- All context is already provided in the request

**NOTE**: Project Identity (Questions 1-5) should NEVER be skipped for new projects.

See `docs/PROJECT_IDENTITY.md` for identity templates.

---

## Memory Bank System

This project uses a structured memory bank system with specialized context files. Always check these files for relevant information before starting work.

### Core Context Files

| File | Purpose | Priority |
|------|---------|----------|
| `CLAUDE-activeContext.md` | Current session state, goals, and progress | **Always check first** |
| `CLAUDE-patterns.md` | Established code patterns and conventions | Before implementing |
| `CLAUDE-decisions.md` | Architecture decisions and rationale | Before major changes |
| `CLAUDE-troubleshooting.md` | Common issues and proven solutions | When debugging |
| `CLAUDE-config-variables.md` | Configuration variables reference | When configuring |
| `CLAUDE-temp.md` | Temporary scratch pad | Only when referenced |

### Memory Bank Rules

1. **Check First**: Always reference active context file first
2. **Maintain Continuity**: Understand what's currently being worked on
3. **Update Progress**: Keep activeContext updated with progress
4. **Log Solutions**: Add solutions to troubleshooting when fixing bugs
5. **Never Commit**: Don't include memory bank files in git commits

### Creating Memory Bank Files

If memory bank files don't exist, create them:

```markdown
# CLAUDE-activeContext.md

## Current Session
- **Date**: YYYY-MM-DD
- **Goal**: [Primary objective]
- **Branch**: [Git branch name]
- **Status**: Ready / In Progress / Blocked

## Progress
- [ ] Task 1
- [ ] Task 2

## Blockers
- None

## Next Steps
1. Step 1
2. Step 2
```

---

## Workflow Phases

### Phase 1: Discovery

```
┌─────────────────────────────────────────────────────┐
│                    DISCOVERY                         │
├─────────────────────────────────────────────────────┤
│ 1. Read the issue/request thoroughly                │
│ 2. Examine current code (if exists)                 │
│ 3. Check CLAUDE-activeContext.md for session state  │
│ 4. Identify constraints and dependencies            │
│ 5. Enter PLAN MODE                                  │
│ 6. Ask ALL required intake questions                │
│ 7. DO NOT modify files until questions answered     │
└─────────────────────────────────────────────────────┘
```

### Phase 2: Planning

```
┌─────────────────────────────────────────────────────┐
│                     PLANNING                         │
├─────────────────────────────────────────────────────┤
│ 1. Propose minimal, testable change                 │
│ 2. Define acceptance criteria                       │
│ 3. Confirm deployment target and stack choices      │
│ 4. Document plan in CLAUDE-activeContext.md         │
│ 5. Wait for user approval before proceeding         │
└─────────────────────────────────────────────────────┘
```

### Phase 3: Implementation

```
┌─────────────────────────────────────────────────────┐
│                  IMPLEMENTATION                      │
├─────────────────────────────────────────────────────┤
│ 1. Apply small, focused commits                     │
│ 2. Keep formatting consistent with existing code    │
│ 3. Preserve existing behavior unless asked          │
│ 4. Use existing patterns from CLAUDE-patterns.md    │
│ 5. Document decisions in CLAUDE-decisions.md        │
│ 6. Update tests as needed                           │
└─────────────────────────────────────────────────────┘
```

### Phase 4: Verification

```
┌─────────────────────────────────────────────────────┐
│                   VERIFICATION                       │
├─────────────────────────────────────────────────────┤
│ 1. Run relevant tests                               │
│ 2. Verify acceptance criteria are met               │
│ 3. Update documentation if behavior changed         │
│ 4. Log any issues in CLAUDE-troubleshooting.md      │
│ 5. Update CLAUDE-activeContext.md progress          │
└─────────────────────────────────────────────────────┘
```

### Phase 5: Release Readiness

```
┌─────────────────────────────────────────────────────┐
│                 RELEASE READINESS                    │
├─────────────────────────────────────────────────────┤
│ 1. Update CHANGELOG.md with changes                 │
│ 2. Follow VERSIONING.md policy                      │
│ 3. Tag release per RELEASE_PROCESS.md               │
│ 4. Sync memory bank files                           │
│ 5. Clean up temporary files                         │
└─────────────────────────────────────────────────────┘
```

---

## Code Quality Standards

### Architecture & Boundaries

- Respect module boundaries and avoid tight coupling
- Prefer composition over inheritance
- Keep side effects contained and explicit
- Follow existing patterns in the codebase

### Quality Bar

- Add tests for new behavior
- Avoid flaky tests and non-deterministic logic
- Run the smallest meaningful test set before submitting
- Match existing code style and formatting

### Security & Privacy

- **NEVER** commit secrets, credentials, or private data
- Prefer environment variables for configuration
- Use `.env.example` for documenting required variables
- Add sensitive files to `.gitignore`

---

## Command Reference

### Fast File Operations

```bash
# List all files recursively (FASTEST)
fd . -t f
rg --files

# Search content in files (FASTEST)
rg "search_term"              # Search everywhere
rg -i "case_insensitive"      # Case-insensitive
rg "pattern" -t py            # Only Python files
rg "pattern" -g "*.md"        # Only Markdown files
rg -n "pattern"               # Show line numbers
rg -A 3 -B 3 "error"          # Context lines

# Find files by name
fd "filename"                 # Find by name pattern
fd -e js                      # All .js files
```

### Banned Commands (Too Slow)

| Don't Use | Use Instead |
|-----------|-------------|
| `tree` | `fd . -t d` |
| `find` | `fd` or `rg --files` |
| `grep -r` | `rg` |
| `ls -R` | `rg --files` or `fd` |
| `cat file \| grep` | `rg pattern file` |

---

## Git Standards

### Conventional Commits

```bash
# Format
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

| Type | Description | Version Impact |
|------|-------------|----------------|
| `feat` | New feature | MINOR |
| `fix` | Bug fix | PATCH |
| `docs` | Documentation only | None |
| `style` | Formatting, no code change | None |
| `refactor` | Code change, no feature/fix | None |
| `test` | Adding/updating tests | None |
| `chore` | Maintenance tasks | None |
| `perf` | Performance improvement | PATCH |

### Commit Rules

- Keep commits small and focused
- Write clear, descriptive messages
- Never commit secrets or credentials
- Never commit memory bank files (CLAUDE-*.md)
- Update CHANGELOG.md for significant changes

---

## Tech Stack Detection

When starting work, detect the project type:

| File Found | Stack | Action |
|------------|-------|--------|
| `package.json` | Node.js/JavaScript | Check dependencies for framework |
| `composer.json` | PHP/Laravel | Check for Laravel framework |
| `requirements.txt` | Python | Check for Django/Flask |
| `Gemfile` | Ruby/Rails | Check for Rails |
| `go.mod` | Go | Check for Gin/Echo |
| `Cargo.toml` | Rust | Check workspace config |
| `pom.xml` | Java/Maven | Check dependencies |

---

## Project Documentation

### Core Files

| File | Purpose |
|------|---------|
| `docs/AGENT_HANDBOOK.md` | Source of truth for all behavior |
| `docs/WORKFLOW.md` | Phased build process |
| `docs/VIBE_CODING_WORKFLOW.md` | Complete master guide |
| `docs/QUICK_START.md` | 5-minute getting started |
| `docs/PLATFORM_SETUP.md` | Platform-specific setup |
| `TECHSTACK.md` | Technology stack documentation |
| `CHANGELOG.md` | Version history |

### Domain-Specific Configs

| File | Domain |
|------|--------|
| `CLAUDE-cloudflare.md` | Cloudflare Workers/Pages |
| `CLAUDE-wordpress.md` | WordPress development |
| `CLAUDE-vercel.md` | Vercel deployment |
| `CLAUDE-whm.md` | WHM/cPanel servers |
| `CLAUDE-convex.md` | Convex backend |

---

## Quick Reference Checklists

### Before Every Task

- [ ] Read `CLAUDE-activeContext.md` for session state
- [ ] Enter Plan Mode
- [ ] Ask all intake questions
- [ ] Wait for user approval
- [ ] DON'T jump into coding

### During Implementation

- [ ] Make small, focused commits
- [ ] Match existing code patterns
- [ ] Update tests for new behavior
- [ ] Update documentation
- [ ] DON'T over-engineer

### Before Committing

- [ ] Run all relevant tests
- [ ] Check for secrets/credentials
- [ ] Update CHANGELOG if significant
- [ ] Use conventional commit format
- [ ] DON'T commit memory bank files

### When Debugging

- [ ] Check `CLAUDE-troubleshooting.md` first
- [ ] Identify root cause before fixing
- [ ] Propose minimal fix
- [ ] Add test for the bug
- [ ] Log solution in troubleshooting

---

## Error Handling

### When You Encounter Errors

1. **Read the error message** completely
2. **Check troubleshooting** in `CLAUDE-troubleshooting.md`
3. **Identify root cause** before proposing fix
4. **Propose minimal fix** that addresses the issue
5. **Add test** to prevent regression
6. **Document solution** in troubleshooting file

### Common Issues

| Issue | Solution |
|-------|----------|
| Missing dependencies | Check package.json/requirements.txt |
| Environment variables | Check .env.example |
| Permission denied | Check file permissions |
| Build failures | Check build configuration |
| Test failures | Check test setup and mocks |

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
