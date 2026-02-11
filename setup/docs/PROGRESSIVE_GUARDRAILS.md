# Progressive Guardrails System

> **Wide to Narrow: From Exploration to Precision**

This document defines the guardrail system that progressively narrows from open exploration to precise implementation. Each phase tightens constraints while preserving creative problem-solving within defined boundaries.

---

## The Funnel Model

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         PROGRESSIVE GUARDRAILS FUNNEL                          ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║   PHASE -1: PROJECT IDENTITY ★ ALWAYS FIRST ★                                 ║
║   ════════════════════════════════════════════════════════════════════════    ║
║   │ REQUIRED: Cannot proceed without these 5 items                         │   ║
║   │ • Application Name                                                     │   ║
║   │ • Company Name                                                         │   ║
║   │ • Author Name                                                          │   ║
║   │ • License Type (default: Proprietary)                                  │   ║
║   │ • Contact Email                                                        │   ║
║   └────────────────────────────────────────────────────────────────────────┘   ║
║                                   │                                            ║
║                                   ▼                                            ║
║   PHASE 0: BRAND DISCOVERY                                                     ║
║   ════════════════════════════════════════════════════════════════════════    ║
║   │ WIDEST: Explore all possibilities                                      │   ║
║   │ • "What could this be?"                                                │   ║
║   │ • No wrong answers                                                     │   ║
║   │ • Brainstorming encouraged                                             │   ║
║   │ • Inspiration from anywhere                                            │   ║
║   └────────────────────────────────────────────────────────────────────────┘   ║
║                              ╲                 ╱                                ║
║   PHASE 1: TECHNOLOGY DISCOVERY                                                ║
║   ══════════════════════════════════════════════════════════════════          ║
║   │ WIDE: Define the playing field                                      │     ║
║   │ • What type of application?                                         │     ║
║   │ • What capabilities needed?                                         │     ║
║   │ • What are the constraints?                                         │     ║
║   │ • Multiple valid options exist                                      │     ║
║   └─────────────────────────────────────────────────────────────────────┘     ║
║                                 ╲             ╱                                 ║
║   PHASE 2: CONCEPTION                                                          ║
║   ════════════════════════════════════════════════════════════                 ║
║   │ MEDIUM-WIDE: Lock in vision                                       │       ║
║   │ • Problem statement fixed                                         │       ║
║   │ • Target users defined                                            │       ║
║   │ • Success metrics identified                                      │       ║
║   │ • Scope boundaries drawn                                          │       ║
║   └───────────────────────────────────────────────────────────────────┘       ║
║                                    ╲         ╱                                  ║
║   PHASE 3: REQUIREMENTS                                                        ║
║   ══════════════════════════════════════════════════════                       ║
║   │ MEDIUM: Features locked                                         │         ║
║   │ • User stories finalized                                        │         ║
║   │ • Acceptance criteria written                                   │         ║
║   │ • What we're building is clear                                  │         ║
║   │ • No new features without process                               │         ║
║   └─────────────────────────────────────────────────────────────────┘         ║
║                                       ╲      ╱                                  ║
║   PHASE 4: ARCHITECTURE                                                        ║
║   ════════════════════════════════════════════════                             ║
║   │ MEDIUM-NARROW: Tech decisions final                           │           ║
║   │ • Stack selected and locked                                   │           ║
║   │ • Patterns established                                        │           ║
║   │ • Architecture documented                                     │           ║
║   │ • No framework changes                                        │           ║
║   └───────────────────────────────────────────────────────────────┘           ║
║                                          ╲   ╱                                  ║
║   PHASE 5: PLANNING                                                            ║
║   ══════════════════════════════════════════                                   ║
║   │ NARROW: Tasks defined                                       │             ║
║   │ • Sprint planned                                            │             ║
║   │ • Tasks estimated                                           │             ║
║   │ • Dependencies mapped                                       │             ║
║   │ • Timeline committed                                        │             ║
║   └─────────────────────────────────────────────────────────────┘             ║
║                                             ╲╱                                  ║
║   PHASE 6+: DEVELOPMENT → PRODUCTION                                           ║
║   ════════════════════════════════════                                         ║
║   │ NARROWEST: Execute precisely                              │               ║
║   │ • Follow established patterns                             │               ║
║   │ • No scope changes                                        │               ║
║   │ • Match acceptance criteria                               │               ║
║   │ • Changes require process                                 │               ║
║   └───────────────────────────────────────────────────────────┘               ║
║                                                                                ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## Phase-by-Phase Guardrails

### Phase 0: Brand Discovery

**Guardrail Width: WIDEST (100%)**

```markdown
## What's ALLOWED (Almost Everything)

✅ Wild ideas and brainstorming
✅ "What if we..." explorations
✅ Inspiration from any industry
✅ Conflicting ideas (we'll resolve later)
✅ Changing your mind frequently
✅ Vague or abstract concepts
✅ Emotional and aspirational language
✅ "I don't know yet" answers
✅ Multiple competing visions
✅ Looking at 50+ competitor examples

## What's NOT ALLOWED (Very Little)

❌ Skipping this phase entirely
❌ Refusing to answer any questions
❌ "Just build something" without any direction

## Questions to Ask (Exploratory)

• "What does success FEEL like?"
• "If there were no constraints, what would you build?"
• "Show me 10 brands you admire - any industry"
• "What do you NOT want to be?"
• "Describe your ideal customer's day"
• "What emotions should your brand evoke?"

## Decisions That CAN Change

Everything. Nothing is locked yet.

## Exit Criteria (Loose)

- [ ] Have some sense of brand identity
- [ ] Collected inspiration materials
- [ ] Know who the target audience might be
- [ ] Have directional color/tone preferences
```

---

### Phase 1: Technology Discovery

**Guardrail Width: WIDE (80%)**

```markdown
## What's ALLOWED

✅ Exploring multiple technology options
✅ "What about [alternative]?" questions
✅ Comparing 3-5 different stacks
✅ Changing platform preferences
✅ Discovering new requirements
✅ Adding capabilities to the list
✅ Reconsidering constraints
✅ Researching unfamiliar technologies

## What's Getting CONSTRAINED

⚠️ Brand identity is now established (don't revisit)
⚠️ Target audience is defined (don't change)
⚠️ Core value proposition is set

## What's NOT ALLOWED

❌ Revisiting brand decisions without justification
❌ Changing target audience dramatically
❌ "Let's just figure it out as we go"

## Questions to Ask (Directed Exploration)

• "Given your brand and audience, which platform makes sense?"
• "What capabilities are MUST-HAVE vs NICE-TO-HAVE?"
• "What's your team's expertise?"
• "What are the hard constraints (budget, timeline, compliance)?"
• "Do you have existing systems to integrate with?"

## Decisions That CAN Change

- Technology stack (still evaluating)
- Specific tools and services
- Hosting platform
- Integration choices

## Decisions That Are LOCKED

- Brand identity
- Target audience
- Core value proposition

## Exit Criteria

- [ ] Application type selected
- [ ] Core capabilities identified
- [ ] 1-2 stack options shortlisted
- [ ] Major constraints documented
- [ ] Budget range established
```

---

### Phase 2: Conception

**Guardrail Width: MEDIUM-WIDE (60%)**

```markdown
## What's ALLOWED

✅ Refining the problem statement
✅ Clarifying scope boundaries
✅ Defining success metrics
✅ Identifying stakeholders
✅ Choosing between shortlisted stacks
✅ Prioritizing capabilities

## What's Getting CONSTRAINED

⚠️ Technology direction is narrowing
⚠️ Scope is being defined (can't keep adding)
⚠️ Timeline expectations are forming
⚠️ "Out of scope" list is growing

## What's NOT ALLOWED

❌ Changing brand identity
❌ Changing target audience
❌ Adding major new capabilities without removing others
❌ "We'll figure out the scope later"
❌ Switching to completely different platform type

## Questions to Ask (Clarifying)

• "What is the ONE thing this must do well?"
• "What are you explicitly NOT building?"
• "How will you measure success?"
• "Who approves this going forward?"
• "Given our tech direction, what's realistic for MVP?"

## Decisions That CAN Change

- Specific features (within scope)
- Priority order
- MVP vs V2 split
- Specific success metrics

## Decisions That Are LOCKED

- Brand identity
- Target audience
- Application type
- Core technology platform
- Major capabilities list

## Exit Criteria

- [ ] Vision statement written
- [ ] Problem statement finalized
- [ ] Scope explicitly defined (in AND out)
- [ ] Success metrics specified
- [ ] Tech stack selected (singular)
- [ ] Stakeholders identified
```

---

### Phase 3: Requirements

**Guardrail Width: MEDIUM (40%)**

```markdown
## What's ALLOWED

✅ Writing detailed user stories
✅ Defining acceptance criteria
✅ Clarifying edge cases
✅ Detailing non-functional requirements
✅ Splitting large features into smaller ones
✅ Reprioritizing within existing scope

## What's Getting CONSTRAINED

⚠️ Feature list is closing (scope freeze coming)
⚠️ Acceptance criteria must be specific
⚠️ "Nice to have" moves to backlog
⚠️ Estimates are binding

## What's NOT ALLOWED

❌ Adding new features to scope
❌ Changing core capabilities
❌ Vague acceptance criteria ("it should work well")
❌ Undefined user stories
❌ Changing tech stack
❌ Revisiting brand/audience/vision

## Questions to Ask (Specific)

• "What exactly happens when [action]?"
• "What does the user see when [state]?"
• "What is the error case for [scenario]?"
• "How do we verify this is complete?"
• "Is this MVP or can it wait?"

## Decisions That CAN Change

- Story priority order
- Acceptance criteria wording
- Story point estimates
- Sprint assignments

## Decisions That Are LOCKED

- Brand, audience, vision
- Tech stack
- Feature scope (what's in/out)
- Major architecture patterns
- Success metrics

## Exit Criteria

- [ ] All user stories written
- [ ] All acceptance criteria defined
- [ ] Stories estimated
- [ ] MVP scope finalized
- [ ] Dependencies identified
- [ ] Scope is FROZEN
```

---

### Phase 4: Architecture

**Guardrail Width: MEDIUM-NARROW (30%)**

```markdown
## What's ALLOWED

✅ Designing component architecture
✅ Creating data models
✅ Defining API contracts
✅ Establishing code patterns
✅ Setting up project structure
✅ Choosing specific libraries (within stack)
✅ Writing ADRs

## What's Getting CONSTRAINED

⚠️ Patterns must be followed once established
⚠️ Data model changes require process
⚠️ API contracts are becoming binding
⚠️ New dependencies need justification

## What's NOT ALLOWED

❌ Changing tech stack
❌ Adding new features
❌ Changing acceptance criteria
❌ Major scope changes
❌ "Let's try a different framework"
❌ Introducing patterns inconsistent with established ones

## Questions to Ask (Technical)

• "How does this component interact with [other]?"
• "What's the data flow for [feature]?"
• "How do we handle [error case] architecturally?"
• "Does this pattern match our established conventions?"
• "What's the migration strategy for [data change]?"

## Decisions That CAN Change

- Implementation details
- Specific library choices (within stack)
- File organization
- Naming conventions (until established)

## Decisions That Are LOCKED

- Everything from previous phases
- Tech stack and framework
- Feature scope
- User stories and acceptance criteria

## Exit Criteria

- [ ] Architecture document complete
- [ ] Data model finalized
- [ ] API contracts defined
- [ ] Code patterns established
- [ ] ADRs written for major decisions
- [ ] Project structure created
```

---

### Phase 5: Planning

**Guardrail Width: NARROW (20%)**

```markdown
## What's ALLOWED

✅ Breaking stories into tasks
✅ Estimating hours
✅ Assigning owners
✅ Sequencing work
✅ Identifying blockers
✅ Planning sprints

## What's Getting CONSTRAINED

⚠️ Tasks must map to user stories
⚠️ Estimates are commitments
⚠️ Timeline is being locked
⚠️ Resources are being allocated

## What's NOT ALLOWED

❌ Changing scope
❌ Adding features
❌ Modifying architecture
❌ Changing tech decisions
❌ Undefined tasks
❌ "We'll estimate later"

## Questions to Ask (Precise)

• "How many hours for [specific task]?"
• "Who is responsible for [task]?"
• "What blocks [task]?"
• "When will [milestone] be complete?"
• "What's the critical path?"

## Decisions That CAN Change

- Task assignment
- Sprint allocation
- Specific hour estimates (within reason)
- Task sequencing

## Decisions That Are LOCKED

- Everything from previous phases
- Feature scope and requirements
- Architecture and patterns
- Technology choices

## Exit Criteria

- [ ] All stories broken into tasks
- [ ] All tasks estimated
- [ ] All tasks assigned
- [ ] Sprint(s) planned
- [ ] Dependencies resolved
- [ ] Timeline committed
```

---

### Phase 6+: Development to Production

**Guardrail Width: NARROWEST (10%)**

```markdown
## What's ALLOWED

✅ Implementing tasks as specified
✅ Following established patterns
✅ Writing tests per requirements
✅ Bug fixes within scope
✅ Performance optimization
✅ Minor code improvements

## What's STRICTLY CONSTRAINED

⚠️ Must follow architecture exactly
⚠️ Must match acceptance criteria exactly
⚠️ Must use established patterns
⚠️ Must stay within task scope
⚠️ Changes require change request

## What's NOT ALLOWED

❌ ANY scope changes without formal process
❌ ANY new features
❌ Deviating from architecture
❌ Creating new patterns without approval
❌ Skipping tests
❌ "Quick fixes" that bypass patterns
❌ "While I'm in here" changes

## Questions to Ask (Verification)

• "Does this match the acceptance criteria?"
• "Does this follow our established patterns?"
• "Is this within the scope of my task?"
• "Have I written tests for this?"
• "Does this need a change request?"

## Change Request Process

For ANY deviation from plan:

1. Document the requested change
2. Assess impact on timeline/scope
3. Get stakeholder approval
4. Update requirements/architecture if needed
5. Re-estimate affected work
6. Only then proceed

## Decisions That CAN Change (With Process)

- Bug fix approaches
- Minor implementation details
- Code organization (within patterns)

## Decisions That Are LOCKED

- EVERYTHING from all previous phases
- Scope, requirements, architecture
- Timeline, estimates, assignments
- Patterns, conventions, structure

## Exit Criteria (Per Phase)

Development:
- [ ] Code complete per acceptance criteria
- [ ] Tests written and passing
- [ ] Follows all patterns
- [ ] PR created with checklist

Testing:
- [ ] All test types passing
- [ ] Coverage targets met
- [ ] No critical bugs

Security:
- [ ] Audit complete
- [ ] No critical/high vulnerabilities
- [ ] Compliance verified

Deployment:
- [ ] Staging verified
- [ ] Production deployed
- [ ] Monitoring active
```

---

## Guardrail Enforcement Rules

### How to Handle Requests That Violate Guardrails

```markdown
## Response Framework

### When asked to revisit a LOCKED decision:

1. ACKNOWLEDGE the request
2. EXPLAIN what phase locked that decision
3. OFFER the change request process (if applicable)
4. REDIRECT to current phase focus

### Example Responses:

**"Can we change the tech stack?"** (During Development)
→ "The tech stack was locked in Phase 2 (Conception). 
   Changing it now would require a formal change request 
   with full impact assessment. Would you like to proceed 
   with that process, or shall we continue with the current 
   implementation?"

**"Let's add this feature"** (During Development)
→ "Feature scope was frozen in Phase 3 (Requirements). 
   This would be a great addition for V2. I'll add it 
   to the backlog. For now, let's focus on completing 
   the current sprint."

**"What if we targeted a different audience?"** (During Planning)
→ "Target audience was defined in Phase 0 (Brand Discovery) 
   and locked in Phase 2. Changing it would require revisiting 
   all subsequent decisions. Is there a specific concern about 
   the current audience that we should address?"
```

### The "10% Flex" Rule

Even at the narrowest phase, 10% flexibility remains:

```markdown
## Allowed Flexibility

✅ Implementation approach within task
✅ Variable/function naming (within conventions)
✅ Minor refactoring of own code
✅ Additional test cases
✅ Documentation improvements
✅ Performance optimizations (that don't change behavior)

## NOT Flexibility

❌ Changing what the feature does
❌ Adding features not in scope
❌ Creating new patterns
❌ Changing data models
❌ Modifying APIs
❌ Affecting other tasks
```

---

## Visual Guardrail Reference

```
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE          │ WIDTH │ CAN CHANGE          │ LOCKED              │
├─────────────────────────────────────────────────────────────────────┤
│ 0 Brand        │ 100%  │ Everything          │ Nothing             │
│ 1 Technology   │  80%  │ Stack, capabilities │ Brand, audience     │
│ 2 Conception   │  60%  │ Scope details       │ + Platform type     │
│ 3 Requirements │  40%  │ Story details       │ + Feature scope     │
│ 4 Architecture │  30%  │ Implementation      │ + Tech decisions    │
│ 5 Planning     │  20%  │ Assignments, order  │ + Architecture      │
│ 6+ Development │  10%  │ Code details only   │ + Everything else   │
└─────────────────────────────────────────────────────────────────────┘

Decision Lock Progression:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 0    Phase 1    Phase 2    Phase 3    Phase 4    Phase 5    Phase 6
   │          │          │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼          ▼          ▼
 Brand → Technology → Vision → Features → Arch → Tasks → EXECUTE
  only      +Brand    +Tech    +Scope    +Arch   +Tasks   LOCKED
```

---

## Quick Reference Card

### "Can I change...?" Decision Tree

```
Is the request about something from a PREVIOUS phase?
  │
  ├─ YES → Is it a minor clarification?
  │          │
  │          ├─ YES → Allow (document it)
  │          │
  │          └─ NO → Requires Change Request Process
  │                   1. Document change
  │                   2. Assess impact
  │                   3. Get approval
  │                   4. Update affected artifacts
  │
  └─ NO → Is it within current phase scope?
           │
           ├─ YES → Allow (within current guardrails)
           │
           └─ NO → Defer to appropriate future phase
                   or add to backlog
```

---

*This progressive guardrail system ensures creative exploration early while maintaining execution discipline later.*
*Apply at every phase transition in `DEVELOPMENT_ORCHESTRATION.md`*
