# Ops Agenda

> **AI-powered daily and weekly agenda tool** — Transforms email and calendar data into structured, actionable agendas.

**Company:** Kre8ivTech
**Author:** Jeremiah Castillo
**License:** Proprietary
**Contact:** info@kre8ivtech.com

---

## Mission

Ops Agenda helps professionals take control of their day by transforming scattered email and calendar data into a clear, prioritized operational agenda — automatically, every morning.

## North Star Feature: Daily Ops Brief

A single-screen dashboard that delivers:
- Narrative summary of the day ahead
- Visual timeline of meetings and focus blocks
- Top 3 priorities (auto-ranked by AI)
- Due-outs with deadlines
- Meeting prep materials
- Suggested focus blocks

---

## Core Modules

| Module | Description |
|--------|-------------|
| **Daily Ops Brief** | AI-generated narrative summary, timeline, Top 3 priorities |
| **Priority Inbox** | P1/P2/P3/FYSA email classification with confidence scores |
| **Due-Out Detection** | NLP extraction of deadlines and action items from emails |
| **Calendar Intelligence** | Multi-calendar aggregation, conflict detection, prep time |
| **Weekly Outlook** | Forward-looking weekly planning view |
| **Draft Reply** | AI-suggested email responses (user must approve before send) |
| **M365 Sync** | Microsoft Graph API integration (Mail.Read, Calendars.Read) |
| **AI Pipeline** | JSON-only structured output, schema validation, confidence scores |
| **Onboarding** | Microsoft OAuth 2.0, calendar selection, preference setup |

---

## Key Constraints (from PRD)

- **No raw email bodies stored** — only metadata and AI-generated summaries
- **No autonomous actions** — AI never sends, archives, or flags emails in v1
- **JSON-only AI output** — schema validated on every response
- **Least-privilege scopes** — Mail.Read, Calendars.Read only
- **SOC 2 aligned** — encryption at rest/transit, immutable audit logs, tenant isolation
- **Dashboard load < 2 seconds**
- **30-day default data retention**

---

## Tech Stack

- **Framework:** Next.js
- **Integration:** Microsoft 365 via Microsoft Graph API
- **AI:** LLM provider (TBD) — JSON structured output only
- **Database:** PostgreSQL (provider TBD)
- **Auth:** Microsoft OAuth 2.0
- **Payments:** Stripe (TBD)

> Full tech requirements: [TECHNOLOGY_DISCOVERY.md](setup/docs/TECHNOLOGY_DISCOVERY.md)
> Stack details pending Architecture phase finalization.

---

## Project Structure

```
ops-agenda/
├── setup/                          # Setup & governance
│   ├── docs/                       # Documentation
│   │   ├── AGENT_HANDBOOK.md       # AI behavior rules (source of truth)
│   │   ├── WORKFLOW.md             # Phased build process
│   │   ├── QUICK_START.md          # Getting started
│   │   ├── DEVELOPMENT_ORCHESTRATION.md # Full lifecycle
│   │   ├── TECHNOLOGY_DISCOVERY.md # Tech requirements
│   │   ├── BRAND_AND_DESIGN_DISCOVERY.md # Brand intake
│   │   ├── VIBE_CODING_WORKFLOW.md # Master reference
│   │   └── ...                     # Additional governance docs
│   ├── examples/                   # CLAUDE.md templates
│   ├── agents/                     # Agent personas
│   ├── skills/                     # Coding standards & security skills
│   └── tools/                      # Helper tools
├── CLAUDE.md                       # AI instructions (Claude Code)
├── CODEX.md                        # AI instructions (OpenAI Codex)
├── BLACKBOX.md                     # AI instructions (Blackbox AI)
├── .clinerules                     # AI instructions (Cline)
├── .windsurfrules                  # AI instructions (Windsurf)
├── .cursor/rules.md                # AI instructions (Cursor)
├── .github/copilot-instructions.md # AI instructions (Copilot)
├── TECHSTACK.md                    # Technology stack documentation
├── CHANGELOG.md                    # Version history
├── .env.example                    # Environment variable template
└── CLAUDE-*.md                     # Memory bank system files
```

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Kre8ivTech/ops-agenda.git
cd ops-agenda
```

### 2. Set Environment Variables

```bash
cp .env.example .env
# Fill in required keys:
# - MICROSOFT_CLIENT_ID / SECRET / TENANT_ID (Microsoft Graph)
# - AI_API_KEY (LLM provider)
# - DATABASE_URL (PostgreSQL)
# - STRIPE_SECRET_KEY (payments)
```

### 3. Start Development

```bash
# Use your preferred AI coding tool and follow the governance docs:
# - setup/docs/AGENT_HANDBOOK.md (source of truth)
# - setup/docs/WORKFLOW.md (build phases)
# - setup/docs/QUICK_START.md (5-minute guide)
```

---

## Documentation Index

### Core Workflow
| Document | Purpose |
|----------|---------|
| [Agent Handbook](setup/docs/AGENT_HANDBOOK.md) | AI behavior rules (source of truth) |
| [Workflow](setup/docs/WORKFLOW.md) | Phased build process |
| [Quick Start](setup/docs/QUICK_START.md) | 5-minute getting started |
| [Development Orchestration](setup/docs/DEVELOPMENT_ORCHESTRATION.md) | Full lifecycle phases |

### Discovery & Design
| Document | Purpose |
|----------|---------|
| [Technology Discovery](setup/docs/TECHNOLOGY_DISCOVERY.md) | Tech requirements & capabilities |
| [Brand Discovery](setup/docs/BRAND_AND_DESIGN_DISCOVERY.md) | Brand intake & design system |
| [Vibe Coding Workflow](setup/docs/VIBE_CODING_WORKFLOW.md) | Master reference guide |

### Policies & Standards
| Document | Purpose |
|----------|---------|
| [Progressive Guardrails](setup/docs/PROGRESSIVE_GUARDRAILS.md) | Scope boundaries |
| [Agent Roles](setup/docs/AGENT_ROLES.md) | AI agent responsibilities |
| [Versioning](setup/docs/VERSIONING.md) | SemVer policy |
| [Release Process](setup/docs/RELEASE_PROCESS.md) | Release workflow |

---

## MVP Scope — Explicitly Out

- Auto-sending, archiving, or flagging emails
- Team workflows or shared inboxes
- Task manager, CRM, or chat integrations
- Google Calendar or non-M365 providers
- Mobile native apps (responsive web only)

---

> **Ready to start?** See [setup/docs/QUICK_START.md](setup/docs/QUICK_START.md) for the 5-minute onboarding guide.
