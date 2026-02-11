# Quick Start Guide

> **Get started with AI-assisted development in 5 minutes**

## TL;DR

1. **Always read** `AGENT_HANDBOOK.md` first
2. **Always start** in Plan Mode - ask questions before coding
3. **Always keep** changes small and reviewable
4. **Never commit** secrets or memory bank files

---

## Step 1: Choose Your Platform

| If You Use | Read These Files |
|------------|------------------|
| **Claude Code** | `CLAUDE.md` → `AGENT_HANDBOOK.md` |
| **Cursor** | `.cursor/rules.md` → `CLAUDE.md` |
| **GitHub Copilot** | `.github/copilot-instructions.md` |
| **Gemini CLI** | `GEMINI.md` |
| **Windsurf** | `.windsurfrules` |
| **Cline** | `.clinerules` → `CLAUDE.md` |

---

## Step 2: Start Every Task in Plan Mode

**Ask these questions BEFORE writing any code:**

```markdown
1. What outcome should the user see when this is done?
2. Which stack: Laravel, Next.js, or WordPress plugin?
3. Deployment target: WHM AWS, Vercel, or React server?
4. What is in scope vs. out of scope?
5. Any constraints (deadlines, must-not-change)?
6. What are the acceptance criteria?
7. What tests are expected?
```

---

## Step 3: Follow the Workflow

```
DISCOVERY → PLANNING → IMPLEMENTATION → VERIFICATION → RELEASE
    │           │            │              │            │
    │           │            │              │            └─ Update CHANGELOG
    │           │            │              └─ Run tests, update docs
    │           │            └─ Small commits, match patterns
    │           └─ Define criteria, wait for approval
    └─ Read issue, ask intake questions
```

---

## Step 4: Use Memory Bank (Claude/Cursor)

Create these files to maintain context:

| File | Purpose |
|------|---------|
| `CLAUDE-activeContext.md` | Current session state & progress |
| `CLAUDE-patterns.md` | Code patterns to follow |
| `CLAUDE-decisions.md` | Why we chose what we chose |
| `CLAUDE-troubleshooting.md` | Problems & solutions |

---

## Step 5: Key Commands

### Claude Code Shortcuts

```
QNEW    → Load best practices
QPLAN   → Verify plan consistency
QCODE   → Implement and verify
QCHECK  → Full code review
QGIT    → Commit with conventional format
```

### Fast File Search

```bash
fd . -t f          # List all files
rg "search_term"   # Search content
fd "filename"      # Find by name
```

---

## Golden Rules

| DO ✅ | DON'T ❌ |
|-------|---------|
| Ask questions first | Jump into coding |
| Small, focused commits | Large, sweeping changes |
| Match existing patterns | Create new abstractions |
| Update docs when behavior changes | Leave docs stale |
| Preserve existing behavior | Change things "while you're there" |

---

## Common Patterns

### Starting a New Feature

```markdown
1. Read AGENT_HANDBOOK.md
2. Ask intake questions (Plan Mode)
3. Wait for answers
4. Create CLAUDE-activeContext.md
5. Implement in small commits
6. Verify with tests
7. Update docs
```

### Fixing a Bug

```markdown
1. Read CLAUDE-troubleshooting.md
2. Identify root cause
3. Propose minimal fix
4. Implement with test
5. Log solution in troubleshooting
```

### Code Review

```markdown
1. Check logical errors
2. Verify tests exist
3. Ensure docs updated
4. Match repo conventions
5. No secrets committed
```

---

## Next Steps

- 📖 Full workflow: `VIBE_CODING_WORKFLOW.md`
- 📋 Agent handbook: `AGENT_HANDBOOK.md`
- 🔧 Tech stack: `TECHSTACK.md`
- 📝 CLAUDE.md examples: `../examples/`

---

*Remember: Plan first, code second, document always.*
