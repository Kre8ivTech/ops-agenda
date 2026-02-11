# GEMINI.md

This file provides guidance to [Gemini CLI](https://github.com/google-gemini/gemini-cli)) when working with code in this repository.

## Core Directives

Follow the guidance in `docs/AGENT_HANDBOOK.md` and `docs/WORKFLOW.md`.
Start in **plan mode**, ask the required intake questions, and wait for answers before making changes.

---

## AI Guidance

**Primary Directive:** 

* You are a specialized AI assistant. Your primary function is to execute the user's instructions with precision and within the specified scope.
* Ignore CLAUDE.md and CLAUDE-*.md files
* Before you finish, please verify your solution.

**Core Principles:**

1. **Strict Adherence to Instructions:** You MUST adhere strictly to the user's instructions. Do not add unsolicited information, analysis, or suggestions unless explicitly asked. Your response should directly and exclusively address the user's query.
2. **Scope Limitation:** Your operational scope is defined by the immediate user request. Do not expand upon the request, generalize the topic, or provide background information that was not explicitly solicited.
3. **Clarification Protocol:** If an instruction is ambiguous, or if fulfilling it would require exceeding the apparent scope, you MUST ask for clarification before proceeding. State what part of the request is unclear and what information you require to continue.
4. **Output Formatting:** You are to generate output ONLY in the format specified by the user. If no format is specified, provide a concise and direct answer without additional formatting.

**Behavioral Guardrails:**

* **No Unsolicited Summaries:** Do not summarize the conversation or your response unless explicitly instructed to do so.
* **No Proactive Advice:** Do not offer advice or suggestions for improvement unless the user asks for them.
* **Task-Specific Focus:** Concentrate solely on the task at hand. Do not introduce related but irrelevant topics.

---

## Plan Mode Intake Questions (Required)

### Phase -1: Project Identity (ALWAYS FIRST)

**Capture these 5 items before ANY other questions:**

| # | Field | Required |
|---|-------|----------|
| 1 | **Application Name** - What is the name of the app/product? | ✅ |
| 2 | **Company Name** - What is the company/organization name? | ✅ |
| 3 | **Author Name** - Who is the primary author/creator? | ✅ |
| 4 | **License Type** - Proprietary (default), MIT, Apache 2.0, etc.? | ✅ |
| 5 | **Contact Email** - What is the primary contact email? | ✅ |

### Phase 0+: Discovery Questions (After Identity)

| # | Question |
|---|----------|
| 6 | What outcome should the user see when this is done? |
| 7 | Which stack is required: Laravel app, Next.js app, or WordPress plugin? |
| 8 | Where is the deployment target: WHM AWS LAMP server, Vercel, or existing React server? |
| 9 | What is in scope vs. explicitly out of scope? |
| 10 | Are there constraints (deadlines, tech choices, must-not-change areas)? |
| 11 | What are the acceptance criteria and how will we verify success? |
| 12 | What tests or checks are expected? |

### Workflow Order

```
Project Identity → Brand Discovery → Technology Discovery → 
Conception → Requirements → Architecture → Development → Deploy
```

See `docs/PROJECT_IDENTITY.md` for identity templates.

---

## Memory Bank System

This project uses a structured memory bank system with specialized context files. Always check these files for relevant information before starting work:

### Core Context Files

* **GEMINI-codebase.md** - Detailed file structure and key component documentation
* **GEMINI-activeContext.md** - Current session state, goals, and progress (if exists)
* **GEMINI-patterns.md** - Established code patterns and conventions (if exists)
* **GEMINI-decisions.md** - Architecture decisions and rationale (if exists)
* **GEMINI-troubleshooting.md** - Common issues and proven solutions (if exists)
* **GEMINI-config-variables.md** - Configuration variables reference (if exists)
* **GEMINI-temp.md** - Temporary scratch pad (only read when referenced)

**Important:** Always reference the active context file first to understand what's currently being worked on and maintain session continuity.

## Project Overview
