# Vibe Coding Workflow - Master Guide

> **Comprehensive documentation for the AI Project Governance Starter boilerplate**

This guide establishes the complete workflow for AI-assisted ("vibe") coding across multiple IDEs, LLMs, and AI tools. Use this as your primary reference for setting up, operating, and maintaining AI-driven development workflows.

---

## Table of Contents

1. [Repository Overview](#1-repository-overview)
2. [File Reading Order](#2-file-reading-order)
3. [Setup by Platform](#3-setup-by-platform)
4. [Plan Mode Intake Questions](#4-plan-mode-intake-questions)
5. [Files to Create for Planning](#5-files-to-create-for-planning)
6. [Workflow Phases](#6-workflow-phases)
7. [Agent System](#7-agent-system)
8. [Memory Bank System](#8-memory-bank-system)
9. [Commands and Skills](#9-commands-and-skills)
10. [Platform-Specific Configuration](#10-platform-specific-configuration)

---

## 1. Repository Overview

### Purpose

This boilerplate provides **governance templates for AI-assisted development** with:

- Standardized agent behavior rules
- Consistent workflows across AI tools
- Memory bank systems for session continuity
- Pre-built agent personas and skills
- Security and quality guardrails

### Core Philosophy

| Principle | Description |
|-----------|-------------|
| **Plan Mode First** | Always ask intake questions before coding |
| **Small Changes** | Keep commits minimal and reviewable |
| **Preserve Behavior** | Don't change existing code unless asked |
| **Document Everything** | Update docs when behavior changes |
| **Safety First** | Never commit secrets or credentials |

### Directory Structure

```
/
├── .claude/                    # Claude Code specific configs
│   ├── ../agents/                 # Subagent definitions
│   ├── commands/               # Slash commands
│   ├── ../skills/                 # SKILL.md definitions
│   ├── mcp/                    # MCP server configs
│   └── settings.json           # Claude settings
├── .cursor/                    # Cursor IDE configs
│   └── rules.md                # Cursor-specific rules
├── .github/                    # GitHub configs
│   ├── copilot-instructions.md # GitHub Copilot rules
│   └── pull_request_template.md
├── ../agents/                     # External agent library
│   ├── critical/               # Core agent personas
│   └── README.md
├── docs/                       # Core documentation
│   ├── AGENT_HANDBOOK.md       # Source of truth
│   ├── AGENT_ROLES.md          # Role definitions
│   ├── WORKFLOW.md             # Phased build process
│   ├── VERSIONING.md           # SemVer policy
│   └── RELEASE_PROCESS.md      # Release steps
├── ../skills/                     # Security/pentest skills
├── ../examples/         # CLAUDE.md examples/templates
├── CLAUDE.md                   # Primary Claude config
├── CLAUDE-*.md                 # Domain-specific configs
├── GEMINI.md                   # Gemini CLI config
├── CODEX.md                    # OpenAI Codex adapter
├── BLACKBOX.md                 # Blackbox adapter
├── .windsurfrules              # Windsurf adapter
├── .clinerules                 # Cline adapter
├── AI_GUIDE.md                 # AISP specification
├── TECHSTACK.md                # Tech stack documentation
└── AGENTS.md                   # Quick command reference
```

---

## 2. File Reading Order

### Phase 1: First Contact (Required Reading)

Read these files **immediately** when starting any work:

| Order | File | Purpose | When |
|-------|------|---------|------|
| 1 | `AGENT_HANDBOOK.md` | Source of truth for all behavior | Always |
| 2 | `WORKFLOW.md` | Understand the phased workflow | Always |
| 3 | `CLAUDE.md` (or tool-specific) | Tool-specific instructions | Always |
| 4 | `CLAUDE-activeContext.md` | Current session state (if exists) | Session continuity |

### Phase 2: Context Loading (As Needed)

Load these based on the task:

| File | Load When |
|------|-----------|
| `AGENT_ROLES.md` | Working with multiple agents |
| `TECHSTACK.md` | Need to understand tech choices |
| `CLAUDE-patterns.md` | Implementing features matching existing code |
| `CLAUDE-decisions.md` | Making architectural choices |
| `CLAUDE-troubleshooting.md` | Debugging or fixing issues |
| `CLAUDE-config-variables.md` | Configuration questions |

### Phase 3: Domain-Specific (When Relevant)

| File | Domain |
|------|--------|
| `CLAUDE-cloudflare.md` | Cloudflare Workers/Pages projects |
| `CLAUDE-wordpress.md` | WordPress plugin development |
| `CLAUDE-vercel.md` | Vercel deployment |
| `CLAUDE-whm.md` | WHM/cPanel server management |
| `CLAUDE-convex.md` | Convex backend |

### Reading Rules

```
┌─────────────────────────────────────────────────┐
│            FILE READING DECISION TREE           │
└─────────────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │ Is this a new task?   │
          └───────────┬───────────┘
                      │
         Yes ─────────┴───────── No
          │                       │
          ▼                       ▼
  ┌───────────────┐      ┌───────────────┐
  │ Read Handbook │      │ Check Active  │
  │ + Workflow    │      │    Context    │
  └───────┬───────┘      └───────┬───────┘
          │                       │
          ▼                       ▼
  ┌───────────────┐      ┌───────────────┐
  │ Load tool-    │      │ Resume from   │
  │ specific MD   │      │ last state    │
  └───────────────┘      └───────────────┘
```

---

## 3. Setup by Platform

### Claude Code Setup

**Required Files:**
- `CLAUDE.md` - Main instructions file
- `.claude/settings.json` - Settings configuration
- `.claude/../agents/*.md` - Subagent definitions
- `.claude/commands/**/*.md` - Slash commands
- `.claude/../skills/*/SKILL.md` - Skills definitions

**Configuration:**

```jsonc
// .claude/settings.json
{
  "permissions": {
    "allow": ["Read", "Write", "Bash(*)", "Grep", "Glob"],
    "deny": []
  },
  "env": {
    "EDITOR": "code"
  }
}
```

**Memory Bank Files to Create:**
- `CLAUDE-activeContext.md` - Session state
- `CLAUDE-patterns.md` - Code patterns
- `CLAUDE-decisions.md` - Architecture decisions
- `CLAUDE-troubleshooting.md` - Solutions log

---

### Cursor IDE Setup

**Required Files:**
- `.cursor/rules.md` - Cursor-specific rules
- `CLAUDE.md` - Also read by Cursor

**Configuration:**

```markdown
# .cursor/rules.md

- Follow `AGENT_HANDBOOK.md`.
- Start in plan mode, ask the required intake questions, and wait for
  answers before making changes.
- Make minimal, well-scoped changes.
- Update docs when user-facing behavior changes.
```

---

### GitHub Copilot Setup

**Required Files:**
- `.github/copilot-instructions.md` - Copilot rules

**Configuration:**

```markdown
# Copilot Instructions

## Ground Rules
- Follow the policies in `AGENT_HANDBOOK.md`.
- Prefer small, reviewable changes.
- Do not commit secrets or credentials.

## Code Quality
- Match existing style and formatting.
- Add tests when behavior changes.
- Update documentation when user-facing behavior changes.
```

---

### Gemini CLI Setup

**Required Files:**
- `GEMINI.md` - Gemini-specific instructions

**Key Configuration:**
- Ignore CLAUDE.md files
- Strict adherence to instructions
- No unsolicited suggestions
- Memory bank: `GEMINI-*.md` files

---

### Windsurf Setup

**Required Files:**
- `.windsurfrules` - Windsurf adapter

**Configuration:**

```
Follow the policies in AGENT_HANDBOOK.md and WORKFLOW.md.
Start in plan mode, ask the required intake questions, and wait for
answers before making changes.
Keep changes small and focused.
```

---

### Cline Setup

**Required Files:**
- `.clinerules` - Cline adapter

**Configuration:**

```
# Cline's Memory Bank

Read and use @CLAUDE.md for instruction
```

---

### Blackbox/Codex Setup

**Required Files:**
- `BLACKBOX.md` - Blackbox adapter
- `CODEX.md` - OpenAI Codex adapter

Both reference `AGENT_HANDBOOK.md` as the source of truth.

---

## 4. Plan Mode Intake Questions

**MANDATORY**: Ask these questions before making ANY changes:

### Required Questions (From Agent Handbook)

| # | Question | Purpose |
|---|----------|---------|
| 1 | What outcome should the user see when this is done? | Define success criteria |
| 2 | Which stack is required: Laravel app, Next.js app, or WordPress plugin? | Technology selection |
| 3 | Where is the deployment target: WHM AWS LAMP server, Vercel, or existing React server? | Infrastructure decisions |
| 4 | What is in scope vs. explicitly out of scope? | Boundary definition |
| 5 | Are there constraints (deadlines, tech choices, must-not-change areas)? | Risk identification |
| 6 | What are the acceptance criteria and how will we verify success? | Quality gates |
| 7 | What tests or checks are expected? | Verification strategy |

### Extended Questions (Optional)

For complex projects, also consider:

```markdown
## Technical Discovery
- What is the current state of the codebase?
- Are there existing patterns we must follow?
- What dependencies exist?
- What is the testing strategy?

## Risk Assessment
- What could break?
- What areas should not be modified?
- Are there performance concerns?

## Integration Points
- What external systems are involved?
- What APIs must be maintained?
- What data migrations are needed?
```

---

## 5. Files to Create for Planning

### Session Planning Files

Create these files for each significant development effort:

#### `CLAUDE-activeContext.md`

```markdown
# Active Context

## Current Session
- **Date**: YYYY-MM-DD
- **Goal**: [Primary objective]
- **Branch**: [Git branch name]

## Progress
- [ ] Task 1
- [x] Task 2 (completed)
- [ ] Task 3

## Blockers
- None currently

## Decisions Made
- Decision 1: [Rationale]

## Next Steps
1. Step 1
2. Step 2
```

#### `CLAUDE-patterns.md`

```markdown
# Code Patterns

## Established Patterns

### Pattern: [Name]
- **Location**: `src/path/to/example.ts`
- **Usage**: When to use this pattern
- **Example**:
```typescript
// Code example
```

## Conventions
- Naming: [conventions]
- File structure: [conventions]
- Testing: [conventions]
```

#### `CLAUDE-decisions.md`

```markdown
# Architecture Decisions

## ADR-001: [Decision Title]
- **Date**: YYYY-MM-DD
- **Status**: Accepted/Deprecated/Superseded
- **Context**: Why was this decision needed?
- **Decision**: What was decided?
- **Consequences**: What are the implications?
```

#### `CLAUDE-troubleshooting.md`

```markdown
# Troubleshooting Guide

## Issue: [Problem Description]
- **Symptoms**: What you see
- **Cause**: Root cause
- **Solution**: How to fix
- **Prevention**: How to avoid
```

### Project Planning Documents

For larger initiatives:

#### Planning Report Template

Save to: `reports/planning/plan_[feature]_DD-MM-YYYY_HHMMSS.md`

```markdown
# Implementation Plan: [Feature Name]

## Executive Summary
[High-level overview]

## Requirements
- Functional: [list]
- Non-functional: [list]

## Technical Design
[Architecture decisions]

## Task Breakdown
| ID | Task | Estimated Hours | Dependencies |
|----|------|-----------------|--------------|
| 1 | Task 1 | 2h | None |

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|

## Success Metrics
- [ ] Metric 1
- [ ] Metric 2

## Timeline
- Start: YYYY-MM-DD
- End: YYYY-MM-DD
```

---

## 6. Workflow Phases

### Phase 1: Discovery

```
┌─────────────────────────────────────────────────────┐
│                    DISCOVERY                         │
├─────────────────────────────────────────────────────┤
│ 1. Read the issue/request                           │
│ 2. Examine current code (if exists)                 │
│ 3. Identify constraints and dependencies            │
│ 4. Enter PLAN MODE                                  │
│ 5. Ask ALL required intake questions                │
│ 6. DO NOT modify files until questions answered     │
└─────────────────────────────────────────────────────┘
```

### Phase 2: Planning

```
┌─────────────────────────────────────────────────────┐
│                     PLANNING                         │
├─────────────────────────────────────────────────────┤
│ 1. Propose minimal, testable change                 │
│ 2. Define acceptance criteria                       │
│ 3. Confirm deployment target                        │
│ 4. Confirm stack choices                            │
│ 5. Document in CLAUDE-activeContext.md              │
│ 6. Wait for user approval                           │
└─────────────────────────────────────────────────────┘
```

### Phase 3: Implementation

```
┌─────────────────────────────────────────────────────┐
│                  IMPLEMENTATION                      │
├─────────────────────────────────────────────────────┤
│ 1. Apply small, focused commits                     │
│ 2. Keep formatting consistent with existing code    │
│ 3. Preserve existing behavior                       │
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
│ 2. Verify acceptance criteria met                   │
│ 3. Update documentation if behavior changed         │
│ 4. Log issues in CLAUDE-troubleshooting.md          │
│ 5. Update CLAUDE-activeContext.md progress          │
└─────────────────────────────────────────────────────┘
```

### Phase 5: Release Readiness

```
┌─────────────────────────────────────────────────────┐
│                 RELEASE READINESS                    │
├─────────────────────────────────────────────────────┤
│ 1. Update CHANGELOG.md                              │
│ 2. Follow VERSIONING.md policy                      │
│ 3. Tag release per RELEASE_PROCESS.md               │
│ 4. Sync memory bank files                           │
│ 5. Clean up temporary files                         │
└─────────────────────────────────────────────────────┘
```

---

## 7. Agent System

### Critical Agents (Always Available)

Located in `../agents/critical/`:

| Agent | Role | When to Use |
|-------|------|-------------|
| `product-manager.md` | Requirements, scope, priorities | Starting new features |
| `software-engineer.md` | Implementation | Writing code |
| `code-reviewer.md` | Quality assurance | Before merging |
| `qa-engineer.md` | Testing | Verification phase |

### Orchestrator Agents

Located in `../examples/CLAUDE.md Collection/orchestrators/`:

| Agent | Role |
|-------|------|
| `tech-lead-orchestrator.md` | Coordinates multi-step tasks, never writes code |
| `project-analyst.md` | Detects tech stack, analyzes unfamiliar codebases |
| `team-configurator.md` | Configures agent teams |

### Specialist Agents

Framework-specific experts:

- **Django**: `django-backend-expert.md`, `django-api-developer.md`, `django-orm-expert.md`
- **Rails**: `rails-backend-expert.md`, `rails-api-developer.md`, `rails-activerecord-expert.md`
- **Laravel**: `laravel-backend-expert.md`, `laravel-eloquent-expert.md`
- **React**: `react-component-architect.md`, `react-nextjs-expert.md`
- **Vue**: `vue-component-architect.md`, `vue-nuxt-expert.md`, `vue-state-manager.md`
- **Universal**: `backend-developer.md`, `frontend-developer.md`, `api-architect.md`

### Claude Code Subagents

Located in `.claude/../agents/`:

| Agent | Purpose |
|-------|---------|
| `code-searcher.md` | Codebase analysis with CoD methodology |
| `memory-bank-synchronizer.md` | Sync memory bank with code reality |
| `ux-design-expert.md` | UX/UI design guidance |

---

## 8. Memory Bank System

### Claude Memory Bank

Files prefixed with `CLAUDE-`:

| File | Purpose | Update Frequency |
|------|---------|------------------|
| `CLAUDE-activeContext.md` | Current session state | Every session |
| `CLAUDE-patterns.md` | Code patterns & conventions | When patterns evolve |
| `CLAUDE-decisions.md` | Architecture decisions | When decisions made |
| `CLAUDE-troubleshooting.md` | Issues & solutions | When bugs fixed |
| `CLAUDE-config-variables.md` | Configuration reference | When config changes |
| `CLAUDE-temp.md` | Scratch pad | Only when referenced |

### Gemini Memory Bank

Files prefixed with `GEMINI-`:

| File | Purpose |
|------|---------|
| `GEMINI-codebase.md` | File structure documentation |
| `GEMINI-activeContext.md` | Session state |
| `GEMINI-patterns.md` | Patterns & conventions |
| `GEMINI-decisions.md` | Architecture decisions |
| `GEMINI-troubleshooting.md` | Issues & solutions |
| `GEMINI-config-variables.md` | Configuration |
| `GEMINI-temp.md` | Scratch pad |

### Memory Bank Rules

1. **Check memory bank FIRST** before starting work
2. **Update actively** - keep files current with actual code
3. **Preserve history** - don't delete achievements or lessons learned
4. **Sync on changes** - use `memory-bank-synchronizer` agent periodically
5. **Never commit** - exclude from git commits unless explicitly asked

---

## 9. Commands and Skills

### Available Slash Commands

Located in `.claude/commands/`:

#### Anthropic Commands
| Command | Purpose |
|---------|---------|
| `/anthropic/apply-thinking-to` | Apply extended thinking |
| `/anthropic/convert-to-todowrite-tasklist-prompt` | Convert to task list |
| `/anthropic/update-memory-bank` | Update memory bank files |

#### Architecture Commands
| Command | Purpose |
|---------|---------|
| `/architecture/explain-architecture-pattern` | Explain patterns |

#### Cleanup Commands
| Command | Purpose |
|---------|---------|
| `/cleanup/cleanup-context` | Clean context |

#### Prompt Engineering Commands
| Command | Purpose |
|---------|---------|
| `/promptengineering/batch-operations-prompt` | Batch operations |
| `/promptengineering/convert-to-test-driven-prompt` | TDD prompts |

#### Refactor Commands
| Command | Purpose |
|---------|---------|
| `/refactor/refactor-code` | Code refactoring analysis |

#### Security Commands
| Command | Purpose |
|---------|---------|
| `/security/check-best-practices` | Security best practices |
| `/security/secure-prompts` | Secure prompt design |
| `/security/security-audit` | Security audit |

### Skills

Located in `.claude/../skills/`:

| Skill | Purpose |
|-------|---------|
| `claude-docs-consultant` | Fetch official Claude Code docs |

### Shortcuts (From Sabrina's Guide)

Keyboard shortcuts for common operations:

| Shortcut | Action |
|----------|--------|
| `QNEW` | Understand best practices |
| `QPLAN` | Analyze plan for consistency |
| `QCODE` | Implement and verify |
| `QCHECK` | Full code review checklist |
| `QCHECKF` | Function checklist only |
| `QCHECKT` | Test checklist only |
| `QUX` | UX testing scenarios |
| `QGIT` | Commit with conventional format |

---

## 10. Platform-Specific Configuration

### Quick Reference: Which Files to Use

| Platform | Primary Config | Memory Bank Prefix | Notes |
|----------|---------------|-------------------|-------|
| Claude Code | `CLAUDE.md` | `CLAUDE-` | Full subagent support |
| Cursor | `.cursor/rules.md` + `CLAUDE.md` | `CLAUDE-` | Limited subagent |
| GitHub Copilot | `.github/copilot-instructions.md` | N/A | No memory bank |
| Gemini CLI | `GEMINI.md` | `GEMINI-` | Separate memory bank |
| Windsurf | `.windsurfrules` | `CLAUDE-` | References handbook |
| Cline | `.clinerules` | `CLAUDE-` | References CLAUDE.md |
| Blackbox | `BLACKBOX.md` | `CLAUDE-` | References handbook |
| Codex | `CODEX.md` | `CLAUDE-` | References handbook |

### Feature Support Matrix

| Feature | Claude | Cursor | Copilot | Gemini | Windsurf | Cline |
|---------|--------|--------|---------|--------|----------|-------|
| Subagents | ✅ | ⚠️ | ❌ | ❌ | ❌ | ⚠️ |
| Memory Bank | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Commands | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Skills | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| MCP Servers | ✅ | ⚠️ | ❌ | ❌ | ⚠️ | ⚠️ |
| Plan Mode | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ |

Legend: ✅ Full | ⚠️ Partial | ❌ None

---

## Quick Start Checklist

### For New Projects

- [ ] Copy this boilerplate to project root
- [ ] Customize `TECHSTACK.md` for your stack
- [ ] Update `.env.example` with required variables
- [ ] Create initial `CLAUDE-activeContext.md`
- [ ] Configure tool-specific files for your IDE
- [ ] Read `AGENT_HANDBOOK.md` thoroughly

### For Each Session

- [ ] Check `CLAUDE-activeContext.md` for session state
- [ ] Review any blockers or next steps
- [ ] Enter **plan mode** before making changes
- [ ] Ask intake questions if starting new work
- [ ] Update memory bank files as you work
- [ ] Commit changes with conventional commit format

### Before Committing

- [ ] Run tests
- [ ] Update documentation if behavior changed
- [ ] Update `CHANGELOG.md` if significant
- [ ] Never commit memory bank files
- [ ] Never commit `.env` or secrets

---

## Related Documentation

- **Core**: `AGENT_HANDBOOK.md`, `WORKFLOW.md`
- **Versioning**: `VERSIONING.md`, `RELEASE_PROCESS.md`
- **CLAUDE.md Guides**: `../examples/readme.md`
- **Tech Stack**: `TECHSTACK.md`
- **AI Specification**: `AI_GUIDE.md` (AISP 5.1)
- **MCP Servers**: `SUBAGENTS_AND_MCP_SERVERS.md`

## MCP Server Configurations

Pre-configured MCP server stacks are available in `.claude/mcp/`:

| File | Purpose |
|------|---------|
| `web-dev-stack.json` | GitHub, Playwright, Supabase, Figma, Context7 |
| `security-stack.json` | SonarQube, Sentry, Snyk |
| `project-management.json` | Linear, Jira, Notion, GitHub |
| `devops-stack.json` | Docker, AWS, Cloudflare, Vercel |

Platform-specific configs:
- Cursor: `.cursor/mcp.json`
- Cline: `.cline/mcp_settings.json`

---

*Last Updated: January 2026*
*Version: 1.0.0*
