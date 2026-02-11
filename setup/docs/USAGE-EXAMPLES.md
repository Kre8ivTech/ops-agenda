# Build with Quality — Ops Agenda Usage Examples

This guide shows how to invoke the **Build with Quality** skill for Ops Agenda features. Each example is a ready-to-use prompt you can paste into Claude Code.

## Quick Reference

| Feature | Complexity | Key Quality Focus |
|---------|------------|-------------------|
| [Daily Ops Brief](#example-1-daily-ops-brief) | Advanced | AI output validation, performance |
| [M365 Email Sync](#example-2-microsoft-365-email-sync) | Intermediate | OAuth, data handling, retry logic |
| [AI Priority Classification](#example-3-ai-priority-classification) | Intermediate | JSON schema, confidence scores |
| [Calendar Intelligence](#example-4-calendar-intelligence) | Intermediate | Multi-calendar, conflict detection |
| [Due-Out Detection](#example-5-due-out-detection) | Intermediate | Deadline extraction, confidence |

---

## Example 1: Daily Ops Brief

**Use case:** Building the north star feature — the synthesized daily agenda.

```markdown
# Build with Quality — Claude Flow V3 Swarm

## Skill Activation
build-with-quality v1.0.0 (111+ agents, hierarchical-mesh)
Config: skill.yaml

## Project Context
- **Name:** Ops Agenda
- **Type:** web-app (SaaS)
- **Stack:** [Project tech stack]
- **Description:** Daily Ops Brief — synthesized daily operational agenda

## Task
Build the Daily Ops Brief generation pipeline that produces a structured
daily agenda from email and calendar data.

## Acceptance Criteria
- [ ] Brief narrative summary of the day
- [ ] Timeline agenda from calendar events
- [ ] Top 3 priorities extracted from email and calendar
- [ ] Due-outs with dates and confidence scores
- [ ] Meetings requiring prep clearly marked
- [ ] Recommended focus blocks
- [ ] Loads in under 2 seconds
- [ ] Can be scanned in under 30 seconds
- [ ] Always shows Top 3 priorities

## Methodology
- **DDD:**
  - Bounded Context: BriefGeneration
  - Aggregates: DailyBrief (id, date, userId, narrative, timeline,
    priorities, dueOuts, prepMeetings, focusBlocks)
  - Domain Events: BriefGenerated, BriefViewed
- **TDD:** Test each brief component before implementing

## Quality Gates
- Coverage: 85% overall, 95% brief generation logic
- Security: No raw email bodies in brief output
- Performance: Brief generation < 5s, dashboard render < 2s
- AI Output: JSON-only, schema-validated, confidence scores on all items

## Execute
1. Define DailyBrief aggregate and schema
2. Build priority extraction from email metadata
3. Build timeline from calendar events
4. Build due-out detection integration
5. Build narrative summary generation
6. Build brief assembly and caching
7. Build dashboard rendering
8. Verify performance targets

Deliver working Daily Ops Brief with full test coverage.
```

---

## Example 2: Microsoft 365 Email Sync

**Use case:** Integrating with Microsoft Graph API for email data.

```markdown
# Build with Quality — Claude Flow V3 Swarm

## Skill Activation
build-with-quality v1.0.0 (111+ agents, hierarchical-mesh)
Config: skill.yaml

## Project Context
- **Name:** Ops Agenda
- **Type:** api (SaaS backend)
- **Stack:** [Project tech stack]
- **Description:** Microsoft 365 email sync via Microsoft Graph API

## Task
Build the M365 email sync module with OAuth, incremental sync, and
change notification webhooks.

## Acceptance Criteria
- [ ] OAuth 2.0 flow for Microsoft 365 connection
- [ ] Initial sync of inbox metadata (no raw bodies stored)
- [ ] Incremental sync for new/changed emails
- [ ] Microsoft Graph change notification webhook endpoint
- [ ] Idempotent sync operations with retry logic
- [ ] Least-privilege scopes (Mail.Read)
- [ ] OAuth tokens encrypted at rest
- [ ] Graceful degradation on API failures

## Methodology
- **DDD:**
  - Bounded Context: M365Integration
  - Aggregates: SyncState (userId, lastSyncToken, status),
    EmailMetadata (id, subject, sender, date, flags)
  - Domain Events: SyncStarted, SyncCompleted, EmailReceived
- **TDD:** Test OAuth flow, sync logic, webhook handling

## Quality Gates
- Coverage: 85% overall, 95% OAuth and sync flows
- Security: 0 critical (OAuth token handling, webhook validation)
- Data: No raw email bodies persisted — metadata only
- Reliability: Idempotent operations, retry with exponential backoff

## Execute
1. Implement OAuth 2.0 authorization code flow
2. Build initial inbox sync with metadata extraction
3. Build incremental sync with delta tokens
4. Build webhook endpoint for change notifications
5. Implement retry logic and error handling
6. Verify token encryption and scope restrictions

Deliver production-ready M365 email sync with compliance.
```

---

## Example 3: AI Priority Classification

**Use case:** Building the AI pipeline for email priority scoring.

```markdown
# Build with Quality — Claude Flow V3 Swarm

## Skill Activation
build-with-quality v1.0.0 (111+ agents, hierarchical-mesh)
Config: skill.yaml

## Project Context
- **Name:** Ops Agenda
- **Type:** api (SaaS backend)
- **Stack:** [Project tech stack]
- **Description:** AI-driven email priority classification (P1, P2, P3, FYSA)

## Task
Build the AI priority classification pipeline that scores emails and
provides explainable priority assignments.

## Acceptance Criteria
- [ ] Classify emails as P1, P2, P3, or FYSA
- [ ] Clear explanation of why each email is prioritized
- [ ] Confidence score for each classification
- [ ] User can override priority (correction logged)
- [ ] AI corrections improve prioritization over time
- [ ] JSON-only structured output, schema-validated
- [ ] No autonomous actions — classification only

## Methodology
- **DDD:**
  - Bounded Context: AIClassification
  - Aggregates: PriorityAssignment (emailId, priority, confidence,
    explanation, userOverride)
  - Domain Events: EmailClassified, PriorityOverridden
- **TDD:** Test classification logic, override handling, correction logging

## Quality Gates
- Coverage: 85% overall, 100% classification logic
- AI Output: JSON schema validated on every response
- Confidence: Score required for each analysis
- Security: No raw email content in logs

## Execute
1. Define priority schema and classification rules
2. Build LLM prompt for email analysis
3. Build JSON output validation layer
4. Build confidence scoring
5. Build user override and correction logging
6. Build feedback loop for improvement tracking

Deliver AI classification pipeline with explainable outputs.
```

---

## Example 4: Calendar Intelligence

**Use case:** Multi-calendar support with prep indicators and conflict detection.

```markdown
# Build with Quality — Claude Flow V3 Swarm

## Skill Activation
build-with-quality v1.0.0 (111+ agents, hierarchical-mesh)
Config: skill.yaml

## Project Context
- **Name:** Ops Agenda
- **Type:** web-app (SaaS)
- **Stack:** [Project tech stack]
- **Description:** Calendar intelligence with prep indicators and conflict detection

## Task
Build the calendar intelligence module that processes multiple M365
calendars into an annotated timeline.

## Acceptance Criteria
- [ ] Multiple calendars supported via Microsoft Graph
- [ ] Meetings annotated with prep-required indicators
- [ ] Calendar conflicts surfaced visually
- [ ] Timeline accurately reflects all calendars
- [ ] Prep-required meetings clearly marked
- [ ] Data integrates into Daily Ops Brief timeline

## Methodology
- **DDD:**
  - Bounded Context: CalendarIntelligence
  - Aggregates: CalendarTimeline (userId, date, events[]),
    CalendarEvent (id, title, start, end, calendar, prepRequired, conflicts[])
  - Domain Events: CalendarSynced, ConflictDetected, PrepFlagged
- **TDD:** Test multi-calendar merge, conflict detection, prep flagging

## Quality Gates
- Coverage: 85% overall, 95% conflict detection
- Performance: Calendar sync non-blocking, timeline render < 1s

## Execute
1. Build Microsoft Graph calendar sync (multiple calendars)
2. Build calendar event merge and deduplication
3. Build conflict detection algorithm
4. Build prep-required indicator logic
5. Build timeline rendering component
6. Verify integration with Daily Ops Brief

Deliver calendar intelligence with multi-calendar support.
```

---

## Example 5: Due-Out Detection

**Use case:** Extracting deadlines and action items from email metadata.

```markdown
# Build with Quality — Claude Flow V3 Swarm

## Skill Activation
build-with-quality v1.0.0 (111+ agents, hierarchical-mesh)
Config: skill.yaml

## Project Context
- **Name:** Ops Agenda
- **Type:** api (SaaS backend)
- **Stack:** [Project tech stack]
- **Description:** Due-out detection engine for deadlines and action items

## Task
Build the due-out detection engine that identifies items requiring user
action by a defined or inferred deadline.

## Acceptance Criteria
- [ ] Detect explicit deadlines in email metadata/summaries
- [ ] Detect explicit action requests
- [ ] Flag unanswered emails after configurable time threshold
- [ ] Due-outs visible in Daily Ops Brief
- [ ] Due date clearly displayed
- [ ] Confidence score shown for each due-out
- [ ] JSON-only output, schema-validated

## Methodology
- **DDD:**
  - Bounded Context: DueOutDetection
  - Aggregates: DueOut (id, emailId, description, dueDate,
    confidence, source, status)
  - Domain Events: DueOutDetected, DueOutCompleted, DueOutOverdue
- **TDD:** Test each detection rule before implementing

## Quality Gates
- Coverage: 85% overall, 95% detection rules
- AI Output: Confidence score required for each due-out
- Data: No raw email bodies — work from metadata and AI summaries

## Execute
1. Define due-out schema and detection rules
2. Build explicit deadline extraction
3. Build action request detection
4. Build unanswered email flagging (configurable threshold)
5. Build confidence scoring for inferred deadlines
6. Verify integration with Daily Ops Brief

Deliver due-out detection with confidence scoring.
```

---

## Quick Start Templates

### Minimal (Any Ops Agenda Feature)

```markdown
Build with Quality skill (v1.0.0).

Project: Ops Agenda | Stack: [TECH] | Task: [DESCRIPTION]

Methodology: DDD + ADR + TDD
Quality: 85% coverage, security scan, WCAG AA
Constraint: No raw email bodies stored, JSON-only AI output

Execute and deliver tested code.
```

### Rapid Prototype (Reduced Gates)

```markdown
Build with Quality skill — PROTOTYPE MODE.

Project: Ops Agenda | Stack: [TECH] | Task: [DESCRIPTION]

Quality gates (relaxed):
- Coverage: 60%
- Security: Critical only
- Accessibility: Skip
- Chaos: Skip

Focus on working implementation, tests for core paths only.
```

### Production Critical (Maximum Gates)

```markdown
Build with Quality skill — PRODUCTION MODE.

Project: Ops Agenda | Stack: [TECH] | Task: [DESCRIPTION]

Quality gates (strict):
- Coverage: 95% overall, 100% critical paths
- Security: 0 any severity, SOC 2 compliance
- Accessibility: WCAG AAA
- Chaos: 90% all categories
- Data: Verify no raw email body storage
- AI: Verify all outputs schema-validated with confidence scores

Full quality validation required before delivery.
```

---

## References

- [BUILD-WITH-QUALITY-PROMPT.md](./BUILD-WITH-QUALITY-PROMPT.md) — Full activation prompt
- [AGENT_HANDBOOK.md](./AGENT_HANDBOOK.md) — Development governance
- [TECHNOLOGY_DISCOVERY.md](./TECHNOLOGY_DISCOVERY.md) — Tech requirements

---

*Version: 1.0.0*
*Last Updated: 2026-02-11*
