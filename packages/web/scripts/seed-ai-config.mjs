#!/usr/bin/env node
/**
 * seed-ai-config.mjs
 *
 * Seeds the ai_prompt, ai_model, and ai_agent tables with the baseline
 * configuration required for the Ops Agenda platform capabilities.
 *
 * Run: node packages/web/scripts/seed-ai-config.mjs
 * Requires DATABASE_URL or DB_* env vars (same as the app).
 */

import pg from 'pg';
const { Pool } = pg;

// ---------------------------------------------------------------------------
// Connection (reuses bootstrap.mjs pattern)
// ---------------------------------------------------------------------------

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  const { DB_HOST, DB_PORT = '5432', DB_NAME, DB_USER, DB_PASSWORD } = process.env;
  if (DB_HOST && DB_NAME && DB_USER && DB_PASSWORD) {
    const user = encodeURIComponent(DB_USER);
    const password = encodeURIComponent(DB_PASSWORD);
    connectionString = `postgresql://${user}:${password}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
  }
}

if (!connectionString) {
  console.error('ERROR: Set DATABASE_URL or DB_HOST/DB_NAME/DB_USER/DB_PASSWORD');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

// ---------------------------------------------------------------------------
// Seed Data
// ---------------------------------------------------------------------------

const MODELS = [
  {
    provider: 'anthropic',
    model_id: 'claude-sonnet-4-20250514',
    display_name: 'Claude Sonnet 4',
    context_window: '200000',
    max_output: '64000',
    cost_per_1k_input: '0.003',
    cost_per_1k_output: '0.015',
    is_default: true,
  },
  {
    provider: 'anthropic',
    model_id: 'claude-haiku-3-5-20241022',
    display_name: 'Claude 3.5 Haiku',
    context_window: '200000',
    max_output: '8192',
    cost_per_1k_input: '0.001',
    cost_per_1k_output: '0.005',
    is_default: false,
  },
  {
    provider: 'openai',
    model_id: 'gpt-4o',
    display_name: 'GPT-4o',
    context_window: '128000',
    max_output: '16384',
    cost_per_1k_input: '0.0025',
    cost_per_1k_output: '0.01',
    is_default: false,
  },
  {
    provider: 'openai',
    model_id: 'gpt-4o-mini',
    display_name: 'GPT-4o Mini',
    context_window: '128000',
    max_output: '16384',
    cost_per_1k_input: '0.00015',
    cost_per_1k_output: '0.0006',
    is_default: false,
  },
  {
    provider: 'aws_bedrock',
    model_id: 'anthropic.claude-sonnet-4-20250514-v1:0',
    display_name: 'Bedrock Claude Sonnet 4',
    context_window: '200000',
    max_output: '64000',
    cost_per_1k_input: '0.003',
    cost_per_1k_output: '0.015',
    is_default: false,
  },
  {
    provider: 'aws_bedrock',
    model_id: 'anthropic.claude-haiku-3-5-20241022-v1:0',
    display_name: 'Bedrock Claude 3.5 Haiku',
    context_window: '200000',
    max_output: '8192',
    cost_per_1k_input: '0.001',
    cost_per_1k_output: '0.005',
    is_default: false,
  },
];

const PROMPTS = [
  // ─── System Prompts ───────────────────────────────────────────────────────
  {
    slug: 'ops-orchestrator-system',
    name: 'Ops Orchestrator System Prompt',
    kind: 'system',
    version: '1.0.0',
    content: `You are the Ops Agenda Orchestrator — the central intelligence that coordinates all platform capabilities. Your role is to:

1. Understand user intent and route to the appropriate specialist agent
2. Maintain conversational context across multi-step workflows
3. Synthesize outputs from multiple agents into cohesive responses
4. Enforce platform guardrails and safety policies

You have access to the following specialist agents:
- brief-composer: Generates daily ops briefs and narrative summaries
- task-prioritizer: AI-powered task classification and prioritization
- mail-scanner: Extracts actionable items from email content
- calendar-analyst: Analyzes schedule conflicts, prep materials, focus time
- ask-responder: Handles freeform user questions about their data
- alert-monitor: Monitors for anomalies, missed deadlines, escalations

Always respond in a professional, concise tone. Default to action over explanation.
When uncertain about user intent, ask a single clarifying question rather than guessing.`,
  },
  {
    slug: 'brief-composer-system',
    name: 'Daily Brief Composer System Prompt',
    kind: 'system',
    version: '1.0.0',
    content: `You are the Brief Composer — responsible for generating the daily operational narrative that greets users each morning.

Input: A set of tasks, calendar events, and email summaries for the day.
Output: A structured brief containing:
- headline: A single-sentence summary of the day (max 80 chars)
- body: 2-3 sentences expanding on the day's shape, tone, and key focus areas
- priorities: Top 3 items needing attention with "why" reasoning
- due_outs: Items with hard deadlines today
- capacity_assessment: Open / Balanced / Tight with reasoning

Tone: Direct, motivating, professional. Like a trusted chief of staff.
Avoid: Filler words, corporate jargon, unnecessary hedging.
Length: Brief should read in under 30 seconds.`,
  },
  {
    slug: 'task-prioritizer-system',
    name: 'Task Prioritizer System Prompt',
    kind: 'system',
    version: '1.0.0',
    content: `You are the Task Prioritizer — responsible for classifying and ranking tasks by urgency and importance.

For each task, produce a classification:
- priority: p1 (critical/blocking), p2 (important/time-sensitive), p3 (normal), fysa (informational only)
- confidence: 0.0 to 1.0 indicating classification confidence
- reasoning: One sentence explaining the classification

Classification signals:
- P1: Has a hard deadline today/overdue, blocks other work, external stakeholder waiting, financial/legal impact
- P2: Due this week, important but not blocking, requires prep time, stakeholder expectation
- P3: Normal work with flexible timing, internal only, no immediate pressure
- FYSA: Informational, no action required, newsletter/update, optional attendance

Output JSON: { "priority": "p1"|"p2"|"p3"|"fysa", "confidence": 0.0-1.0, "reasoning": "..." }`,
  },
  {
    slug: 'mail-scanner-system',
    name: 'Mail Scanner System Prompt',
    kind: 'system',
    version: '1.0.0',
    content: `You are the Mail Scanner — responsible for extracting actionable intelligence from email messages.

For each email, extract:
- action_required: boolean — does this email require the user to DO something?
- action_summary: Brief description of what's needed (null if no action)
- deadline: ISO date if a deadline is mentioned (null otherwise)
- priority_signal: "urgent" | "normal" | "low" based on content/sender
- category: "meeting_request" | "approval_needed" | "information" | "task_assignment" | "follow_up" | "newsletter" | "personal"
- suggested_task_title: If action_required, a concise task title (max 100 chars)

Rules:
- Never store or output email body content verbatim
- Focus on metadata and actionable signals only
- Flag anything from leadership or external clients as higher priority
- Newsletters and automated notifications are almost always "information" with no action`,
  },
  {
    slug: 'calendar-analyst-system',
    name: 'Calendar Analyst System Prompt',
    kind: 'system',
    version: '1.0.0',
    content: `You are the Calendar Analyst — responsible for analyzing meeting schedules and suggesting focus time.

Capabilities:
1. Conflict detection: Identify overlapping meetings
2. Prep materials: Given meeting context, suggest what to prepare
3. Focus block suggestions: Find gaps of 30+ minutes for deep work
4. Meeting load assessment: Rate the day's meeting density (light/moderate/heavy)
5. Time allocation: Estimate how much of the day is committed vs. available

Output format varies by request type. Always include:
- A one-line summary
- Actionable suggestions (max 3)
- Any conflicts or risks

Tone: Efficient, practical. Like a good executive assistant.`,
  },
  {
    slug: 'ask-responder-system',
    name: 'Ask Responder System Prompt',
    kind: 'system',
    version: '1.0.0',
    content: `You are the Ask Responder — the freeform Q&A interface for Ops Agenda users.

You can answer questions about:
- Their tasks (status, priorities, due dates, history)
- Their schedule (meetings today/this week, availability)
- Their workload (capacity, trends, completion rates)
- Platform features (how to use Ops Agenda)
- General productivity advice

Rules:
- Only reference data the user has access to (their account)
- Never fabricate task names, dates, or meeting details
- If you don't have data to answer, say so clearly
- Suggest relevant actions the user can take
- Keep responses concise — users are busy professionals

When answering about tasks, include the task title and current status.
When answering about schedule, include times in the user's timezone.`,
  },
  {
    slug: 'alert-monitor-system',
    name: 'Alert Monitor System Prompt',
    kind: 'system',
    version: '1.0.0',
    content: `You are the Alert Monitor — responsible for detecting situations that need user attention.

Alert triggers:
- Overdue tasks (past due_on date with status != handled)
- At-risk items (flag_state = 'at_risk')
- Missed deadlines in the past 24 hours
- Unusual patterns (task backlog growing, completion rate dropping)
- Calendar conflicts detected
- Important emails unanswered for >24 hours

Alert severity:
- critical: Requires immediate attention (overdue client deliverable, double-booked with VIP)
- warning: Should address today (approaching deadline, growing backlog)
- info: Awareness only (trend change, FYI)

Output: { "severity": "critical"|"warning"|"info", "title": "...", "body": "...", "suggested_action": "..." }`,
  },

  // ─── Guardrails ───────────────────────────────────────────────────────────
  {
    slug: 'data-privacy-guardrail',
    name: 'Data Privacy Guardrail',
    kind: 'guardrail',
    version: '1.0.0',
    content: `GUARDRAIL: Data Privacy and Tenant Isolation

NEVER:
- Return data from one tenant account to another
- Store or log raw email body content
- Output API keys, tokens, or credentials in responses
- Reference specific people by name in cross-tenant contexts
- Persist PII in AI usage logs

ALWAYS:
- Verify account_id context before returning any user data
- Redact email addresses in AI processing logs
- Use anonymized references when discussing patterns across accounts
- Respect the user's data retention preferences
- Audit-log any cross-account data access attempts

If a request would violate these rules, refuse politely and explain why.`,
  },
  {
    slug: 'output-safety-guardrail',
    name: 'Output Safety Guardrail',
    kind: 'guardrail',
    version: '1.0.0',
    content: `GUARDRAIL: Output Quality and Safety

CONTENT RULES:
- Never generate harmful, discriminatory, or inappropriate content
- Never provide medical, legal, or financial advice
- Never impersonate real people or organizations
- Never generate content that could be used for phishing or social engineering

FORMAT RULES:
- Responses must be valid JSON when JSON is requested
- Task titles must be ≤100 characters
- Brief headlines must be ≤80 characters
- Confidence scores must be between 0.0 and 1.0
- Dates must be ISO 8601 format

HALLUCINATION PREVENTION:
- Only reference data explicitly provided in context
- If asked about data not in context, state "I don't have that information"
- Never invent task names, meeting titles, or email subjects
- When uncertain, express uncertainty with confidence scores`,
  },
  {
    slug: 'rate-limiting-guardrail',
    name: 'Rate Limiting Guardrail',
    kind: 'guardrail',
    version: '1.0.0',
    content: `GUARDRAIL: Token Budget and Rate Limiting

PER-REQUEST LIMITS:
- Input context: Max 50,000 tokens (truncate oldest items first)
- Output: Max 4,000 tokens for standard responses
- Brief generation: Max 2,000 tokens output
- Task classification: Max 500 tokens output per task

PER-USER DAILY LIMITS:
- Ask questions: 50 requests/day (trial), 200 (starter), unlimited (pro/enterprise)
- Brief regeneration: 5/day
- Batch classification: 100 tasks/day (trial), 500 (starter), unlimited (pro/enterprise)

COST OPTIMIZATION:
- Use Haiku for simple classification tasks
- Use Sonnet for narrative generation and complex reasoning
- Cache repeated prompts (same input = same output within 5 minutes)
- Batch small tasks into single requests where possible

When limits are reached, respond with a clear message and reset time.`,
  },

  // ─── Templates ────────────────────────────────────────────────────────────
  {
    slug: 'task-classification-template',
    name: 'Task Classification Template',
    kind: 'template',
    version: '1.0.0',
    content: `Classify the following task. Consider the title, description, due date, and current date.

Task:
- Title: {{title}}
- Description: {{description}}
- Due: {{due_on}}
- Created: {{created_at}}
- Current date: {{now}}

Respond with JSON only:
{
  "priority": "p1" | "p2" | "p3" | "fysa",
  "confidence": 0.0-1.0,
  "reasoning": "one sentence explanation"
}`,
  },
  {
    slug: 'email-extraction-template',
    name: 'Email Action Extraction Template',
    kind: 'template',
    version: '1.0.0',
    content: `Extract actionable information from this email metadata.

From: {{from}}
Subject: {{subject}}
Date: {{date}}
Snippet: {{snippet}}

Respond with JSON only:
{
  "action_required": true/false,
  "action_summary": "..." or null,
  "deadline": "YYYY-MM-DD" or null,
  "priority_signal": "urgent" | "normal" | "low",
  "category": "meeting_request" | "approval_needed" | "information" | "task_assignment" | "follow_up" | "newsletter" | "personal",
  "suggested_task_title": "..." or null
}`,
  },
  {
    slug: 'daily-brief-template',
    name: 'Daily Brief Generation Template',
    kind: 'template',
    version: '1.0.0',
    content: `Generate today's operational brief for {{user_name}}.

Date: {{date}}
Timezone: {{timezone}}

Tasks ({{task_count}} total, {{open_count}} open):
{{#tasks}}
- [{{priority}}] {{title}} | Due: {{due_on}} | Flag: {{flag_state}}
{{/tasks}}

Meetings today ({{meeting_count}}):
{{#meetings}}
- {{time}}: {{title}} ({{duration}}min)
{{/meetings}}

Respond with JSON:
{
  "headline": "max 80 chars summarizing the day",
  "body": "2-3 sentences on day shape and focus",
  "capacity": "Open" | "Balanced" | "Tight",
  "top_priority_ids": ["task_id_1", "task_id_2", "task_id_3"],
  "suggested_focus_blocks": [{"start": "HH:MM", "end": "HH:MM", "suggestion": "..."}]
}`,
  },

  // ─── Few-shot Examples ────────────────────────────────────────────────────
  {
    slug: 'classification-few-shot',
    name: 'Task Classification Few-Shot Examples',
    kind: 'few_shot',
    version: '1.0.0',
    content: `Example 1:
Task: "Submit Q3 board deck" | Due: today | Description: "Final version needed for investor meeting tomorrow"
→ {"priority": "p1", "confidence": 0.95, "reasoning": "Hard deadline today with external stakeholder impact"}

Example 2:
Task: "Update team wiki" | Due: next Friday | Description: "Add onboarding docs for new hire starting next month"
→ {"priority": "p3", "confidence": 0.85, "reasoning": "Internal task with flexible timeline, no immediate pressure"}

Example 3:
Task: "Review PR #247" | Due: none | Description: "Junior dev's first PR, they're blocked until review"
→ {"priority": "p2", "confidence": 0.80, "reasoning": "Blocking a teammate but no hard external deadline"}

Example 4:
Task: "Industry newsletter recap" | Due: none | Description: "Weekly roundup from TechCrunch digest"
→ {"priority": "fysa", "confidence": 0.92, "reasoning": "Informational only, no action required"}`,
  },
];

const AGENTS = [
  // ─── Primary Orchestrator ─────────────────────────────────────────────────
  {
    slug: 'ops-orchestrator',
    name: 'Ops Orchestrator',
    type: 'agent',
    description: 'Central intelligence that routes requests, coordinates sub-agents, and synthesizes multi-step workflows into cohesive responses.',
    config: { temperature: 0.3, max_tokens: 4096, tools: ['route', 'synthesize', 'delegate'] },
  },

  // ─── Specialist Agents ────────────────────────────────────────────────────
  {
    slug: 'brief-composer',
    name: 'Brief Composer',
    type: 'agent',
    description: 'Generates the daily operational narrative — headline, body, priorities, capacity assessment. Runs every morning on schedule.',
    config: { temperature: 0.7, max_tokens: 2048, schedule: 'daily_0600_user_tz' },
  },
  {
    slug: 'task-prioritizer',
    name: 'Task Prioritizer',
    type: 'agent',
    description: 'Classifies tasks into P1/P2/P3/FYSA with confidence scores. Triggers on task create, daily re-rank, and manual request.',
    config: { temperature: 0.1, max_tokens: 512, batch_size: 20 },
  },
  {
    slug: 'mail-scanner',
    name: 'Mail Scanner',
    type: 'agent',
    description: 'Scans incoming email metadata to extract action items, deadlines, and priority signals. Creates suggested tasks.',
    config: { temperature: 0.2, max_tokens: 1024, trigger: 'on_sync' },
  },
  {
    slug: 'calendar-analyst',
    name: 'Calendar Analyst',
    type: 'agent',
    description: 'Analyzes meeting schedules — detects conflicts, suggests prep, finds focus blocks, and assesses meeting load.',
    config: { temperature: 0.3, max_tokens: 1024, trigger: 'on_sync' },
  },
  {
    slug: 'ask-responder',
    name: 'Ask Responder',
    type: 'agent',
    description: 'Handles freeform user questions via the /ask interface. Searches tasks, schedule, and workload data to answer.',
    config: { temperature: 0.5, max_tokens: 4096, trigger: 'user_message' },
  },
  {
    slug: 'alert-monitor',
    name: 'Alert Monitor',
    type: 'agent',
    description: 'Background agent that detects overdue tasks, at-risk items, missed deadlines, and anomalous patterns. Fires alerts.',
    config: { temperature: 0.1, max_tokens: 512, schedule: 'every_30min' },
  },

  // ─── Sub-agents ───────────────────────────────────────────────────────────
  {
    slug: 'context-assembler',
    name: 'Context Assembler',
    type: 'subagent',
    description: 'Gathers and formats task, calendar, and email data into structured context windows for other agents.',
    config: { max_context_tokens: 50000 },
    parent_slug: 'ops-orchestrator',
  },
  {
    slug: 'output-formatter',
    name: 'Output Formatter',
    type: 'subagent',
    description: 'Validates and formats agent outputs — ensures JSON schema compliance, token limits, and guardrail adherence.',
    config: { strict_json: true },
    parent_slug: 'ops-orchestrator',
  },
  {
    slug: 'task-batch-classifier',
    name: 'Task Batch Classifier',
    type: 'subagent',
    description: 'Handles batch classification of multiple tasks in a single LLM call for cost efficiency.',
    config: { batch_size: 20, temperature: 0.1 },
    parent_slug: 'task-prioritizer',
  },
  {
    slug: 'email-thread-analyzer',
    name: 'Email Thread Analyzer',
    type: 'subagent',
    description: 'Analyzes email thread patterns to detect follow-ups needed, stale conversations, and escalation signals.',
    config: { temperature: 0.2 },
    parent_slug: 'mail-scanner',
  },

  // ─── Skills ───────────────────────────────────────────────────────────────
  {
    slug: 'task-search',
    name: 'Task Search',
    type: 'skill',
    description: 'Searches user tasks by title, status, priority, flag state, and date range. Used by ask-responder and orchestrator.',
    config: { tool_type: 'function', parameters: ['query', 'status', 'priority', 'date_range'] },
  },
  {
    slug: 'calendar-lookup',
    name: 'Calendar Lookup',
    type: 'skill',
    description: 'Retrieves calendar events for a date range. Returns meeting title, time, duration, attendees.',
    config: { tool_type: 'function', parameters: ['start_date', 'end_date', 'include_attendees'] },
  },
  {
    slug: 'email-metadata-search',
    name: 'Email Metadata Search',
    type: 'skill',
    description: 'Searches email metadata (from, subject, date) without accessing bodies. Used for follow-up detection.',
    config: { tool_type: 'function', parameters: ['query', 'from', 'date_range', 'has_action'] },
  },
  {
    slug: 'task-create',
    name: 'Task Create',
    type: 'skill',
    description: 'Creates a new task in the user\'s account. Used by mail-scanner and ask-responder when suggesting actions.',
    config: { tool_type: 'function', parameters: ['title', 'description', 'priority', 'due_on'] },
  },
  {
    slug: 'notification-send',
    name: 'Notification Send',
    type: 'skill',
    description: 'Sends push/email notifications to the user. Used by alert-monitor for critical alerts.',
    config: { tool_type: 'function', parameters: ['channel', 'severity', 'title', 'body'] },
  },
  {
    slug: 'workload-stats',
    name: 'Workload Statistics',
    type: 'skill',
    description: 'Computes workload metrics — open task count, completion rate, avg time to close, backlog trend.',
    config: { tool_type: 'function', parameters: ['period', 'account_id', 'user_id'] },
  },
  {
    slug: 'focus-time-finder',
    name: 'Focus Time Finder',
    type: 'skill',
    description: 'Analyzes calendar gaps to find blocks of uninterrupted time ≥30 minutes for deep work.',
    config: { tool_type: 'function', parameters: ['date', 'min_duration_minutes'] },
  },
  {
    slug: 'priority-explainer',
    name: 'Priority Explainer',
    type: 'skill',
    description: 'Generates human-readable explanations for why a task was classified at a given priority level.',
    config: { tool_type: 'function', parameters: ['task_id', 'classification'] },
  },
];

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert models
    console.log(`Seeding ${MODELS.length} models...`);
    for (const m of MODELS) {
      await client.query(
        `INSERT INTO ai_model (provider, model_id, display_name, context_window, max_output, cost_per_1k_input, cost_per_1k_output, is_default, enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         ON CONFLICT (provider, model_id) DO UPDATE SET
           display_name = EXCLUDED.display_name,
           context_window = EXCLUDED.context_window,
           max_output = EXCLUDED.max_output,
           cost_per_1k_input = EXCLUDED.cost_per_1k_input,
           cost_per_1k_output = EXCLUDED.cost_per_1k_output,
           is_default = EXCLUDED.is_default,
           updated_at = now()`,
        [m.provider, m.model_id, m.display_name, m.context_window, m.max_output, m.cost_per_1k_input, m.cost_per_1k_output, m.is_default]
      );
    }

    // Insert prompts
    console.log(`Seeding ${PROMPTS.length} prompts...`);
    for (const p of PROMPTS) {
      await client.query(
        `INSERT INTO ai_prompt (slug, name, kind, version, content, enabled)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (slug, version) DO UPDATE SET
           name = EXCLUDED.name,
           kind = EXCLUDED.kind,
           content = EXCLUDED.content,
           updated_at = now()`,
        [p.slug, p.name, p.kind, p.version, p.content]
      );
    }

    // Insert agents (need to resolve parent_slug → parent_id)
    console.log(`Seeding ${AGENTS.length} agents...`);
    for (const a of AGENTS) {
      let parentId = null;
      if (a.parent_slug) {
        const res = await client.query('SELECT id FROM ai_agent WHERE slug = $1', [a.parent_slug]);
        parentId = res.rows[0]?.id ?? null;
      }

      // Resolve system prompt ID
      const promptSlug = `${a.slug}-system`;
      const promptRes = await client.query('SELECT id FROM ai_prompt WHERE slug = $1', [promptSlug]);
      const systemPromptId = promptRes.rows[0]?.id ?? null;

      await client.query(
        `INSERT INTO ai_agent (slug, name, type, description, system_prompt_id, config, parent_agent_id, enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           type = EXCLUDED.type,
           description = EXCLUDED.description,
           system_prompt_id = EXCLUDED.system_prompt_id,
           config = EXCLUDED.config,
           parent_agent_id = EXCLUDED.parent_agent_id,
           updated_at = now()`,
        [a.slug, a.name, a.type, a.description, systemPromptId, JSON.stringify(a.config), parentId]
      );
    }

    await client.query('COMMIT');
    console.log('\n✓ Seed complete!');
    console.log(`  ${MODELS.length} models`);
    console.log(`  ${PROMPTS.length} prompts`);
    console.log(`  ${AGENTS.length} agents/subagents/skills`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
