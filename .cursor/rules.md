# Cursor Rules

This file provides comprehensive guidance to Cursor IDE when working with code in this repository.

## Core Directives

Follow the guidance in `docs/AGENT_HANDBOOK.md` and `docs/WORKFLOW.md`.
Start in **plan mode**, ask the required intake questions, and wait for answers before making changes.

## AI Guidance

### Primary Rules

1. **Plan Mode First**: Always enter plan mode before making changes
2. **Ask Before Acting**: Ask all intake questions before writing code
3. **Minimal Changes**: Make small, well-scoped, reviewable changes
4. **Preserve Behavior**: Don't change existing code unless explicitly asked
5. **Document Changes**: Update docs when user-facing behavior changes
6. **No Secrets**: Never commit credentials, API keys, or sensitive data

### Investigation Before Answering

Never speculate about code you have not opened. If the user references a specific file, you MUST read the file before answering. Make sure to investigate and read relevant files BEFORE answering questions about the codebase. Never make any claims about code before investigating unless you are certain of the correct answer.

### Do Not Act Before Instructions

Do not jump into implementation or change files unless clearly instructed. When the user's intent is ambiguous, default to providing information, doing research, and providing recommendations rather than taking action. Only proceed with edits when the user explicitly requests them.

---

## Plan Mode Intake Questions (Required)

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
| 6 | **Outcome**: What outcome should the user see when this is done? |
| 7 | **Stack**: Which stack is required: Laravel app, Next.js app, or WordPress plugin? |
| 8 | **Deployment**: Where is the deployment target: WHM AWS LAMP server, Vercel, or existing React server? |
| 9 | **Scope**: What is in scope vs. explicitly out of scope? |
| 10 | **Constraints**: Are there constraints (deadlines, tech choices, must-not-change areas)? |
| 11 | **Acceptance**: What are the acceptance criteria and how will we verify success? |
| 12 | **Testing**: What tests or checks are expected? |

### Workflow Order

```
Project Identity → Brand Discovery → Technology Discovery → 
Conception → Requirements → Architecture → Development → Deploy
```

See `docs/PROJECT_IDENTITY.md` for identity templates and `docs/DEVELOPMENT_ORCHESTRATION.md` for full lifecycle.

---

## Memory Bank System

This project uses a structured memory bank system. Always check these files for relevant information before starting work:

### Core Context Files

| File | Purpose | When to Read |
|------|---------|--------------|
| `CLAUDE-activeContext.md` | Current session state, goals, progress | Always first |
| `CLAUDE-patterns.md` | Established code patterns and conventions | Before implementing |
| `CLAUDE-decisions.md` | Architecture decisions and rationale | Before major changes |
| `CLAUDE-troubleshooting.md` | Common issues and proven solutions | When debugging |
| `CLAUDE-config-variables.md` | Configuration variables reference | When configuring |
| `CLAUDE-temp.md` | Temporary scratch pad | Only when referenced |

### Memory Bank Rules

1. **Check First**: Always reference active context before starting work
2. **Update Actively**: Keep memory bank files current with actual code
3. **Preserve History**: Don't delete achievements or lessons learned
4. **Session Continuity**: Use activeContext to maintain session state

---

## Code Quality Standards

### Architecture & Boundaries

- Respect module boundaries and avoid tight coupling
- Prefer composition over inheritance
- Keep side effects contained and explicit
- Follow existing patterns in `CLAUDE-patterns.md`

### Quality Bar

- Add tests for new behavior
- Avoid flaky tests and non-deterministic logic
- Run the smallest meaningful test set before submitting
- Match existing code style and formatting

### Security & Privacy

- Never commit secrets, credentials, or private data
- Prefer environment variables for configuration
- Use `.env.example` for documenting required variables
- Add sensitive files to `.gitignore`

---

## Workflow Phases

### Phase 1: Discovery
```
1. Read the issue/request
2. Examine current code
3. Check CLAUDE-activeContext.md
4. Enter PLAN MODE
5. Ask ALL intake questions
6. DO NOT modify files until questions answered
```

### Phase 2: Planning
```
1. Propose minimal, testable change
2. Define acceptance criteria
3. Confirm deployment target
4. Document plan in activeContext
5. Wait for user approval
```

### Phase 3: Implementation
```
1. Apply small, focused commits
2. Keep formatting consistent
3. Preserve existing behavior
4. Use existing patterns
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

## Command Reference

### Fast File Operations (Use These)

```bash
# List files (fastest)
fd . -t f                    # All files recursively
rg --files                   # Files respecting .gitignore

# Search content (fastest)
rg "search_term"             # Search everywhere
rg -i "case_insensitive"     # Case-insensitive
rg "pattern" -t py           # Only Python files

# Find files by name
fd "filename"                # Find by name pattern
```

### Banned Commands (Too Slow)

- ❌ `tree` - Use `fd` instead
- ❌ `find` - Use `fd` or `rg --files`
- ❌ `grep -r` - Use `rg` instead
- ❌ `ls -R` - Use `rg --files` or `fd`
- ❌ `cat file | grep` - Use `rg pattern file`

---

## Git Commit Standards

When committing changes, use Conventional Commits format:

```bash
# Format
<type>[optional scope]: <description>

# Types
feat:     # New feature (MINOR version)
fix:      # Bug fix (PATCH version)
docs:     # Documentation only
style:    # Formatting, no code change
refactor: # Code change, no feature/fix
test:     # Adding/updating tests
chore:    # Maintenance tasks
```

### Commit Rules

- Keep commits small and focused
- Write clear, descriptive messages
- Never commit secrets or credentials
- Update CHANGELOG.md for significant changes

---

## Cursor-Specific Features

### Composer Mode

When using Cursor Composer:
- Reference files with `@filename`
- Use `@folder/` to reference directories
- Check `@CLAUDE-activeContext.md` for session state

### Chat Mode

When using Cursor Chat:
- Ask clarifying questions before implementing
- Reference specific files for context
- Use plan mode for complex changes

### Inline Editing

When using inline edits:
- Keep changes minimal and focused
- Preserve surrounding code context
- Match existing code style

---

## Project-Specific Rules

### Documentation Files

- `docs/AGENT_HANDBOOK.md` - Source of truth for behavior
- `docs/WORKFLOW.md` - Phased build process
- `docs/VIBE_CODING_WORKFLOW.md` - Complete master guide
- `TECHSTACK.md` - Technology stack documentation

### Tech Stack Detection

Check these files to understand the project:
- `package.json` - Node.js/JavaScript projects
- `composer.json` - PHP/Laravel projects
- `requirements.txt` - Python projects
- `Gemfile` - Ruby/Rails projects

---

## Quick Reference

### Before Every Task

1. ✅ Read `CLAUDE-activeContext.md`
2. ✅ Enter Plan Mode
3. ✅ Ask intake questions
4. ✅ Wait for approval
5. ❌ Don't jump into coding

### During Implementation

1. ✅ Small, focused commits
2. ✅ Match existing patterns
3. ✅ Update tests
4. ✅ Update documentation
5. ❌ Don't over-engineer

### Before Committing

1. ✅ Run tests
2. ✅ Check for secrets
3. ✅ Update CHANGELOG if needed
4. ✅ Use conventional commits
5. ❌ Don't commit memory bank files

---

*For complete documentation, see `docs/VIBE_CODING_WORKFLOW.md`*
