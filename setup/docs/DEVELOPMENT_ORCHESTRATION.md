# Development Orchestration — Ops Agenda

> **From Conception to Production-Ready: Complete Development Lifecycle for Ops Agenda**

This guide provides the orchestration framework for Ops Agenda development, covering every phase from initial concept to production deployment.

---

## Table of Contents

1. [Orchestration Overview](#1-orchestration-overview)
2. [Phase -1: Project Identity](#2-phase--1-project-identity)
3. [Phase 0: Brand & Design Discovery](#3-phase-0-brand--design-discovery)
5. [Phase 2: Conception](#5-phase-2-conception)
6. [Phase 3: Requirements](#6-phase-3-requirements)
7. [Phase 4: Architecture](#7-phase-4-architecture)
8. [Phase 5: Planning](#8-phase-5-planning)
9. [Phase 6: Development](#9-phase-6-development)
10. [Phase 7: Testing](#10-phase-7-testing)
11. [Phase 8: Security Audit](#11-phase-8-security-audit)
12. [Phase 9: Code Review](#12-phase-9-code-review)
13. [Phase 10: Deployment](#13-phase-10-deployment)
14. [Phase 11: Monitoring](#14-phase-11-monitoring)
15. [Agent Orchestration](#15-agent-orchestration)
16. [Templates](#16-templates)

---

## 1. Orchestration Overview

### Development Lifecycle Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEVELOPMENT ORCHESTRATION                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  PHASE 0 │───▶│  PHASE 1 │───▶│  PHASE 2 │───▶│  PHASE 3 │              │
│  │Conception│    │ Require- │    │  Archi-  │    │ Planning │              │
│  │          │    │  ments   │    │  tecture │    │          │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│       │                                                │                     │
│       ▼                                                ▼                     │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                     PHASE 4: DEVELOPMENT                          │       │
│  │  ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐              │       │
│  │  │Feature │──▶│  Test  │──▶│ Review │──▶│ Merge  │──────────────┼──┐    │
│  │  │  Dev   │   │        │   │        │   │        │              │  │    │
│  │  └────────┘   └────────┘   └────────┘   └────────┘              │  │    │
│  └──────────────────────────────────────────────────────────────────┘  │    │
│                                                                         │    │
│       ┌─────────────────────────────────────────────────────────────────┘    │
│       ▼                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  PHASE 5 │───▶│  PHASE 6 │───▶│  PHASE 7 │───▶│  PHASE 8 │              │
│  │ Testing  │    │ Security │    │  Review  │    │  Deploy  │              │
│  │          │    │  Audit   │    │          │    │          │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│                                                        │                     │
│                                                        ▼                     │
│                                                  ┌──────────┐               │
│                                                  │  PHASE 9 │               │
│                                                  │ Monitor  │               │
│                                                  │          │               │
│                                                  └──────────┘               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Quality Gates

Each phase has mandatory gates that must pass before proceeding:

| Phase | Gate | Criteria |
|-------|------|----------|
| -1 → 0 | Identity Complete | All 5 identity fields captured |
| 0 → 1 | Brand Defined | Visual identity and tone established |
| 1 → 2 | Tech Selected | Application type and stack confirmed |
| 2 → 3 | Requirements Complete | All user stories defined |
| 3 → 4 | Architecture Approved | Technical design reviewed |
| 4 → 5 | Sprint Ready | Tasks estimated and prioritized |
| 5 → 6 | Code Complete | All features implemented |
| 5 → 6 | Standards Compliance | Code follows CRITICAL/HIGH rules |
| 6 → 7 | Tests Passing | >80% coverage, all tests green |
| 7 → 8 | Security Cleared | No critical/high vulnerabilities |
| 8 → 9 | Review Approved | All feedback addressed |
| 9 → 10 | Deployed | Staging verified, production live |

### Coding Standards Integration

The orchestration system loads and enforces coding standards based on the project's tech stack.

#### Auto-Detection

Standards are detected from `TECHSTACK.md` patterns using `.claude/config/coding-standards.json`. Standards will be configured during the Architecture phase once the tech stack is finalized.

#### Enforcement Points

1. **Delegate Skill**: Automatically injects relevant standards into subagent prompts
2. **Development Phase Gate (5 → 6)**: Validates code against CRITICAL and HIGH impact rules before testing phase

#### Rule Impact Levels

| Level | Description |
|-------|-------------|
| **CRITICAL** | Must fix - security vulnerabilities, data loss, severe performance issues |
| **HIGH** | Should fix - significant bugs, poor patterns, maintainability concerns |
| **MEDIUM-HIGH** | Recommended - best practices, code quality improvements |
| **MEDIUM** | Consider - optimizations, cleaner patterns |
| **LOW-MEDIUM** | Nice to have - style preferences, minor improvements |

#### Usage

The delegate skill (`/delegate`) automatically:
1. Reads `TECHSTACK.md` to detect technologies
2. Loads matching `../skills/*/AGENTS.md` files
3. Includes key CRITICAL rules in subagent prompts

The orchestrate skill (`/orchestrate`) validates:
1. Standards compliance before transitioning from Development to Testing phase
2. Flags CRITICAL rule violations for remediation

See `.claude/config/coding-standards.json` for detection configuration.

---

## 2. Phase -1: Project Identity

### Purpose
Capture essential project metadata that will be used throughout all documentation, code files, and legal notices.

### REQUIRED: Cannot Proceed Without

This phase is **NON-NEGOTIABLE**. These 5 items must be captured before ANY other discovery.

### Project Identity Questions

| # | Field | Required | Default |
|---|-------|----------|---------|
| 1 | **Application Name** | ✅ | - |
| 2 | **Company Name** | ✅ | - |
| 3 | **Author Name** | ✅ | - |
| 4 | **License Type** | ✅ | Proprietary |
| 5 | **Contact Email** | ✅ | - |

### Ops Agenda Project Identity (COMPLETE)

| Field | Value |
|-------|-------|
| **Application Name** | Ops Agenda |
| **Company Name** | Kre8ivTech |
| **Author Name** | Jeremiah Castillo |
| **License Type** | Proprietary |
| **Copyright Year** | 2026 |
| **Contact Email** | info@kre8ivtech.com |

### Gate Criteria: PASSED

- [x] Application Name: Ops Agenda
- [x] Company Name: Kre8ivTech
- [x] Author Name: Jeremiah Castillo
- [x] License Type: Proprietary
- [x] Contact Email: info@kre8ivtech.com

See `PROJECT_IDENTITY.md` for generated artifacts (LICENSE, package.json, file headers).

---

## 3. Phase 0: Brand & Design Discovery

See `BRAND_AND_DESIGN_DISCOVERY.md` for detailed brand intake questions.

---

## 4. Phase 1: Conception

### Purpose
Transform initial ideas into actionable project concepts.

### Agent: Product Visionary

```markdown
## Conception Intake Questions

1. What problem are we solving?
2. Who is the target user?
3. What is the core value proposition?
4. What does success look like?
5. What are the constraints (budget, timeline, tech)?
6. What similar solutions exist?
7. What makes this unique?
```

### Deliverables

| Artifact | Description |
|----------|-------------|
| `PROJECT_BRIEF.md` | One-page project summary |
| `VALUE_PROPOSITION.md` | Core value and differentiation |
| `STAKEHOLDERS.md` | Key stakeholders and roles |

### Template: Project Brief (Ops Agenda)

```markdown
# Project Brief: Ops Agenda

## Vision Statement
Provide users with a more effective and efficient means to manage the time
allocated in each day by transforming email and calendar data into a
structured, actionable daily and weekly agenda.

## Problem Statement
Professionals operating in high-volume, high-context environments lose time
and effectiveness due to fragmented information across inboxes and calendars.
Existing tools surface data but do not synthesize intent, urgency, and
constraints into an operational plan.

## Target Users
- Primary (MVP): Executives, military leaders, entrepreneurs, PMs, consultants
- Secondary (Future): Teams and organizations requiring shared visibility

## Success Metrics
- [ ] Clear understanding of daily priorities within 30 seconds
- [ ] Reduced missed deadlines
- [ ] Improved meeting preparedness
- [ ] Daily active usage of Daily Ops Brief
- [ ] User corrections to AI decreasing over time
- [ ] Retention after 30 days

## Constraints
- MVP: Individual users only (architecture must support future team expansion)
- Microsoft 365 integration only (Google is future)
- No auto-sending, auto-archiving, or auto-flagging
- Compliance: SOC 2 aligned, encryption at rest/transit
- Data: No raw email bodies stored

## Out of Scope (v1)
- Auto-sending emails
- Auto-archiving or auto-flagging
- Team workflows / shared inboxes
- Task manager integrations
- Chat or file intelligence
- CRM integrations

## Approval
- [x] PRD v1.0 approved (2026-02-09)
- [ ] Proceed to Requirements phase
```

---

## 3. Phase 1: Requirements

### Purpose
Define detailed user requirements and acceptance criteria.

### Agent: Requirements Analyst

```markdown
## Requirements Gathering Questions

1. What are the user journeys?
2. What are the functional requirements?
3. What are the non-functional requirements?
4. What are the acceptance criteria for each feature?
5. What are the dependencies?
6. What integrations are needed?
7. What are the performance requirements?
```

### Deliverables

| Artifact | Description |
|----------|-------------|
| `USER_STORIES.md` | All user stories with acceptance criteria |
| `REQUIREMENTS.md` | Functional and non-functional requirements |
| `API_CONTRACTS.md` | API specifications (if applicable) |

### Template: User Story

```markdown
# User Stories

## Epic: [Epic Name]

### US-001: [Story Title]

**As a** [user type]
**I want** [goal/desire]
**So that** [benefit/value]

#### Acceptance Criteria
- [ ] Given [context], when [action], then [outcome]
- [ ] Given [context], when [action], then [outcome]
- [ ] Given [context], when [action], then [outcome]

#### Technical Notes
- [Implementation considerations]

#### Dependencies
- Depends on: [US-XXX]
- Blocks: [US-YYY]

#### Estimation
- Story Points: [X]
- T-Shirt Size: [S/M/L/XL]

---
```

### Template: Requirements Document (Ops Agenda)

```markdown
# Requirements Specification — Ops Agenda

## Functional Requirements

### FR-001: Daily Ops Brief (North Star)
- **Priority**: Must Have
- **Description**: Generate a synthesized daily agenda with narrative summary,
  timeline, Top 3 priorities, due-outs, prep meetings, and focus blocks
- **Acceptance Criteria**: Loads < 2s, scannable in < 30s, always shows Top 3

### FR-002: Priority Inbox
- **Priority**: Must Have
- **Description**: AI-classified email priority (P1, P2, P3, FYSA) with
  explainable reasoning and user overrides
- **Acceptance Criteria**: Emails sorted by priority, explanation shown, override works

### FR-003: Due-Out Detection
- **Priority**: Must Have
- **Description**: Extract deadlines, action requests, and flag unanswered emails
- **Acceptance Criteria**: Due-outs in Daily Brief, dates shown, confidence scores

### FR-004: Calendar Intelligence
- **Priority**: Must Have
- **Description**: Multi-calendar support with prep indicators and conflict detection
- **Acceptance Criteria**: All calendars reflected, prep marked, conflicts surfaced

### FR-005: Draft Reply Assistance
- **Priority**: Should Have
- **Description**: Optional AI-generated email drafts with tone settings
- **Acceptance Criteria**: Toggle on/off, editable, never auto-sent, respects tone

### FR-006: Weekly Outlook
- **Priority**: Must Have
- **Description**: Forecast workload and meeting density, highlight high-risk days
- **Acceptance Criteria**: Loads from cached data, deadlines and heavy days visible

## Non-Functional Requirements

### Performance
- NFR-P01: Dashboard load < 2 seconds
- NFR-P02: Background jobs async and non-blocking
- NFR-P03: Idempotent sync and AI jobs

### Security
- NFR-S01: All data encrypted at rest and in transit
- NFR-S02: OAuth tokens encrypted, no credentials stored
- NFR-S03: Audit logs immutable
- NFR-S04: Tenant isolation
- NFR-S05: Least-privilege Microsoft Graph scopes

### Data Handling
- NFR-D01: No raw email bodies stored
- NFR-D02: Only metadata and AI summaries persisted
- NFR-D03: 30-day default retention

### AI Output
- NFR-AI01: JSON-only structured output
- NFR-AI02: Schema validated on every response
- NFR-AI03: Confidence score required for each analysis
- NFR-AI04: No autonomous actions in v1

### Reliability
- NFR-R01: Graceful degradation if AI unavailable
- NFR-R02: Incremental sync with retry logic
```

---

## 4. Phase 2: Architecture

### Purpose
Design the technical architecture and make technology decisions.

### Agent: Solution Architect

```markdown
## Architecture Questions

1. What is the high-level system design?
2. What technology stack will be used?
3. What are the key components and their responsibilities?
4. How will components communicate?
5. What is the data model?
6. How will we handle authentication/authorization?
7. What are the infrastructure requirements?
8. How will we ensure scalability?
9. What are the security considerations?
```

### Deliverables

| Artifact | Description |
|----------|-------------|
| `ARCHITECTURE.md` | High-level architecture document |
| `TECH_STACK.md` | Technology decisions with rationale |
| `DATA_MODEL.md` | Database schema and relationships |
| `API_DESIGN.md` | API design and endpoints |

### Template: Architecture Decision Record (ADR)

```markdown
# ADR-001: [Decision Title]

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
[What is the issue that we're seeing that is motivating this decision?]

## Decision
[What is the change that we're proposing and/or doing?]

## Options Considered

### Option 1: [Name]
- **Pros**: 
- **Cons**: 
- **Effort**: 

### Option 2: [Name]
- **Pros**: 
- **Cons**: 
- **Effort**: 

## Consequences
[What becomes easier or harder as a result of this decision?]

## Related Decisions
- ADR-XXX: [Related decision]
```

---

## 5. Phase 3: Planning

### Purpose
Break down work into actionable tasks with estimates.

### Agent: Technical Planner

```markdown
## Planning Questions

1. What are the development phases/sprints?
2. What are the task dependencies?
3. What are the effort estimates?
4. Who owns each task?
5. What are the milestones?
6. What are the risks?
7. What is the testing strategy?
```

### Deliverables

| Artifact | Description |
|----------|-------------|
| `SPRINT_PLAN.md` | Sprint goals and task breakdown |
| `TASK_BREAKDOWN.md` | Detailed task list with estimates |
| `RISK_REGISTER.md` | Identified risks and mitigations |

### Template: Sprint Plan

```markdown
# Sprint [N] Plan

## Sprint Goal
[One sentence describing what we'll achieve]

## Duration
- Start: YYYY-MM-DD
- End: YYYY-MM-DD

## Capacity
- Available: [X] story points
- Committed: [Y] story points

## User Stories

| ID | Story | Points | Owner | Status |
|----|-------|--------|-------|--------|
| US-001 | [Title] | 5 | @dev1 | To Do |
| US-002 | [Title] | 3 | @dev2 | To Do |

## Tasks

| ID | Task | Story | Hours | Owner | Status |
|----|------|-------|-------|-------|--------|
| T-001 | Setup database schema | US-001 | 4 | @dev1 | To Do |
| T-002 | Create API endpoints | US-001 | 8 | @dev1 | To Do |

## Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| [Risk 1] | High | Medium | [Action] |

## Definition of Done
- [ ] Code complete and passing lint
- [ ] Unit tests written and passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Deployed to staging
```

---

## 6. Phase 4: Development

### Purpose
Implement features following TDD and best practices.

### Agent: Software Engineer

```markdown
## Development Workflow

1. Create feature branch from main
2. Write failing tests (TDD)
3. Implement feature
4. Ensure tests pass
5. Run linting and formatting
6. Create pull request
7. Address review feedback
8. Merge to main
```

### Development Checklist

```markdown
## Feature Development Checklist

### Before Starting
- [ ] User story understood and clarified
- [ ] Acceptance criteria clear
- [ ] Branch created: feature/[story-id]-[description]
- [ ] CLAUDE-activeContext.md updated

### During Development
- [ ] Tests written first (TDD)
- [ ] Code follows existing patterns (CLAUDE-patterns.md)
- [ ] No hardcoded secrets
- [ ] Error handling implemented
- [ ] Logging added for debugging
- [ ] Edge cases handled

### Before PR
- [ ] All tests passing
- [ ] Linting passing
- [ ] No console.log/print statements
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (if significant)
- [ ] Self-review completed

### PR Description
- [ ] Summary of changes
- [ ] Link to user story
- [ ] Screenshots (if UI changes)
- [ ] Testing instructions
```

### Commit Standards

```bash
# Format
<type>(<scope>): <description>

# Types
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation
style:    # Formatting
refactor: # Code restructure
test:     # Tests
chore:    # Maintenance

# Examples
feat(auth): add Google OAuth login
fix(api): handle null response from payment gateway
test(user): add unit tests for registration flow
```

---

## 7. Phase 5: Testing

### Purpose
Ensure quality through comprehensive testing.

### Agent: QA Engineer

```markdown
## Testing Levels

1. Unit Tests (80%+ coverage)
2. Integration Tests (API, Database)
3. E2E Tests (Critical user flows)
4. Performance Tests (Load, Stress)
5. Accessibility Tests (WCAG 2.1 AA)
```

### Testing Strategy

| Test Type | Tools | Coverage Target |
|-----------|-------|-----------------|
| Unit | Jest, Vitest, pytest | 80%+ |
| Integration | Supertest, pytest | Critical paths |
| E2E | Playwright, Cypress | Happy paths |
| Performance | k6, Artillery | SLAs defined |
| Security | OWASP ZAP, Semgrep | No criticals |
| Accessibility | axe-core, Lighthouse | WCAG 2.1 AA |

### Template: Test Plan

```markdown
# Test Plan: [Feature/Release]

## Scope
- In scope: [Features to test]
- Out of scope: [Excluded]

## Test Types

### Unit Tests
- [ ] Component tests
- [ ] Service tests
- [ ] Utility function tests
- Coverage target: 80%

### Integration Tests
- [ ] API endpoint tests
- [ ] Database integration tests
- [ ] Third-party integration tests

### E2E Tests
| Scenario | Priority | Status |
|----------|----------|--------|
| Onboarding + M365 OAuth | High | To Do |
| Daily Ops Brief generation | High | To Do |
| Priority Inbox classification | High | To Do |
| Due-out detection | High | To Do |
| Calendar intelligence | High | To Do |

### Performance Tests
| Test | Target | Status |
|------|--------|--------|
| Dashboard load | < 2s | To Do |
| Brief generation | < 5s | To Do |
| Background sync | Non-blocking | To Do |

## Environment
- Staging URL: [URL]
- Test data: [Location]
- Credentials: [Vault location]

## Exit Criteria
- [ ] All critical tests passing
- [ ] No blocker/critical bugs
- [ ] Performance SLAs met
- [ ] Accessibility compliance verified
```

---

## 8. Phase 6: Security Audit

### Purpose
Identify and remediate security vulnerabilities.

### Agent: Security Auditor

```markdown
## Security Audit Checklist

### Code Security
- [ ] No hardcoded secrets
- [ ] Input validation on all endpoints
- [ ] Output encoding for XSS prevention
- [ ] SQL injection prevention (parameterized queries)
- [ ] CSRF protection enabled
- [ ] Rate limiting implemented

### Authentication & Authorization
- [ ] Strong password policy enforced
- [ ] MFA available/required
- [ ] Session management secure
- [ ] JWT properly implemented
- [ ] RBAC correctly configured

### Data Protection
- [ ] Encryption at rest
- [ ] Encryption in transit (TLS 1.3)
- [ ] PII handling compliant
- [ ] Data retention policies (30-day default)
- [ ] No raw email bodies stored
- [ ] OAuth tokens encrypted
- [ ] Audit logs immutable
- [ ] Tenant isolation enforced

### Infrastructure
- [ ] Security headers configured
- [ ] CORS properly restricted
- [ ] Firewall rules reviewed
- [ ] Secrets in vault/env vars
```

### Security Scanning

```markdown
## Automated Security Scans

### SAST (Static Analysis)
- Tool: Semgrep, SonarQube
- Frequency: Every PR
- Action: Block merge on critical findings

### SCA (Dependency Scanning)
- Tool: Snyk, Dependabot
- Frequency: Daily
- Action: Alert on high/critical vulnerabilities

### DAST (Dynamic Analysis)
- Tool: OWASP ZAP
- Frequency: Weekly on staging
- Action: Ticket creation for findings

### Container Scanning
- Tool: Trivy, Snyk Container
- Frequency: Every build
- Action: Block deploy on critical findings
```

### Template: Security Audit Report

```markdown
# Security Audit Report

## Summary
- Date: YYYY-MM-DD
- Auditor: [Name]
- Scope: [Components audited]

## Findings

### Critical (0)
[None | List findings]

### High (0)
[None | List findings]

### Medium (0)
[None | List findings]

### Low (0)
[None | List findings]

## Finding Detail Template

### SEC-001: [Title]
- **Severity**: Critical | High | Medium | Low
- **Category**: [OWASP category]
- **Location**: [File/endpoint]
- **Description**: [What was found]
- **Impact**: [What could happen]
- **Recommendation**: [How to fix]
- **Status**: Open | In Progress | Resolved

## Remediation Tracking
| ID | Severity | Status | Due Date | Owner |
|----|----------|--------|----------|-------|
| SEC-001 | High | Open | YYYY-MM-DD | @dev |

## Sign-off
- [ ] All critical findings resolved
- [ ] All high findings resolved or accepted
- [ ] Security lead approval
```

---

## 9. Phase 7: Code Review

### Purpose
Ensure code quality through peer review.

### Agent: Code Reviewer

```markdown
## Code Review Checklist

### Correctness
- [ ] Logic is correct
- [ ] Edge cases handled
- [ ] Error handling appropriate
- [ ] No obvious bugs

### Code Quality
- [ ] Follows project conventions
- [ ] DRY principle followed
- [ ] SOLID principles applied
- [ ] No code smells

### Performance
- [ ] No N+1 queries
- [ ] Appropriate caching
- [ ] No memory leaks
- [ ] Efficient algorithms

### Security
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] Authorization checked
- [ ] No injection vulnerabilities

### Testing
- [ ] Tests are meaningful
- [ ] Coverage adequate
- [ ] Edge cases tested

### Documentation
- [ ] Code is self-documenting
- [ ] Complex logic commented
- [ ] API documentation updated
```

### Review Process

```
┌───────────────────────────────────────────────────────────────┐
│                     CODE REVIEW FLOW                          │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐   │
│  │   PR    │───▶│ Review  │───▶│ Address │───▶│  Merge  │   │
│  │ Created │    │         │    │Feedback │    │         │   │
│  └─────────┘    └────┬────┘    └────┬────┘    └─────────┘   │
│                      │              │                        │
│                      ▼              ▼                        │
│                 ┌─────────┐   ┌─────────┐                   │
│                 │ Request │   │   Re-   │                   │
│                 │ Changes │──▶│ Review  │                   │
│                 └─────────┘   └─────────┘                   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 10. Phase 8: Deployment

### Purpose
Deploy to staging and production environments.

### Agent: DevOps Engineer

```markdown
## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Security audit complete
- [ ] Code review approved
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Stakeholders notified

### Staging Deployment
- [ ] Deploy to staging
- [ ] Smoke tests passing
- [ ] Integration tests passing
- [ ] Performance acceptable
- [ ] Stakeholder verification

### Production Deployment
- [ ] Final approval received
- [ ] Deploy during maintenance window
- [ ] Health checks passing
- [ ] Monitoring active
- [ ] Error rates normal
- [ ] Performance metrics normal

### Post-Deployment
- [ ] Verify all features working
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Update status page
- [ ] Communicate completion
```

### Deployment Strategy

```markdown
## Deployment Strategies

### Blue-Green Deployment
- Zero downtime
- Instant rollback
- Resource intensive

### Canary Deployment
- Gradual rollout (1% → 10% → 50% → 100%)
- Risk mitigation
- Requires traffic splitting

### Rolling Deployment
- Gradual instance updates
- No additional resources
- Partial rollback possible
```

---

## 11. Phase 9: Monitoring

### Purpose
Monitor production and respond to issues.

### Agent: Site Reliability Engineer

```markdown
## Monitoring Stack

### Application Performance
- Tool: Sentry
- Metrics: Error rates, response times, throughput

### Infrastructure
- Tool: DataDog, CloudWatch
- Metrics: CPU, memory, disk, network

### Logs
- Tool: CloudWatch Logs, LogTail
- Retention: 30 days

### Uptime
- Tool: UptimeRobot, Pingdom
- Alerts: Slack, PagerDuty
```

### Alerting Rules

```markdown
## Alert Configuration

### Critical (Page Immediately)
- Error rate > 5% for 5 minutes
- Response time > 10s for 5 minutes
- Service down

### Warning (Notify Team)
- Error rate > 1% for 15 minutes
- Response time > 3s for 15 minutes
- Disk usage > 80%

### Info (Log Only)
- Deployment completed
- Scheduled maintenance
```

---

## 12. Agent Orchestration

### Agent Assignment by Phase

| Phase | Primary Agent | Support Agents |
|-------|--------------|----------------|
| 0. Conception | Product Visionary | - |
| 1. Requirements | Requirements Analyst | Product Manager |
| 2. Architecture | Solution Architect | Security Architect |
| 3. Planning | Technical Planner | Project Manager |
| 4. Development | Software Engineer | - |
| 5. Testing | QA Engineer | - |
| 6. Security | Security Auditor | - |
| 7. Review | Code Reviewer | - |
| 8. Deployment | DevOps Engineer | - |
| 9. Monitoring | SRE | - |

### Orchestration Commands

```markdown
## Phase Transition Commands

### Start New Project
/orchestrate new-project
→ Triggers Phase 0 with Product Visionary agent

### Move to Next Phase
/orchestrate next-phase
→ Validates current phase gates and transitions

### Phase-Specific Commands
/orchestrate requirements  → Phase 1
/orchestrate architecture  → Phase 2
/orchestrate planning      → Phase 3
/orchestrate development   → Phase 4
/orchestrate testing       → Phase 5
/orchestrate security      → Phase 6
/orchestrate review        → Phase 7
/orchestrate deployment    → Phase 8
/orchestrate monitoring    → Phase 9
```

---

## 13. Templates

### Project Directory Structure (Ops Agenda)

```
ops-agenda/
├── setup/
│   └── docs/                    # Governance & process documentation
├── docs/
│   ├── PROJECT_BRIEF.md
│   ├── REQUIREMENTS.md
│   ├── USER_STORIES.md
│   ├── ARCHITECTURE.md
│   ├── API_DESIGN.md
│   ├── TEST_PLAN.md
│   └── adr/
│       ├── ADR-001-tech-stack.md
│       └── ADR-002-auth-strategy.md
├── src/
├── tests/
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md
├── CLAUDE-activeContext.md
├── CLAUDE-patterns.md
├── CLAUDE-decisions.md
├── CHANGELOG.md
└── README.md
```

### Quick Start (Ops Agenda)

1. **Review PRD** (provided by product owner)
2. **Complete project identity** (`setup/docs/PROJECT_IDENTITY.md`) — DONE
3. **Technology discovery** (`setup/docs/TECHNOLOGY_DISCOVERY.md`) — DONE
4. **Define requirements** (`docs/USER_STORIES.md`)
5. **Design architecture** (`docs/ARCHITECTURE.md`)
6. **Plan sprint** (`docs/SPRINT_PLAN.md`)
7. **Develop features** (feature branches, modular architecture)
8. **Test thoroughly** (automated + manual, dashboard < 2s)
9. **Security audit** (SOC 2 alignment, no raw email bodies)
10. **Code review** (PR process)
11. **Deploy** (staging → production)
12. **Monitor** (alerts + dashboards)

---

*For agent definitions, see `../agents/orchestration/`*
*For MCP server configurations, see `SUBAGENTS_AND_MCP_SERVERS.md`*
*For PRD details, see the Ops Agenda Product Requirements Document (v1.0)*
