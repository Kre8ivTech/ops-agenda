# Ops Agenda — Agent Reference

> This file provides a quick reference for AI agent roles and configurations used in the Ops Agenda project.

---

## Agent Roles

See [setup/docs/AGENT_ROLES.md](setup/docs/AGENT_ROLES.md) for detailed role definitions:

| Role | Responsibility |
|------|---------------|
| **Lead Agent** | Architecture decisions, module boundaries, PRD compliance |
| **Implementer** | Feature development, M365 integration, AI pipeline code |
| **Reviewer** | Code review, security audit, SOC 2 compliance checks |

---

## Subagents & MCP Servers

See [setup/docs/SUBAGENTS_AND_MCP_SERVERS.md](setup/docs/SUBAGENTS_AND_MCP_SERVERS.md) for recommended stacks:

| Stack | Purpose |
|-------|---------|
| **Core** | GitHub, Playwright, Supabase, Figma |
| **Extended** | SonarQube, Sentry |
| **Security Audit** | Pentest tools, OWASP checks |

---

## Key Governance Docs

| Document | Purpose |
|----------|---------|
| [Agent Handbook](setup/docs/AGENT_HANDBOOK.md) | Source of truth for AI behavior |
| [Workflow](setup/docs/WORKFLOW.md) | Phased build process |
| [Progressive Guardrails](setup/docs/PROGRESSIVE_GUARDRAILS.md) | Scope boundaries |
| [Build with Quality](setup/docs/BUILD-WITH-QUALITY-PROMPT.md) | Quality prompts |
