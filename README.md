# AI Project Governance Starter

> **Vibe Coding Boilerplate** - Complete AI-assisted development from conception to production

This repository provides a **comprehensive framework** for AI-assisted ("vibe") development, covering the entire lifecycle from initial concept through brand discovery, development, testing, security audits, and production deployment.

---

## 🚀 Quick Start

### Step 1: Copy to Your Project

```bash
# Clone or copy this boilerplate to your project root
git clone https://github.com/your-org/vibe-skeleton-app.git my-project
cd my-project
```

### Step 2: Configure Your AI Tool

| Your Tool | Configuration File | Setup |
|-----------|-------------------|-------|
| Claude Code | `CLAUDE.md` | Ready to use |
| Cursor | `.cursor/rules.md` + `.cursor/mcp.json` | Import MCP servers in settings |
| Cline | `.clinerules` + `.cline/mcp_settings.json` | Ready to use |
| Windsurf | `.windsurfrules` | Configure MCP in settings |
| Copilot | `.github/copilot-instructions.md` | Ready to use |

### Step 3: Set Environment Variables

```bash
# Copy and fill in your API keys
cp .env.example .env

# Required keys for full functionality:
# - GITHUB_TOKEN (GitHub MCP)
# - FIGMA_ACCESS_TOKEN (Design integration)
# - SUPABASE_URL + SUPABASE_ANON_KEY (Database)
# - SONAR_TOKEN (Code quality)
# - SENTRY_AUTH_TOKEN (Error monitoring)
```

### Step 4: Start Your First Project

```bash
# Create initial planning documents
mkdir -p docs/project assets/logo assets/media

# Start with Project Identity (see execution guide below)
```

---

## 📋 Execution Guide: Conception to Production

### Phase -1: Project Identity (ALWAYS FIRST)

**Before ANY discovery, capture these 5 required items:**

```markdown
## Project Identity (Required)

| Field | Value |
|-------|-------|
| **Application Name** | [Name of the app/product] |
| **Company Name** | [Company or organization] |
| **Author Name** | [Primary author/creator] |
| **License Type** | Proprietary (default) / MIT / Apache 2.0 |
| **Contact Email** | [Primary contact email] |
```

**AI Prompt to Start:**
```
I'm starting a new project. Before we begin any discovery, 
I need to capture the project identity:

1. What is the application name?
2. What is the company/organization name?
3. Who is the author/creator?
4. What license type? (Proprietary is default for commercial projects)
5. What is the primary contact email?
```

**After capturing identity, automatically generate:**
- LICENSE file
- README header
- package.json/composer.json fields
- File header templates

---

### Phase 0: Brand & Design Discovery

**Before ANY development, complete brand discovery:**

```markdown
## Start Brand Discovery

1. Open: setup/docs/BRAND_AND_DESIGN_DISCOVERY.md
2. Complete ALL intake questions:
   - Brand Identity (Questions 1-10)
   - Visual Preferences (Questions 11-16)
   - Inspiration & References (Questions 17-22)
   - Tone of Voice (Questions 23-27)
3. Gather assets:
   - [ ] Logo files (SVG, PNG)
   - [ ] Brand colors (hex codes)
   - [ ] Typography choices
   - [ ] Inspiration images
   - [ ] Existing brand guide (if any)
4. Create: setup/docs/project/BRAND_GUIDE.md
5. Create: assets/logo/ and assets/media/
```

**AI Prompt to Start:**
```
I'm starting a new project. Let's begin with brand discovery.
Please ask me the brand discovery intake questions from 
setup/docs/BRAND_AND_DESIGN_DISCOVERY.md one section at a time.
```

### Phase 1: Project Conception

```markdown
## Create Project Brief

1. Open: setup/docs/DEVELOPMENT_ORCHESTRATION.md
2. Complete Phase 0: Conception questions
3. Create: setup/docs/project/PROJECT_BRIEF.md
4. Get stakeholder approval
```

**AI Prompt:**
```
Based on our brand discovery, let's create the project brief.
Ask me the conception intake questions and help me document
the project brief in setup/docs/project/PROJECT_BRIEF.md
```

### Phase 2: Requirements Gathering

```markdown
## Define Requirements

1. Create user stories with acceptance criteria
2. Define functional requirements
3. Define non-functional requirements
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

```markdown
## Design Architecture

1. Create: setup/docs/project/ARCHITECTURE.md
2. Create ADRs in setup/docs/project/adr/
3. Create: setup/docs/project/SPRINT_PLAN.md
4. Set up project board (Linear/Jira/GitHub)
```

**AI Prompt:**
```
Let's design the architecture for this project.
Based on our requirements, recommend the tech stack
and create the architecture document with ADRs.
```

### Phase 4: Development

```markdown
## Start Development

1. Create feature branch: git checkout -b feature/[story-id]-[description]
2. Update CLAUDE-activeContext.md with current task
3. Follow TDD: Write tests first
4. Implement feature
5. Create PR with checklist
```

**AI Prompt:**
```
I'm starting development on [feature].
Let's follow TDD - help me write the tests first,
then implement the feature following our patterns.
```

### Phase 5: Testing

```markdown
## Run Test Suite

1. Unit tests (80%+ coverage)
2. Integration tests
3. E2E tests with Playwright
4. Accessibility audit
5. Performance testing
```

**AI Prompt:**
```
Let's run our test suite and ensure quality.
Check test coverage and help me add any missing tests.
Run the Playwright MCP for E2E testing.
```

### Phase 6: Security Audit

```markdown
## Security Review

1. Run SAST scan (SonarQube/Semgrep)
2. Run dependency scan (Snyk)
3. Review OWASP Top 10
4. Create: setup/docs/project/SECURITY_AUDIT.md
```

**AI Prompt:**
```
Let's perform a security audit on this codebase.
Check for vulnerabilities using the security scanning
tools and create a security audit report.
```

### Phase 7: Code Review & Merge

```markdown
## Final Review

1. Self-review against checklist
2. Request peer review
3. Address feedback
4. Merge to main
```

### Phase 8: Deployment

```markdown
## Deploy to Production

1. Deploy to staging
2. Run smoke tests
3. Get stakeholder approval
4. Deploy to production
5. Verify deployment
```

**AI Prompt:**
```
Let's deploy this release. First to staging for verification,
then to production. Help me run through the deployment checklist.
```

### Phase 9: Monitoring

```markdown
## Monitor Production

1. Set up Sentry alerts
2. Configure dashboards
3. Monitor error rates
4. Track performance metrics
```

---

## 📁 Project Structure

```
your-project/
├── setup/                          # SETUP & TEMPLATE FILES
│   ├── docs/                       # Documentation
│   │   ├── project/                # YOUR PROJECT DOCS
│   │   │   ├── BRAND_GUIDE.md      # Brand guidelines
│   │   │   ├── PROJECT_BRIEF.md    # Project overview
│   │   │   └── adr/                # Architecture decisions
│   │   ├── AGENT_HANDBOOK.md       # AI behavior rules
│   │   ├── DEVELOPMENT_ORCHESTRATION.md # Full workflow
│   │   ├── BRAND_AND_DESIGN_DISCOVERY.md # Brand intake
│   │   └── VIBE_CODING_WORKFLOW.md # Master guide
│   ├── examples/                   # CLAUDE.md templates
│   ├── agents/                     # Agent personas
│   ├── skills/                     # Coding standards & skills
│   ├── tools/                      # Helper tools
│   └── scripts/                    # Utility scripts
├── assets/
│   ├── logo/                       # Logo files
│   └── media/                      # Brand imagery
├── .claude/
│   ├── mcp/                        # MCP server configs
│   ├── skills/                     # Claude skills
│   └── agents/                     # Subagent definitions
├── CLAUDE.md                       # AI instructions (stays at root)
├── CLAUDE-activeContext.md         # Current session state
├── CLAUDE-patterns.md              # Code patterns
├── CLAUDE-decisions.md             # Decisions log
└── .env                            # Environment variables
```

---

## 🔧 MCP Server Configuration

### Enable MCP Servers

MCP servers extend AI capabilities with external tools:

```bash
# Install required servers
npm install -g @anthropic/github-mcp-server
npm install -g @anthropic/playwright-mcp-server
npm install -g supabase-mcp
npm install -g figma-context-mcp
npm install -g sonarqube-mcp-server
```

### Pre-configured Stacks

| Stack | File | Includes |
|-------|------|----------|
| Web Development | `.claude/mcp/web-dev-stack.json` | GitHub, Playwright, Supabase, Figma |
| Security | `.claude/mcp/security-stack.json` | SonarQube, Sentry, Snyk |
| Project Management | `.claude/mcp/project-management.json` | Linear, Jira, Notion |
| DevOps | `.claude/mcp/devops-stack.json` | Docker, AWS, Cloudflare |
| Design | `.claude/mcp/design-stack.json` | Figma, Magic, Browser |

---

## 📚 Documentation Index

### Core Workflow
| Document | Purpose |
|----------|---------|
| [Development Orchestration](setup/docs/DEVELOPMENT_ORCHESTRATION.md) | Full lifecycle phases |
| [Brand Discovery](setup/docs/BRAND_AND_DESIGN_DISCOVERY.md) | Brand intake & design system |
| [Vibe Coding Workflow](setup/docs/VIBE_CODING_WORKFLOW.md) | Master reference guide |
| [Quick Start](setup/docs/QUICK_START.md) | 5-minute getting started |

### Platform Setup
| Document | Purpose |
|----------|---------|
| [Platform Setup](setup/docs/PLATFORM_SETUP.md) | IDE-specific configuration |
| [MCP Servers Guide](setup/docs/SUBAGENTS_AND_MCP_SERVERS.md) | Tools & integrations |

### Policies
| Document | Purpose |
|----------|---------|
| [Agent Handbook](setup/docs/AGENT_HANDBOOK.md) | AI behavior rules |
| [Workflow](setup/docs/WORKFLOW.md) | Phased build process |
| [Versioning](setup/docs/VERSIONING.md) | SemVer policy |

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

1. **Brand First** - Complete brand discovery before development
2. **Plan Mode** - Always ask intake questions before coding
3. **Small Changes** - Keep commits minimal and reviewable
4. **Test First** - Write tests before implementation (TDD)
5. **Document Always** - Update docs when behavior changes
6. **Security Check** - Audit before every release
7. **Never Commit Secrets** - Use environment variables

---

> **Ready to start?** Begin with brand discovery:
> Open `setup/docs/BRAND_AND_DESIGN_DISCOVERY.md` and complete the intake questions.
