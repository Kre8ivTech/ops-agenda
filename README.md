# Ops Agenda

> **Complete AI-Assisted Development Framework** - From conception to production with standardized workflows

This repository provides a **comprehensive framework** for AI-assisted ("vibe") development, covering the entire lifecycle from initial concept through project identity, brand discovery, technology selection, development, testing, security audits, and production deployment.

**Key Features:**
- 📋 Standardized agent behavior rules across all AI tools
- 🎨 Complete brand and design discovery workflow
- 🔧 Multi-platform support (Claude Code, Cursor, Copilot, Gemini, and more)
- 🤖 Pre-built agent personas and subagents
- 🔒 Security and quality guardrails
- 📚 Comprehensive documentation and templates
- 🚀 MCP server configurations for extended capabilities

---

## 📑 Table of Contents

1. [Quick Start](#-quick-start)
2. [Execution Guide: Conception to Production](#-execution-guide-conception-to-production)
   - [Phase -1: Project Identity](#phase--1-project-identity-always-first)
   - [Phase 0: Brand & Design Discovery](#phase-0-brand--design-discovery)
   - [Phase 0.5: Technology Discovery](#phase-05-technology-discovery)
   - [Phase 1-9: Development Lifecycle](#phase-1-project-conception)
3. [Project Structure](#-project-structure)
4. [Agent System](#-agent-system)
5. [MCP Server Configuration](#-mcp-server-configuration)
6. [Memory Bank System](#-memory-bank-system)
7. [Documentation Index](#-documentation-index)
8. [Skills & Commands](#️-skills--commands)
9. [Quick Commands](#-quick-commands)
10. [Phase Checklist](#-phase-checklist)
11. [AI Prompts Reference](#-ai-prompts-reference)
12. [Golden Rules](#-golden-rules)

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

**Complete Workflow Order:**

```
Project Identity (-1) → Brand Discovery (0) → Technology Discovery (0.5) →
Conception (1) → Requirements (2) → Architecture (3) → Planning (4) →
Development (5) → Testing (6) → Security (7) → Review (8) → 
Deployment (9) → Monitoring (10)
```

### Quality Gates

Each phase has mandatory gates that must pass before proceeding:

| Phase Transition | Gate Criteria |
|-----------------|---------------|
| **-1 → 0** | All 5 identity fields captured |
| **0 → 0.5** | Visual identity and tone established |
| **0.5 → 1** | Application type and stack confirmed |
| **1 → 2** | Project brief approved |
| **2 → 3** | All user stories defined |
| **3 → 4** | Technical design reviewed |
| **4 → 5** | Tasks estimated and prioritized |
| **5 → 6** | All features implemented, code follows standards |
| **6 → 7** | >80% test coverage, all tests green |
| **7 → 8** | No critical/high vulnerabilities |
| **8 → 9** | All feedback addressed |
| **9 → 10** | Staging verified, production live |

### Phase -1: Project Identity (ALWAYS FIRST)

**⚠️ CRITICAL: Complete this BEFORE any other discovery phase**

Project Identity establishes the essential metadata used throughout all documentation, code files, and legal notices. These 5 fields are **non-negotiable** and must be captured first.

#### Required Fields

| # | Field | Purpose | Examples |
|---|-------|---------|----------|
| 1 | **Application Name** | Official product name | "TaskMaster Pro", "Acme Dashboard" |
| 2 | **Company Name** | Legal entity/organization | "Acme Corporation", "John Doe Consulting" |
| 3 | **Author Name** | Primary creator/lead | "Jane Smith", "Development Team" |
| 4 | **License Type** | Legal usage terms | Proprietary (default), MIT, Apache 2.0 |
| 5 | **Contact Email** | Primary contact | "contact@company.com", "support@app.com" |

#### AI Prompt to Start

```
I'm starting a new project. Before we begin any discovery, 
I need to capture the project identity:

1. What is the application name?
2. What is the company/organization name?
3. Who is the author/creator?
4. What license type? (Proprietary is default for commercial projects)
5. What is the primary contact email?
```

#### Auto-Generated Artifacts

Once Project Identity is captured, automatically generate:

- ✅ **LICENSE file** (based on chosen license type)
- ✅ **README header** (with company/author information)
- ✅ **package.json/composer.json fields** (name, author, license)
- ✅ **File header templates** (copyright notices)
- ✅ **PROJECT_IDENTITY.json** (machine-readable identity)

**📖 Full Details:** See `setup/docs/PROJECT_IDENTITY.md` for complete templates and guidance.

---

### Phase 0: Brand & Design Discovery

**After Project Identity, complete brand discovery BEFORE development:**

Brand Discovery establishes your visual identity, design system, and brand voice. This phase ensures consistency across all user-facing elements.

#### Discovery Areas

```markdown
## Brand Discovery Checklist

### 1. Brand Identity (Questions 1-10)
- [ ] Brand essence and personality
- [ ] Target audience and demographics
- [ ] Key messages and values
- [ ] Competitive positioning
- [ ] Brand voice and tone

### 2. Visual Preferences (Questions 11-16)
- [ ] Color palette (primary, secondary, accent)
- [ ] Typography (headings, body, special use)
- [ ] Visual style (modern, classic, minimal, bold)
- [ ] Imagery style (photos, illustrations, icons)
- [ ] UI components preferences

### 3. Inspiration & References (Questions 17-22)
- [ ] Competitor analysis
- [ ] Inspirational examples
- [ ] Design patterns to follow/avoid
- [ ] Existing brand assets

### 4. Tone of Voice (Questions 23-27)
- [ ] Communication style
- [ ] Formality level
- [ ] Key messaging guidelines
```

#### Assets to Gather

```bash
assets/
├── logo/           # Logo files (SVG, PNG in multiple sizes)
├── media/          # Brand imagery, patterns, textures
└── brand/          # Brand guidelines, color swatches, fonts
```

#### Deliverables

Create these documents in `setup/docs/project/`:
- **BRAND_GUIDE.md** - Complete brand guidelines
- **DESIGN_SYSTEM.md** - UI components and patterns
- **BRAND_DISCOVERY_RESPONSES.md** - Intake answers

**📖 Full Questionnaire:** `setup/docs/BRAND_AND_DESIGN_DISCOVERY.md` (835 lines of detailed guidance)

**AI Prompt to Start:**
```
I'm starting a new project. Let's begin with brand discovery.
Please ask me the brand discovery intake questions from 
setup/docs/BRAND_AND_DESIGN_DISCOVERY.md one section at a time.
```

---

### Phase 0.5: Technology Discovery

**After Brand Discovery, select your technology stack:**

Technology Discovery helps you choose the right stack based on your application type, requirements, and deployment target.

#### Key Questions

```markdown
## Technology Discovery

1. **Application Type**
   - [ ] Web Application (SPA/MPA)
   - [ ] Mobile Application (iOS/Android/Cross-platform)
   - [ ] Desktop Application
   - [ ] API/Backend Service
   - [ ] WordPress Plugin/Theme
   - [ ] Browser Extension
   - [ ] CLI Tool

2. **Primary Capabilities** (Select all that apply)
   - [ ] User Authentication
   - [ ] Database Operations (CRUD)
   - [ ] Real-time Features
   - [ ] File Upload/Storage
   - [ ] Payment Processing
   - [ ] Email/Notifications
   - [ ] Search Functionality
   - [ ] Analytics/Reporting
   - [ ] API Integration
   - [ ] Admin Dashboard

3. **Deployment Target**
   - [ ] WHM/cPanel AWS LAMP Server
   - [ ] Vercel/Netlify
   - [ ] WordPress Hosting
   - [ ] Docker/Kubernetes
   - [ ] Cloudflare Workers/Pages
   - [ ] AWS/GCP/Azure
   - [ ] On-premise

4. **Tech Stack Selection**
   Based on answers above, recommended stacks:
   - **Laravel** → Full-stack PHP with Blade/Inertia
   - **Next.js** → React with server-side rendering
   - **WordPress** → Plugin/theme development
   - **Node.js + Express** → API-focused backend
```

#### Auto-Detection & Standards

The orchestration system automatically:
- Detects your tech stack from `TECHSTACK.md`
- Loads appropriate coding standards
- Configures linting and testing tools
- Sets up framework-specific patterns

**📖 Full Guide:** `setup/docs/TECHNOLOGY_DISCOVERY.md` (733 lines of stack guidance)

### Phase 1: Project Conception

**Create the project vision and scope:**

```markdown
## Create Project Brief

1. Open: setup/docs/DEVELOPMENT_ORCHESTRATION.md
2. Complete Phase 2 (Conception) questions:
   - What problem are we solving?
   - Who are the users?
   - What's the value proposition?
   - What are the success metrics?
   - What's the timeline?
3. Create: setup/docs/project/PROJECT_BRIEF.md
4. Get stakeholder approval before proceeding
```

**AI Prompt:**
```
Based on our brand discovery, let's create the project brief.
Ask me the conception intake questions and help me document
the project brief in setup/docs/project/PROJECT_BRIEF.md
```

### Phase 2: Requirements Gathering

**Define detailed requirements with acceptance criteria:**

```markdown
## Define Requirements

1. Create user stories with acceptance criteria
   - Use format: "As a [role], I want [feature], so that [benefit]"
   - Include acceptance criteria for each story
   - Prioritize using MoSCoW (Must/Should/Could/Won't)
2. Define functional requirements
   - Core features and capabilities
   - User workflows and interactions
   - Data requirements
3. Define non-functional requirements
   - Performance targets
   - Security requirements
   - Accessibility standards (WCAG 2.1 AA minimum)
   - Browser/device support
4. Create: setup/docs/project/USER_STORIES.md
5. Create: setup/docs/project/REQUIREMENTS.md
```

**AI Prompt:**
```
Let's define the requirements for this project.
Help me create user stories with acceptance criteria
following the template in setup/docs/DEVELOPMENT_ORCHESTRATION.md
```

### Phase 3: Architecture & Planning

**Design the technical architecture:**

```markdown
## Design Architecture

1. Create: setup/docs/project/ARCHITECTURE.md
   - System architecture diagram
   - Component breakdown
   - Data models and relationships
   - API design (if applicable)
   - Security architecture
   - Deployment architecture
2. Create ADRs in setup/docs/project/adr/
   - Document key technical decisions
   - Format: ADR-NNN-title.md
   - Include context, decision, and consequences
3. Create: setup/docs/project/SPRINT_PLAN.md
   - Break down into sprints/iterations
   - Estimate effort (story points or hours)
   - Identify dependencies
   - Define sprint goals
4. Set up project board (Linear/Jira/GitHub Projects)
   - Import user stories as issues
   - Set up workflow columns
   - Assign initial priorities
```

**AI Prompt:**
```
Let's design the architecture for this project.
Based on our requirements, recommend the tech stack
and create the architecture document with ADRs.
```

### Phase 4: Development

**Begin implementation following TDD and coding standards:**

```markdown
## Start Development

1. Create feature branch: git checkout -b feature/[story-id]-[description]
2. Update CLAUDE-activeContext.md with current task
   - Document goal, progress, blockers
   - Track decisions made
3. Follow TDD: Write tests first
   - Unit tests for business logic
   - Integration tests for APIs
   - E2E tests for critical paths
4. Implement feature following established patterns
   - Check CLAUDE-patterns.md for code conventions
   - Match existing code style
   - Use existing abstractions
   - Keep changes minimal and focused
5. Run linters and formatters
6. Create PR with checklist (see PR template)
```

#### Coding Standards Integration

The orchestration system automatically enforces coding standards based on detected technology:

| Technology | Standards Applied |
|-----------|------------------|
| WordPress | wordpress-best-practices, php-best-practices, mysql-best-practices |
| Laravel | laravel-best-practices, php-best-practices |
| Next.js | react-best-practices, nextjs-patterns, typescript-standards |
| Node.js | node-best-practices, javascript-standards |

Standards are loaded from `setup/skills/coding-standards/` and enforced at CRITICAL and HIGH levels.

**📖 See:** `setup/docs/PROGRESSIVE_GUARDRAILS.md` for the complete standards system

**AI Prompt:**
```
I'm starting development on [feature].
Let's follow TDD - help me write the tests first,
then implement the feature following our patterns.
```

### Phase 5: Testing

**Comprehensive testing at multiple levels:**

```markdown
## Run Test Suite

1. **Unit Tests** (80%+ coverage target)
   - Test business logic in isolation
   - Mock external dependencies
   - Fast execution (<100ms per test)
   
2. **Integration Tests**
   - Test API endpoints
   - Test database operations
   - Test external service integrations
   
3. **E2E Tests** with Playwright
   - Test critical user journeys
   - Test cross-browser compatibility
   - Test responsive layouts
   
4. **Accessibility Audit**
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader compatibility
   - Color contrast ratios
   
5. **Performance Testing**
   - Lighthouse scores (>90 targets)
   - Load testing for APIs
   - Database query optimization
   - Bundle size analysis
```

**Test Commands:**
```bash
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:e2e          # E2E with Playwright
npm run test:coverage     # Coverage report
npm run test:a11y         # Accessibility checks
```

**AI Prompt:**
```
Let's run our test suite and ensure quality.
Check test coverage and help me add any missing tests.
Run the Playwright MCP for E2E testing.
```

### Phase 6: Security Audit

**Comprehensive security review:**

```markdown
## Security Review

1. **SAST Scan** (Static Application Security Testing)
   - Run SonarQube for code quality and vulnerabilities
   - Run Semgrep for security patterns
   - Check for hardcoded secrets
   
2. **Dependency Scan**
   - Run Snyk for vulnerable dependencies
   - Check for outdated packages
   - Review license compatibility
   
3. **OWASP Top 10 Review**
   - [ ] Injection (SQL, XSS, Command)
   - [ ] Broken Authentication
   - [ ] Sensitive Data Exposure
   - [ ] XML External Entities (XXE)
   - [ ] Broken Access Control
   - [ ] Security Misconfiguration
   - [ ] Cross-Site Scripting (XSS)
   - [ ] Insecure Deserialization
   - [ ] Components with Known Vulnerabilities
   - [ ] Insufficient Logging & Monitoring
   
4. **Security Checklist**
   - [ ] Environment variables properly secured
   - [ ] API authentication implemented
   - [ ] Rate limiting configured
   - [ ] CORS properly configured
   - [ ] CSP headers set
   - [ ] HTTPS enforced
   - [ ] Input validation on all endpoints
   - [ ] Output encoding implemented
   
5. Create: setup/docs/project/SECURITY_AUDIT.md
   - Document findings
   - Prioritize by severity
   - Track remediation
```

**📖 Security Skills:** Available in `setup/skills/security/` and `setup/skills/pentest/`

**AI Prompt:**
```
Let's perform a security audit on this codebase.
Check for vulnerabilities using the security scanning
tools and create a security audit report.
```

### Phase 7: Code Review & Merge

**Final quality check before merging:**

```markdown
## Final Review

1. **Self-Review Checklist**
   - [ ] Code follows established patterns
   - [ ] All tests passing
   - [ ] No console.log or debugging code
   - [ ] Comments explain "why", not "what"
   - [ ] No TODO comments left
   - [ ] Documentation updated
   - [ ] CHANGELOG.md updated (if significant)
   
2. **Request Peer Review**
   - Assign reviewers in PR
   - Provide context and testing instructions
   - Link to related issues/stories
   
3. **Address Feedback**
   - Respond to all comments
   - Make requested changes
   - Re-request review after updates
   
4. **Merge to Main**
   - Squash commits if needed
   - Use conventional commit message
   - Delete feature branch after merge
```

**PR Template:** Use `.github/pull_request_template.md` for consistent PRs

### Phase 8: Deployment

**Deploy through staging to production:**

```markdown
## Deploy to Production

1. **Deploy to Staging**
   ```bash
   # Deployment varies by platform
   npm run deploy:staging        # Vercel/Netlify
   ./scripts/deploy-staging.sh   # Custom deployment
   git push staging main          # Platform-specific
   ```
   
2. **Run Smoke Tests**
   - [ ] Application loads successfully
   - [ ] Authentication works
   - [ ] Critical user paths functional
   - [ ] Database migrations applied
   - [ ] Environment variables set correctly
   - [ ] External integrations working
   
3. **Get Stakeholder Approval**
   - Share staging URL
   - Walk through new features
   - Verify acceptance criteria met
   - Get sign-off to proceed
   
4. **Deploy to Production**
   ```bash
   npm run deploy:production
   # or use platform-specific deployment
   ```
   
5. **Verify Deployment**
   - [ ] Health checks passing
   - [ ] Monitoring active
   - [ ] Error tracking configured
   - [ ] Analytics tracking
   - [ ] Backup systems operational
   - [ ] Rollback plan ready
```

**Platform Guides:**
- Vercel: `CLAUDE-vercel.md`
- Cloudflare: `CLAUDE-cloudflare.md`
- WHM/cPanel: `CLAUDE-whm.md`
- WordPress: `CLAUDE-wordpress.md`

**AI Prompt:**
```
Let's deploy this release. First to staging for verification,
then to production. Help me run through the deployment checklist.
```

## Tech Stack

**Set up production monitoring and alerting:**

```markdown
## Monitor Production

1. **Set up Sentry Alerts**
   - Error tracking configured
   - Alert thresholds set
   - Team notifications configured
   - Issue assignment rules
   
2. **Configure Dashboards**
   - Application performance metrics
   - User analytics
   - Error rates and trends
   - System health indicators
   
3. **Monitor Error Rates**
   - Set up automated alerts for spikes
   - Review errors daily
   - Triage and prioritize fixes
   - Track resolution time
   
4. **Track Performance Metrics**
   - Response times (p50, p95, p99)
   - Throughput (requests per second)
   - Resource utilization (CPU, memory, disk)
   - Database query performance
   - Cache hit rates
   
5. **Incident Response Plan**
   - Define severity levels
   - Set up on-call rotation
   - Document runbooks
   - Test rollback procedures
```

**Monitoring Tools:**
- Sentry for error tracking
- Application-specific monitoring (New Relic, DataDog, etc.)
- Uptime monitoring (UptimeRobot, Pingdom)
- Log aggregation (CloudWatch, Papertrail)

---

## Project Structure

```
your-project/
├── setup/                          # SETUP & GOVERNANCE FILES
│   ├── docs/                       # Comprehensive Documentation
│   │   ├── project/                # YOUR PROJECT DOCS (generated)
│   │   │   ├── BRAND_GUIDE.md      # Brand guidelines
│   │   │   ├── PROJECT_BRIEF.md    # Project overview
│   │   │   ├── USER_STORIES.md     # User stories & acceptance criteria
│   │   │   ├── REQUIREMENTS.md     # Functional & non-functional requirements
│   │   │   ├── ARCHITECTURE.md     # System architecture
│   │   │   ├── SPRINT_PLAN.md      # Sprint planning
│   │   │   ├── SECURITY_AUDIT.md   # Security audit results
│   │   │   └── adr/                # Architecture Decision Records
│   │   ├── AGENT_HANDBOOK.md       # AI behavior source of truth
│   │   ├── WORKFLOW.md             # Phased workflow overview
│   │   ├── DEVELOPMENT_ORCHESTRATION.md # Complete lifecycle (1064 lines)
│   │   ├── PROJECT_IDENTITY.md     # Project identity intake (375 lines)
│   │   ├── BRAND_AND_DESIGN_DISCOVERY.md # Brand intake (835 lines)
│   │   ├── TECHNOLOGY_DISCOVERY.md # Tech stack selection (733 lines)
│   │   ├── VIBE_CODING_WORKFLOW.md # Master reference guide (755 lines)
│   │   ├── QUICK_START.md          # 5-minute getting started (149 lines)
│   │   ├── PLATFORM_SETUP.md       # IDE-specific setup (683 lines)
│   │   ├── SUBAGENTS_AND_MCP_SERVERS.md # Tools & integrations (573 lines)
│   │   ├── PROGRESSIVE_GUARDRAILS.md # Coding standards system (668 lines)
│   │   ├── BUILD-WITH-QUALITY-PROMPT.md # Quality prompts (669 lines)
│   │   ├── USAGE-EXAMPLES.md       # Common usage patterns (463 lines)
│   │   ├── AGENT_ROLES.md          # Agent role definitions (13 lines)
│   │   ├── VERSIONING.md           # SemVer policy (12 lines)
│   │   └── RELEASE_PROCESS.md      # Release steps (7 lines)
│   ├── examples/                   # CLAUDE.md templates & examples
│   │   ├── orchestrators/          # Orchestrator agents
│   │   ├── specialists/            # Framework specialists
│   │   └── templates/              # Configuration templates
│   ├── agents/                     # Agent persona definitions
│   │   └── critical/               # Core agents (PM, Dev, QA, Reviewer)
│   ├── skills/                     # AI Skills & coding standards
│   │   ├── coding-standards/       # Framework-specific standards
│   │   ├── security/               # Security audit skills
│   │   └── pentest/                # Penetration testing skills
│   ├── tools/                      # Helper tools & utilities
│   └── scripts/                    # Automation scripts
├── assets/
│   ├── logo/                       # Logo files (SVG, PNG, ICO)
│   ├── media/                      # Brand imagery, screenshots
│   └── brand/                      # Brand assets (colors, fonts)
├── .claude/
│   ├── agents/                     # Claude Code subagents
│   │   ├── code-searcher.md        # Codebase analysis
│   │   ├── memory-bank-synchronizer.md # Context sync
│   │   └── ux-design-expert.md     # UX guidance
│   ├── commands/                   # Slash commands
│   │   ├── anthropic/              # Core Claude commands
│   │   ├── architecture/           # Architecture commands
│   │   ├── security/               # Security commands
│   │   └── refactor/               # Refactoring commands
│   ├── skills/                     # Claude Code skills
│   │   └── claude-docs-consultant/ # Fetch official docs
│   ├── mcp/                        # MCP server configs
│   │   ├── web-dev-stack.json      # Web development tools
│   │   ├── security-stack.json     # Security tools
│   │   ├── project-management.json # Project management
│   │   └── devops-stack.json       # DevOps tools
│   └── settings.json               # Claude settings
├── .cursor/
│   ├── rules.md                    # Cursor-specific rules
│   └── mcp.json                    # Cursor MCP config
├── .cline/
│   └── mcp_settings.json           # Cline MCP config
├── .github/
│   ├── copilot-instructions.md     # GitHub Copilot config
│   └── pull_request_template.md    # PR template
├── CLAUDE.md                       # Primary AI instructions (stays at root)
├── CLAUDE-*.md                     # Domain-specific configs (cloudflare, vercel, etc.)
├── CLAUDE-activeContext.md         # Current session state (memory bank)
├── CLAUDE-patterns.md              # Code patterns (memory bank)
├── CLAUDE-decisions.md             # Architecture decisions (memory bank)
├── CLAUDE-troubleshooting.md       # Known issues & solutions (memory bank)
├── GEMINI.md                       # Gemini CLI configuration
├── .windsurfrules                  # Windsurf configuration
├── .clinerules                     # Cline configuration
├── TECHSTACK.md                    # Technology stack documentation
├── CHANGELOG.md                    # Version history
└── .env.example                    # Environment variables template
```

---

## 🤖 Agent System

### Critical Agents (Always Available)

Located in `setup/agents/critical/`:

| Agent | Role | When to Use | Capabilities |
|-------|------|-------------|--------------|
| **product-manager.md** | Requirements & scope | Starting new features | Defines requirements, acceptance criteria, priorities |
| **software-engineer.md** | Implementation | Writing code | Implements features following patterns and standards |
| **code-reviewer.md** | Quality assurance | Before merging | Reviews code for quality, security, patterns |
| **qa-engineer.md** | Testing | Verification phase | Creates test plans, writes tests, validates quality |

### Orchestrator Agents

Located in `setup/examples/CLAUDE.md Collection/orchestrators/`:

| Agent | Role | Capabilities |
|-------|------|--------------|
| **tech-lead-orchestrator.md** | Coordinates multi-step tasks | Plans work, delegates to specialists, never writes code directly |
| **project-analyst.md** | Codebase analysis | Detects tech stack, analyzes unfamiliar codebases, generates reports |
| **team-configurator.md** | Agent team setup | Configures specialized agent teams for specific workflows |

### Framework Specialists

Pre-configured experts for popular frameworks:

**Backend Frameworks:**
- Django: `django-backend-expert.md`, `django-api-developer.md`, `django-orm-expert.md`
- Rails: `rails-backend-expert.md`, `rails-api-developer.md`, `rails-activerecord-expert.md`
- Laravel: `laravel-backend-expert.md`, `laravel-eloquent-expert.md`

**Frontend Frameworks:**
- React: `react-component-architect.md`, `react-nextjs-expert.md`
- Vue: `vue-component-architect.md`, `vue-nuxt-expert.md`, `vue-state-manager.md`

**Universal:**
- `backend-developer.md` - General backend development
- `frontend-developer.md` - General frontend development
- `api-architect.md` - API design and implementation

### Claude Code Subagents

Located in `.claude/agents/`:

| Subagent | Purpose | How to Use |
|----------|---------|------------|
| **code-searcher.md** | Codebase analysis | Use CoD (Chain of Density) methodology for deep analysis |
| **memory-bank-synchronizer.md** | Context synchronization | Sync memory bank files with actual code state |
| **ux-design-expert.md** | UX guidance | Get UX/UI design recommendations and patterns |

### Using Agents

**Claude Code:**
```
@code-searcher Find all authentication logic in the codebase
@memory-bank-synchronizer Sync all memory bank files with current code
@ux-design-expert Review the user registration flow for UX issues
```

**Other Platforms:**
Reference agent markdown files directly or use the orchestrate skill for delegation.

---

## Getting Started

### 1. Clone the Repository

MCP (Model Context Protocol) servers extend AI capabilities with external tools and integrations:

**Installation:**

```bash
# Install core MCP servers
npm install -g @anthropic/github-mcp-server      # GitHub integration
npm install -g @anthropic/playwright-mcp-server  # Browser automation
npm install -g supabase-mcp                      # Database operations
npm install -g figma-context-mcp                 # Design integration
npm install -g sonarqube-mcp-server             # Code quality
```

### Pre-configured MCP Stacks

Located in `.claude/mcp/`, pre-configured for common workflows:

| Stack | File | Includes | Use Case |
|-------|------|----------|----------|
| **Web Development** | `web-dev-stack.json` | GitHub, Playwright, Supabase, Figma, Context7 | Full-stack web development |
| **Security** | `security-stack.json` | SonarQube, Sentry, Snyk | Security audits and monitoring |
| **Project Management** | `project-management.json` | Linear, Jira, Notion, GitHub | Issue tracking and planning |
| **DevOps** | `devops-stack.json` | Docker, AWS, Cloudflare, Vercel | Deployment and infrastructure |
| **Design** | `design-stack.json` | Figma, Magic, Browser | Design handoff and prototyping |

### Platform-Specific MCP Support

| Platform | Config File | Support Level |
|----------|-------------|---------------|
| Claude Code | `.claude/mcp/*.json` | ✅ Full support |
| Cursor | `.cursor/mcp.json` | ⚠️ Partial support |
| Cline | `.cline/mcp_settings.json` | ⚠️ Partial support |
| Windsurf | Manual config in settings | ⚠️ Partial support |
| Copilot | N/A | ❌ Not supported |
| Gemini CLI | N/A | ❌ Not supported |

**📖 Full MCP Guide:** `setup/docs/SUBAGENTS_AND_MCP_SERVERS.md` (573 lines)

---

## 💾 Memory Bank System

The memory bank system maintains context and continuity across AI sessions using specialized markdown files.

### Core Memory Bank Files

| File | Purpose | Update Frequency |
|------|---------|------------------|
| **CLAUDE-activeContext.md** | Current session state, goals, progress, blockers | Every session |
| **CLAUDE-patterns.md** | Established code patterns and conventions | When patterns evolve |
| **CLAUDE-decisions.md** | Architecture decisions and rationale | When decisions made |
| **CLAUDE-troubleshooting.md** | Known issues, root causes, and solutions | When bugs fixed |
| **CLAUDE-config-variables.md** | Configuration reference and documentation | When config changes |
| **CLAUDE-temp.md** | Temporary scratch pad for working notes | Only when referenced |

### Memory Bank Rules

✅ **DO:**
- Check memory bank files at the start of every session
- Update actively as work progresses
- Preserve history and lessons learned
- Use the `memory-bank-synchronizer` agent periodically

❌ **DON'T:**
- Commit memory bank files to version control (unless explicitly asked)
- Delete achievements or historical context
- Let memory bank get out of sync with actual code

### Creating Memory Bank Files

**Active Context Template:**
```markdown
# Active Context

## Current Session
- **Date**: 2025-01-15
- **Goal**: Implement user authentication
- **Branch**: feature/auth-system

## Progress
- [x] Set up database schema
- [x] Create user model
- [ ] Implement login endpoint
- [ ] Add JWT token generation

## Blockers
- Need confirmation on password hashing algorithm

## Decisions Made
- Using bcrypt for password hashing (ADR-003)
- JWT tokens expire after 24 hours

## Next Steps
1. Complete login endpoint implementation
2. Write integration tests
3. Update API documentation
```

### Platform Support

| Platform | Memory Bank Prefix | Auto-Sync Support |
|----------|-------------------|-------------------|
| Claude Code | `CLAUDE-` | ✅ Yes (via subagent) |
| Cursor | `CLAUDE-` | ⚠️ Manual |
| Gemini CLI | `GEMINI-` | ⚠️ Manual |
| Others | `CLAUDE-` | ⚠️ Manual |

**📖 See:** Memory Bank section in `setup/docs/VIBE_CODING_WORKFLOW.md` for complete guidance

---

## Documentation Index

### Core Workflow Documentation

| Document | Lines | Purpose |
|----------|-------|---------|
| [Agent Handbook](setup/docs/AGENT_HANDBOOK.md) | 69 | **Source of truth** for AI behavior, rules, and principles |
| [Workflow](setup/docs/WORKFLOW.md) | 23 | Quick overview of phased build process |
| [Development Orchestration](setup/docs/DEVELOPMENT_ORCHESTRATION.md) | 1064 | **Complete lifecycle** from conception to monitoring |
| [Vibe Coding Workflow](setup/docs/VIBE_CODING_WORKFLOW.md) | 755 | **Master reference** guide for all platforms |
| [Quick Start](setup/docs/QUICK_START.md) | 149 | 5-minute getting started guide |

### Discovery & Planning

| Document | Lines | Purpose |
|----------|-------|---------|
| [Project Identity](setup/docs/PROJECT_IDENTITY.md) | 375 | **Phase -1:** Essential project metadata intake |
| [Brand & Design Discovery](setup/docs/BRAND_AND_DESIGN_DISCOVERY.md) | 835 | **Phase 0:** Complete brand intake questionnaire |
| [Technology Discovery](setup/docs/TECHNOLOGY_DISCOVERY.md) | 733 | **Phase 0.5:** Tech stack selection and configuration |

### Platform & Tools

| Document | Lines | Purpose |
|----------|-------|---------|
| [Platform Setup](setup/docs/PLATFORM_SETUP.md) | 683 | IDE-specific setup (Claude, Cursor, Copilot, etc.) |
| [Subagents & MCP Servers](setup/docs/SUBAGENTS_AND_MCP_SERVERS.md) | 573 | MCP server configuration and agent system |
| [Progressive Guardrails](setup/docs/PROGRESSIVE_GUARDRAILS.md) | 668 | Coding standards and enforcement system |

### Quality & Best Practices

| Document | Lines | Purpose |
|----------|-------|---------|
| [Build with Quality](setup/docs/BUILD-WITH-QUALITY-PROMPT.md) | 669 | Quality-focused development prompts |
| [Usage Examples](setup/docs/USAGE-EXAMPLES.md) | 463 | Common usage patterns and examples |
| [Agent Roles](setup/docs/AGENT_ROLES.md) | 13 | Agent role definitions and responsibilities |

### Release Management

| Document | Lines | Purpose |
|----------|-------|---------|
| [Versioning](setup/docs/VERSIONING.md) | 12 | Semantic versioning policy |
| [Release Process](setup/docs/RELEASE_PROCESS.md) | 7 | Release workflow steps |

### Platform-Specific Configs

| Document | Purpose |
|----------|---------|
| CLAUDE-cloudflare.md | Cloudflare Workers/Pages development |
| CLAUDE-convex.md | Convex backend integration |
| CLAUDE-vercel.md | Vercel deployment configuration |
| CLAUDE-whm.md | WHM/cPanel server management |
| CLAUDE-wordpress.md | WordPress plugin/theme development |

---

## ⚡ Quick Commands

### Starting a New Project

```bash
# 1. Initialize project structure
mkdir -p docs/project assets/logo assets/media

# 2. Create brand guide from template
cp setup/docs/BRAND_AND_DESIGN_DISCOVERY.md setup/docs/project/BRAND_DISCOVERY_RESPONSES.md

# 3. Start memory bank
echo "# Active Context\n\n## Current Session\n- Date: $(date +%Y-%m-%d)\n- Goal: Project Setup" > CLAUDE-activeContext.md
```

### Daily Development

```bash
# Check current context
cat CLAUDE-activeContext.md

# Create feature branch
git checkout -b feature/US-001-feature-name

# After development
git add . && git commit -m "feat: description"
```

### Quality Checks

```bash
# Run tests
npm test

# Run linting
npm run lint

# Check coverage
npm run test:coverage
```

---

## 🛠️ Skills & Commands

### Claude Code Skills

Located in `.claude/skills/`:

| Skill | Purpose | How to Use |
|-------|---------|------------|
| **claude-docs-consultant** | Fetch official Claude Code documentation | Automatically fetches relevant docs when working with Claude features |

**Usage:**
```
I need to implement a custom skill for [purpose].
Can you consult the official documentation?
```

### Slash Commands

Located in `.claude/commands/`:

#### Core Commands

| Command | Purpose |
|---------|---------|
| `/anthropic/apply-thinking-to` | Apply extended thinking to a problem |
| `/anthropic/convert-to-todowrite-tasklist-prompt` | Convert requirements to task list |
| `/anthropic/update-memory-bank` | Update memory bank files |

#### Architecture Commands

| Command | Purpose |
|---------|---------|
| `/architecture/explain-architecture-pattern` | Explain architecture patterns in codebase |

#### Security Commands

| Command | Purpose |
|---------|---------|
| `/security/check-best-practices` | Check for security best practices |
| `/security/secure-prompts` | Design secure prompts |
| `/security/security-audit` | Perform comprehensive security audit |

#### Refactoring Commands

| Command | Purpose |
|---------|---------|
| `/refactor/refactor-code` | Analyze and refactor code |

#### Prompt Engineering Commands

| Command | Purpose |
|---------|---------|
| `/promptengineering/batch-operations-prompt` | Generate batch operation prompts |
| `/promptengineering/convert-to-test-driven-prompt` | Convert to TDD-focused prompts |

### Quick Shortcuts (Sabrina's Guide)

Keyboard shortcuts for rapid development:

| Shortcut | Action | Use When |
|----------|--------|----------|
| `QNEW` | Understand best practices | Starting new feature |
| `QPLAN` | Analyze plan consistency | Before implementation |
| `QCODE` | Implement and verify | During development |
| `QCHECK` | Full code review checklist | Before committing |
| `QCHECKF` | Function checklist only | Reviewing specific functions |
| `QCHECKT` | Test checklist only | Reviewing tests |
| `QUX` | UX testing scenarios | User experience validation |
| `QGIT` | Commit with conventional format | Ready to commit |

**📖 See:** `setup/docs/VIBE_CODING_WORKFLOW.md` for complete commands reference

---

## 🎯 Phase Checklist

### Before Development Starts
- [ ] Brand discovery completed
- [ ] Brand guide created
- [ ] Logo and assets collected
- [ ] Project brief approved
- [ ] Requirements documented
- [ ] Architecture designed
- [ ] Sprint planned
- [ ] MCP servers configured
- [ ] Environment variables set

### During Development
- [ ] Feature branch created
- [ ] Tests written first (TDD)
- [ ] Code follows patterns
- [ ] PR checklist completed
- [ ] Code review passed

### Before Deployment
- [ ] All tests passing (80%+ coverage)
- [ ] Security audit complete
- [ ] No critical vulnerabilities
- [ ] Documentation updated
- [ ] Staging verified
- [ ] Stakeholder approval

---

## 🤖 AI Prompts Reference

### Start New Project
```
I want to start a new [web/mobile] project for [description].
Let's go through the full orchestration workflow starting with
brand discovery. Guide me through each phase.
```

### Resume Session
```
Let's continue where we left off. Check CLAUDE-activeContext.md
for the current state and help me with the next steps.
```

### Code Review
```
Please review this code against our quality checklist in
setup/docs/AGENT_HANDBOOK.md and the patterns in CLAUDE-patterns.md.
```

### Security Audit
```
Run a security audit on this codebase following the checklist
in setup/docs/DEVELOPMENT_ORCHESTRATION.md Phase 6.
```

### Deployment
```
Let's deploy this release. Walk me through the deployment
checklist and help verify each step.
```

---

## 📖 Additional Resources

- **Agent Library**: `setup/agents/` - Pre-built agent personas
- **Skills**: `setup/skills/` - Security and pentest skills
- **CLAUDE.md Examples**: `setup/examples/` - Templates and examples
- **Changelog**: `CHANGELOG.md` - Version history

---

## ✅ Golden Rules

### The 7 Core Principles

1. **Identity First** - Capture project identity (5 fields) before ANY other questions
2. **Brand Before Code** - Complete brand discovery before writing any code
3. **Plan Mode Always** - Ask intake questions and wait for answers before implementing
4. **Small Changes** - Keep commits minimal, focused, and reviewable
5. **Test First** - Write tests before implementation (TDD approach)
6. **Document Changes** - Update docs whenever user-facing behavior changes
7. **Security Check** - Run security audit before every release
8. **Never Commit Secrets** - Always use environment variables, never hardcode

### Quality Checklist

Before every commit:
- [ ] Code follows established patterns (check `CLAUDE-patterns.md`)
- [ ] Tests written and passing (unit, integration, E2E as needed)
- [ ] No console.log or debugging code left in
- [ ] Documentation updated if behavior changed
- [ ] CHANGELOG.md updated if significant change
- [ ] No secrets or credentials committed
- [ ] Memory bank files excluded from commit

### Progressive Guardrails

The framework enforces coding standards at three levels:

| Level | Severity | Enforcement | Action |
|-------|----------|-------------|--------|
| **CRITICAL** | Must fix | Blocking | Blocks code completion until fixed |
| **HIGH** | Should fix | Warning | Warns but allows completion |
| **MEDIUM** | Consider | Advisory | Suggests improvements |

Standards are automatically loaded based on detected technology stack.

**📖 See:** `setup/docs/PROGRESSIVE_GUARDRAILS.md` for the complete system

---

> **Ready to start?** See [setup/docs/QUICK_START.md](setup/docs/QUICK_START.md) for the 5-minute onboarding guide.
