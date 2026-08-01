/**
 * lib/ai/brief.ts — AI-powered daily brief narrative generation.
 *
 * Generates the headline and body narrative for the dashboard.
 */

import type { TaskSelect } from '@/lib/db/schema';
import { complete } from './client';
import { logUsage } from './usage';

export interface AiBriefResult {
  headline: string;
  body: string;
  capacity: 'Open' | 'Balanced' | 'Tight';
  suggestedFocusBlocks: { start: string; end: string; suggestion: string }[];
}

type BriefTask = Pick<TaskSelect, 'id' | 'title' | 'priority' | 'dueOn' | 'flagState' | 'status' | 'handledAt'>;

/**
 * Generate an AI-powered daily brief narrative.
 * Falls back to null if AI is unavailable.
 */
export async function generateBrief(input: {
  userName: string;
  timezone: string;
  tasks: BriefTask[];
  date?: Date;
  accountId?: string;
  userId?: string;
}): Promise<AiBriefResult | null> {
  try {
    const now = input.date ?? new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const openTasks = input.tasks.filter((t) => t.status === 'open' && !t.handledAt);
    const totalTasks = input.tasks.length;

    const taskLines = openTasks
      .slice(0, 15) // Limit context size
      .map((t) => {
        const due = t.dueOn ? t.dueOn.toISOString().split('T')[0] : 'no deadline';
        return `- [${t.priority.toUpperCase()}] ${t.title} | Due: ${due} | Flag: ${t.flagState}`;
      })
      .join('\n');

    const userMessage = `Generate today's operational brief for ${input.userName}.

Date: ${dateStr}
Timezone: ${input.timezone}

Tasks (${totalTasks} total, ${openTasks.length} open):
${taskLines || '(no open tasks)'}

Respond with JSON only:
{
  "headline": "max 80 chars summarizing the day",
  "body": "2-3 sentences on day shape and focus areas",
  "capacity": "Open" | "Balanced" | "Tight",
  "suggested_focus_blocks": [{"start": "HH:MM", "end": "HH:MM", "suggestion": "..."}]
}`;

    const response = await complete({
      agentSlug: 'brief-composer',
      messages: [{ role: 'user', content: userMessage }],
      guardrails: ['output-safety-guardrail', 'data-privacy-guardrail'],
      temperature: 0.7,
      maxTokens: 1024,
    });

    // Log usage
    logUsage(response, { accountId: input.accountId, userId: input.userId });

    // Parse JSON
    const text = response.content.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      headline: String(parsed.headline ?? '').slice(0, 80),
      body: String(parsed.body ?? '').slice(0, 500),
      capacity: ['Open', 'Balanced', 'Tight'].includes(parsed.capacity) ? parsed.capacity : 'Balanced',
      suggestedFocusBlocks: Array.isArray(parsed.suggested_focus_blocks)
        ? parsed.suggested_focus_blocks.slice(0, 3).map((b: Record<string, string>) => ({
            start: String(b.start ?? ''),
            end: String(b.end ?? ''),
            suggestion: String(b.suggestion ?? ''),
          }))
        : [],
    };
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ai/brief] Brief generation failed:', err instanceof Error ? err.message : err);
    }
    return null;
  }
}
