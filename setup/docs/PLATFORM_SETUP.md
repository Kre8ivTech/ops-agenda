# Platform Setup Guides

> **Detailed setup instructions for each AI coding assistant**

---

## Table of Contents

1. [Claude Code](#1-claude-code)
2. [Cursor IDE](#2-cursor-ide)
3. [GitHub Copilot](#3-github-copilot)
4. [Gemini CLI](#4-gemini-cli)
5. [Windsurf](#5-windsurf)
6. [Cline](#6-cline)
7. [Blackbox AI](#7-blackbox-ai)
8. [OpenAI Codex](#8-openai-codex)
9. [Multi-Platform Setup](#9-multi-platform-setup)

---

## 1. Claude Code

### Overview

Claude Code has the **most complete feature support** for this boilerplate, including subagents, skills, commands, and MCP servers.

### Required Files

```
.claude/
├── settings.json         # Permissions and settings
├── settings.local.json   # Local overrides
├── ../agents/               # Subagent definitions
│   ├── code-searcher.md
│   ├── memory-bank-synchronizer.md
│   └── ux-design-expert.md
├── commands/             # Slash commands
│   ├── anthropic/
│   ├── architecture/
│   ├── cleanup/
│   ├── promptengineering/
│   ├── refactor/
│   └── security/
├── ../skills/               # SKILL.md definitions
│   └── claude-docs-consultant/
│       └── SKILL.md
└── mcp/                  # MCP server configs
    └── chrome-devtools.json

CLAUDE.md                 # Primary instructions
CLAUDE-*.md               # Memory bank files (create as needed)
```

### Setup Steps

1. **Verify settings.json**

```jsonc
// .claude/settings.json
{
  "permissions": {
    "allow": [
      "Read(*)",
      "Write(*)",
      "Bash(*)",
      "Grep",
      "Glob",
      "LS"
    ],
    "deny": []
  }
}
```

2. **Create Memory Bank Files**

```bash
# Create initial memory bank
touch CLAUDE-activeContext.md
touch CLAUDE-patterns.md
touch CLAUDE-decisions.md
touch CLAUDE-troubleshooting.md
```

3. **Initialize Active Context**

```markdown
# CLAUDE-activeContext.md

## Current Session
- **Date**: [today's date]
- **Goal**: Initial setup
- **Status**: Ready

## Progress
- [x] Claude Code configured
- [ ] First task pending
```

4. **Verify Subagents**

Test subagent availability:
```
@agent-code-searcher "test search"
@agent-memory-bank-synchronizer "sync check"
```

### Features Available

| Feature | Status | Notes |
|---------|--------|-------|
| Subagents | ✅ Full | All custom agents work |
| Memory Bank | ✅ Full | CLAUDE-*.md files |
| Commands | ✅ Full | /command syntax |
| Skills | ✅ Full | SKILL.md definitions |
| MCP Servers | ✅ Full | Chrome devtools, etc |
| TodoWrite | ✅ Full | Task management |

---

## 2. Cursor IDE

### Overview

Cursor supports CLAUDE.md files and has partial subagent support through its own agent system. The enhanced `.cursor/rules.md` provides comprehensive guidance including memory bank integration, workflow phases, and code quality standards.

### Required Files

```
.cursor/
└── rules.md              # Comprehensive Cursor-specific rules

CLAUDE.md                 # Also read by Cursor
CLAUDE-*.md               # Memory bank files
```

### Setup Steps

1. **Verify rules.md**

The enhanced `rules.md` includes:
- Plan mode intake questions
- Memory bank integration
- Workflow phases
- Code quality standards
- Command reference
- Git commit standards
- Cursor-specific features (Composer, Chat, Inline)

2. **Enable CLAUDE.md**

Cursor automatically reads `CLAUDE.md` when present. Ensure it's in the root.

3. **Memory Bank Setup**

```bash
# Create memory bank files
touch CLAUDE-activeContext.md
touch CLAUDE-patterns.md
touch CLAUDE-decisions.md
touch CLAUDE-troubleshooting.md
```

4. **Use @ References**

In Cursor Composer:
- `@filename` - Reference specific files
- `@folder/` - Reference directories
- `@CLAUDE-activeContext.md` - Check session state

### Features Available

| Feature | Status | Notes |
|---------|--------|-------|
| Subagents | ⚠️ Partial | Limited to Cursor's system |
| Memory Bank | ✅ Full | CLAUDE-*.md files |
| Commands | ❌ None | Not supported |
| Skills | ❌ None | Not supported |
| MCP Servers | ⚠️ Partial | Depends on Cursor version |
| Plan Mode | ✅ Full | Documented in rules.md |
| Intake Questions | ✅ Full | All 7 questions included |

---

## 3. GitHub Copilot

### Overview

GitHub Copilot now has comprehensive instruction support with full plan mode, intake questions, memory bank integration, and code generation guidelines.

### Required Files

```
.github/
├── copilot-instructions.md    # Comprehensive Copilot rules
└── pull_request_template.md   # PR template
```

### Setup Steps

1. **Verify copilot-instructions.md**

The enhanced file includes:
- Plan mode with all 7 intake questions
- Memory bank system integration
- Workflow phases documentation
- Code generation guidelines by language
- Git conventional commit standards
- Quick reference checklists
- Inline suggestion guidelines
- Chat mode guidelines

2. **Configure PR Template**

```markdown
## Summary
- 

## Testing
- 

## Checklist
- [ ] Docs updated (if needed)
- [ ] Tests added/updated (if needed)
- [ ] No secrets committed
```

3. **Memory Bank Integration**

While Copilot doesn't have native memory bank support, the instructions guide it to:
- Check `CLAUDE-activeContext.md` for session state
- Follow patterns from `CLAUDE-patterns.md`
- Reference `CLAUDE-decisions.md` for architecture

### Features Available

| Feature | Status | Notes |
|---------|--------|-------|
| Subagents | ❌ None | Not supported |
| Memory Bank | ⚠️ Reference | Can read but not auto-check |
| Commands | ❌ None | Not supported |
| Skills | ❌ None | Not supported |
| MCP Servers | ❌ None | Not supported |
| Plan Mode | ✅ Full | Documented in instructions |
| Intake Questions | ✅ Full | All 7 questions included |
| Code Generation | ✅ Full | Language-specific guidelines |

---

## 4. Gemini CLI

### Overview

Gemini CLI has its own separate memory bank system using `GEMINI-` prefixed files.

### Required Files

```
GEMINI.md                      # Primary instructions
GEMINI-*.md                    # Memory bank files (separate from Claude)
```

### Setup Steps

1. **Configure GEMINI.md**

The file is already configured. Key points:
- Ignores CLAUDE.md files
- Uses strict instruction adherence
- Has its own memory bank prefix

2. **Create Gemini Memory Bank**

```bash
touch GEMINI-codebase.md
touch GEMINI-activeContext.md
touch GEMINI-patterns.md
touch GEMINI-decisions.md
touch GEMINI-troubleshooting.md
touch GEMINI-config-variables.md
```

3. **Initialize GEMINI-activeContext.md**

```markdown
# Active Context

## Current Session
- **Date**: [today's date]
- **Goal**: Initial setup

## Progress
- [x] Gemini CLI configured
```

### Features Available

| Feature | Status | Notes |
|---------|--------|-------|
| Subagents | ❌ None | Not supported |
| Memory Bank | ✅ Full | GEMINI-*.md files |
| Commands | ❌ None | Not supported |
| Skills | ❌ None | Not supported |
| MCP Servers | ❌ None | Not supported |

### Important Behavioral Differences

- **Strict adherence**: Only does exactly what asked
- **No suggestions**: Won't offer unsolicited advice
- **Scope limitation**: Won't expand on requests
- **Clarification first**: Asks before exceeding scope

---

## 5. Windsurf

### Overview

Windsurf now has comprehensive rules with full plan mode support, memory bank integration, workflow phases, and code quality standards.

### Required Files

```
.windsurfrules              # Comprehensive Windsurf rules
```

### Setup Steps

1. **Verify .windsurfrules**

The enhanced file includes:
- All 7 plan mode intake questions
- Complete memory bank system documentation
- Full workflow phases (Discovery → Release)
- Code quality standards
- Command reference
- Git conventional commit standards
- Quick reference checklists

2. **Memory Bank Setup**

```bash
# Create memory bank files
touch CLAUDE-activeContext.md
touch CLAUDE-patterns.md
touch CLAUDE-decisions.md
touch CLAUDE-troubleshooting.md
```

3. **Verify Integration**

Windsurf shares memory bank with Claude using CLAUDE-*.md files.

### Features Available

| Feature | Status | Notes |
|---------|--------|-------|
| Subagents | ❌ None | Not supported |
| Memory Bank | ✅ Full | CLAUDE-*.md files |
| Commands | ❌ None | Not supported |
| Skills | ❌ None | Not supported |
| MCP Servers | ⚠️ Partial | Depends on version |
| Plan Mode | ✅ Full | Documented in rules |
| Intake Questions | ✅ Full | All 7 questions included |
| Workflow Phases | ✅ Full | All phases documented |

---

## 6. Cline

### Overview

Cline now has comprehensive rules with full plan mode support, memory bank integration, workflow phases, and investigation-first guidelines.

### Required Files

```
.clinerules                 # Comprehensive Cline rules
```

### Setup Steps

1. **Verify .clinerules**

The enhanced file includes:
- Primary directive to read `@CLAUDE.md`
- All 7 plan mode intake questions
- Complete memory bank system documentation
- Full workflow phases
- Code quality standards
- Investigation-before-answering rules
- Quick reference checklists

2. **Memory Bank Setup**

```bash
# Create memory bank files
touch CLAUDE-activeContext.md
touch CLAUDE-patterns.md
touch CLAUDE-decisions.md
touch CLAUDE-troubleshooting.md
```

3. **Use @ References**

In Cline:
- `@CLAUDE.md` - Primary instructions
- `@CLAUDE-activeContext.md` - Session state
- `@filename` - Reference specific files

### Features Available

| Feature | Status | Notes |
|---------|--------|-------|
| Subagents | ⚠️ Partial | Limited support |
| Memory Bank | ✅ Full | CLAUDE-*.md files |
| Commands | ❌ None | Not supported |
| Skills | ❌ None | Not supported |
| MCP Servers | ⚠️ Partial | Depends on version |
| Plan Mode | ✅ Full | Documented in rules |
| Intake Questions | ✅ Full | All 7 questions included |
| Workflow Phases | ✅ Full | All phases documented |

---

## 7. Blackbox AI

### Overview

Blackbox AI now has comprehensive documentation with full plan mode support, complete memory bank system, all workflow phases, code quality standards, and extensive quick reference guides.

### Required Files

```
BLACKBOX.md                 # Comprehensive Blackbox documentation
```

### Setup Steps

1. **Verify BLACKBOX.md**

The enhanced file includes:
- Complete AI guidance with behavioral guardrails
- All 7 plan mode intake questions with purpose descriptions
- Full memory bank system with creation templates
- Complete workflow phases with visual diagrams
- Code quality standards (architecture, quality, security)
- Command reference with fast/banned commands
- Git conventional commit standards
- Tech stack detection guide
- Error handling procedures
- Best practices summary

2. **Memory Bank Setup**

```bash
# Create memory bank files
touch CLAUDE-activeContext.md
touch CLAUDE-patterns.md
touch CLAUDE-decisions.md
touch CLAUDE-troubleshooting.md
```

3. **Initialize Active Context**

The BLACKBOX.md includes a template for creating activeContext:
```markdown
# CLAUDE-activeContext.md

## Current Session
- **Date**: YYYY-MM-DD
- **Goal**: [Primary objective]
- **Branch**: [Git branch name]
- **Status**: Ready / In Progress / Blocked
```

### Features Available

| Feature | Status | Notes |
|---------|--------|-------|
| Subagents | ❌ None | Not supported |
| Memory Bank | ✅ Full | CLAUDE-*.md files |
| Commands | ❌ None | Not supported |
| Skills | ❌ None | Not supported |
| Plan Mode | ✅ Full | Comprehensive documentation |
| Intake Questions | ✅ Full | All 7 with purpose |
| Workflow Phases | ✅ Full | Visual diagrams included |
| Code Quality | ✅ Full | Architecture + Security |
| Error Handling | ✅ Full | Procedures documented |

---

## 8. OpenAI Codex

### Overview

OpenAI Codex now has comprehensive documentation with code generation rules, language-specific guidelines, full plan mode support, and memory bank integration.

### Required Files

```
CODEX.md                    # Comprehensive Codex documentation
```

### Setup Steps

1. **Verify CODEX.md**

The enhanced file includes:
- Code-focused AI guidance
- Code generation rules (style matching, error handling)
- All 7 plan mode intake questions
- Complete memory bank system documentation
- Full workflow phases
- Code quality standards
- Language-specific guidelines (TypeScript, Python, PHP)
- Security rules for code generation
- Command reference
- Git conventional commit standards
- Quick reference checklists

2. **Memory Bank Setup**

```bash
# Create memory bank files
touch CLAUDE-activeContext.md
touch CLAUDE-patterns.md
touch CLAUDE-decisions.md
touch CLAUDE-troubleshooting.md
```

3. **Language-Specific Guidelines**

CODEX.md includes preferred patterns for:
- **TypeScript/JavaScript**: Type safety, async/await, optional chaining
- **Python**: Type hints, PEP 8, context managers
- **PHP**: Strict types, PSR-12, type declarations

### Features Available

| Feature | Status | Notes |
|---------|--------|-------|
| Subagents | ❌ None | Not supported |
| Memory Bank | ✅ Full | CLAUDE-*.md files |
| Commands | ❌ None | Not supported |
| Skills | ❌ None | Not supported |
| Plan Mode | ✅ Full | Comprehensive documentation |
| Intake Questions | ✅ Full | All 7 questions |
| Code Generation | ✅ Full | Language-specific guidelines |
| Security Rules | ✅ Full | No hardcoded secrets |

---

## 9. Multi-Platform Setup

### When Using Multiple AI Tools

If you switch between platforms, follow these practices:

### Shared Configuration

```
docs/
├── AGENT_HANDBOOK.md       # Single source of truth (all platforms)
├── WORKFLOW.md             # Shared workflow (all platforms)
└── VIBE_CODING_WORKFLOW.md # Master reference (all platforms)

CLAUDE-*.md                 # Shared by: Claude, Cursor, Windsurf, Cline, Blackbox, Codex
GEMINI-*.md                 # Gemini-only (separate system)
```

### Gitignore for Memory Banks

```gitignore
# Memory bank files - never commit
CLAUDE-activeContext.md
CLAUDE-temp.md
GEMINI-activeContext.md
GEMINI-temp.md

# Keep patterns and decisions - useful for team
# CLAUDE-patterns.md
# CLAUDE-decisions.md
```

### Session Handoff

When switching platforms mid-session:

1. **Update Active Context**

```markdown
# CLAUDE-activeContext.md

## Platform Handoff
- **Previous**: Claude Code
- **Current**: Cursor
- **Reason**: [why switching]
- **State**: [what was in progress]
```

2. **Sync Memory Banks** (if using Gemini)

Gemini uses separate files, so manually sync important context:

```bash
# Copy key context from Claude to Gemini
cp CLAUDE-patterns.md GEMINI-patterns.md
cp CLAUDE-decisions.md GEMINI-decisions.md
```

### Recommended Primary Platform

| Use Case | Recommended | Why |
|----------|-------------|-----|
| Full AI orchestration | **Claude Code** | Most features |
| IDE-integrated | **Cursor** | Best integration |
| Quick edits | **GitHub Copilot** | Fastest |
| Strict instructions | **Gemini CLI** | No scope creep |
| Lightweight | **Windsurf/Cline** | Simple setup |

### Complete Feature Matrix

| Feature | Claude | Cursor | Copilot | Gemini | Windsurf | Cline | Blackbox | Codex |
|---------|--------|--------|---------|--------|----------|-------|----------|-------|
| **Core** |
| Plan Mode | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Intake Questions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Workflow Phases | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Memory Bank | ✅ | ✅ | ⚠️ | ✅* | ✅ | ✅ | ✅ | ✅ |
| **Advanced** |
| Subagents | ✅ | ⚠️ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ |
| Commands | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Skills | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| MCP Servers | ✅ | ⚠️ | ❌ | ❌ | ⚠️ | ⚠️ | ❌ | ❌ |
| **Documentation** |
| Code Quality | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Git Standards | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Command Reference | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Quick Reference | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Specialized** |
| Code Generation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Language Guidelines | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ |
| Error Handling | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ |

Legend: ✅ Full | ⚠️ Partial | ❌ None | * = Separate prefix (GEMINI-)

### Configuration File Quick Reference

| Platform | Primary Config | Lines | Key Features |
|----------|---------------|-------|--------------|
| Claude Code | `CLAUDE.md` | 200+ | Full system with subagents |
| Cursor | `.cursor/rules.md` | 250+ | Composer/Chat/Inline modes |
| Copilot | `.github/copilot-instructions.md` | 300+ | Code generation guidelines |
| Gemini | `GEMINI.md` | 50+ | Strict instruction mode |
| Windsurf | `.windsurfrules` | 150+ | Complete workflow |
| Cline | `.clinerules` | 120+ | @ reference support |
| Blackbox | `BLACKBOX.md` | 400+ | Visual workflow diagrams |
| Codex | `CODEX.md` | 250+ | Language-specific patterns |

---

## Verification Checklist

### After Platform Setup

- [ ] Primary config file exists and is correct
- [ ] Memory bank files created (if supported)
- [ ] Agent handbook accessible
- [ ] Workflow documentation accessible
- [ ] Test a simple task in plan mode
- [ ] Verify intake questions are asked

### Before First Task

- [ ] Read `AGENT_HANDBOOK.md`
- [ ] Read `WORKFLOW.md`
- [ ] Check `CLAUDE-activeContext.md` (if exists)
- [ ] Understand tech stack from `TECHSTACK.md`

---

*For full workflow documentation, see `VIBE_CODING_WORKFLOW.md`*
