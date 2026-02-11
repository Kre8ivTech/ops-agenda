# Setup Directory

This directory contains all setup, documentation, and template files for the AI Project Governance Starter kit.

## Directory Structure

```
setup/
├── docs/           # Documentation and workflow guides
├── examples/       # CLAUDE.md examples and templates
├── agents/         # Pre-built agent personas
├── skills/         # Coding standards and skill definitions
├── tools/          # Helper tools (coding-standards-builder)
└── scripts/        # Utility scripts
```

## Contents

### docs/
Core documentation for the AI-assisted development workflow:
- `AGENT_HANDBOOK.md` - AI behavior rules and governance
- `WORKFLOW.md` - Phased build process
- `DEVELOPMENT_ORCHESTRATION.md` - Full lifecycle phases
- `QUICK_START.md` - 5-minute getting started guide
- `PLATFORM_SETUP.md` - IDE-specific setup instructions
- `VIBE_CODING_WORKFLOW.md` - Master reference guide

### examples/
CLAUDE.md examples and templates from community contributors:
- Various CLAUDE.md implementations for different frameworks
- Optimizers, orchestrators, and specialized configurations

### agents/
Pre-built agent personas for delegation:
- `critical/software-engineer.md` - Implementation agent
- `critical/code-reviewer.md` - Code review agent
- `critical/qa-engineer.md` - Testing agent
- `critical/product-manager.md` - Requirements agent

### skills/
Coding standards and skill definitions (38 total):
- Best practices: JavaScript, PHP, React, Next.js, Laravel, WordPress
- Database standards: MySQL, MariaDB, Supabase
- Security skills: Penetration testing, vulnerability scanning

### tools/
Helper tools for the development workflow:
- `coding-standards-builder/` - Auto-detection and loading of coding standards

### scripts/
Utility scripts:
- `sync-agents.sh` - Sync agents from external repository

## Usage

These files are bundled with the template and provide the foundation for AI-assisted development. The AI tools (Claude Code, Cursor, Cline, etc.) reference these files through their configuration.

**Key integration points:**
- `.claude/config/coding-standards.json` references `setup/skills/`
- `.claude/skills/delegate/SKILL.md` references `setup/agents/`
- `CLAUDE.md` references `setup/docs/`

## Customization

When starting a new project from this template:
1. Review and customize `docs/PROJECT_IDENTITY.md`
2. Complete brand discovery using `docs/BRAND_AND_DESIGN_DISCOVERY.md`
3. Optionally add project-specific skills to `skills/`
4. Create project documentation in `docs/project/`
