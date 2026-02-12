# Changelog

All notable changes to this project will be documented in this file.
This project adheres to the **Keep a Changelog** format and uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed
- **TECHSTACK.md**: Finalized architecture — Next.js, Supabase, OpenAI, Vercel, Inngest, Upstash Redis, Supabase Storage
- **.env.example**: Added Supabase, Inngest, Upstash provider-specific environment variables
- **TECHNOLOGY_DISCOVERY.md**: Marked completion checklist as fully complete
- **CLAUDE.md**: Added finalized tech stack to Project Overview
- **setup/docs**: Tailored all 14 governance documents from generic boilerplate to Ops Agenda-specific content (modules, PRD constraints, M365 integration, AI pipeline requirements, SOC 2 compliance)
- **README.md**: Replaced generic "AI Project Governance Starter" with Ops Agenda project README (mission, modules, tech stack, getting started)
- **TECHSTACK.md**: Replaced WordPress/Next.js CMS stack with Ops Agenda technology requirements (Next.js, M365 Graph API, PostgreSQL, AI/LLM)
- **.env.example**: Tailored for Ops Agenda (Microsoft Graph, AI/LLM provider, PostgreSQL, NextAuth, Stripe)
- **CODEX.md**: Updated paths, intake questions, and references for Ops Agenda
- **BLACKBOX.md**: Updated paths, intake questions, and references for Ops Agenda
- **AGENTS.md**: Replaced command reference with Ops Agenda agent role reference
- **.clinerules**: Updated intake questions and doc paths for Ops Agenda
- **.windsurfrules**: Updated intake questions and doc paths for Ops Agenda
- **.cursor/rules.md**: Updated intake questions, doc paths, and tech detection for Ops Agenda
- **.github/copilot-instructions.md**: Updated intake questions, doc paths, and removed irrelevant configs

### Removed
- **CLAUDE-cloudflare.md**, **CLAUDE-convex.md**, **CLAUDE-wordpress.md**, **CLAUDE-whm.md**, **CLAUDE-vercel.md**: Deleted irrelevant platform config templates
- **GEMINI.md**: Deleted (per CLAUDE.md: "Ignore GEMINI.md")
- **setup/examples**: Deleted Laravel, Django, Rails, Vue, and Python CLAUDE.md templates (irrelevant stacks)
- **setup/skills**: Deleted wordpress-best-practices, wordpress-penetration-testing, laravel-best-practices, php-best-practices, mariadb-best-practices directories (irrelevant stacks)

### Added
- Initial governance templates for AI-assisted projects (carried forward from previous version)
