/**
 * lib/ai/focus-blocks.ts — AI pipeline that suggests focus block slots to protect.
 *
 * Analyzes the user's existing schedule and workload to recommend optimal
 * deep-work time blocks for the upcoming week.
 */

import { complete } from './client';
import { logUsage } from './usage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FocusBlockSuggestion {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM (24h)
  endTime: string; // HH:MM (24h)
  reason: string; // 1-sentence explanation
  priority: 'high' | 'medium' | 'low'; // how important protecting this block is
}

// ---------------------------------------------------------------------------
// Main — suggest focus blocks for the week
// ---------------------------------------------------------------------------

/**
 * Suggests 2-4 focus block slots to protect based on existing schedule,
 * workload, and best-practice heuristics (morning deep work, recovery blocks).
 */
export async function suggestFocusBlocks(
  tenant: { accountId: string; userId: string },
  context: {
    weekStart: string; // YYYY-MM-DD
    existingEvents: { title: string; date: string; startTime: string; endTime: string }[];
    taskCount: number; // how many open tasks
    unbookedHours: number; // hours free this week
  },
): Promise<FocusBlockSuggestion[]> {
  const eventList = context.existingEvents
    .map(
      (e, i) =>
        `${i + 1}. "${e.title}" on ${e.date} from ${e.startTime} to ${e.endTime}`,
    )
    .join('\n');

  const userMessage = `You are a productivity advisor. Suggest focus block slots to protect for deep work this week.

Week starting: ${context.weekStart}
Open tasks: ${context.taskCount}
Unbooked hours this week: ${context.unbookedHours}

Existing calendar events:
${eventList || '(no events scheduled)'}

Rules:
- Suggest 2-4 focus blocks (more if task count is high, fewer if schedule is already packed)
- Prefer morning slots (09:00-11:00) for deep work
- Prefer slots the day after heavy meeting days for recovery
- Never suggest blocks shorter than 60 minutes
- Avoid overlapping with existing events
- Each block should have a 1-sentence reason explaining why it's valuable

Respond with a JSON array of objects:
[
  {
    "date": "YYYY-MM-DD",
    "startTime": "HH:MM",
    "endTime": "HH:MM",
    "reason": "1-sentence explanation",
    "priority": "high" | "medium" | "low"
  }
]

Only return the JSON array, no other text.`;

  try {
    const response = await complete({
      agentSlug: 'focus-block-advisor',
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.3,
      maxTokens: 1024,
    });

    logUsage(response, { accountId: tenant.accountId, userId: tenant.userId });

    // Parse response
    const text = response.content.trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed: unknown[] = JSON.parse(jsonMatch[0]);

    // Validate and filter results
    const suggestions: FocusBlockSuggestion[] = parsed
      .filter(isValidSuggestion)
      .filter((s) => {
        // Enforce minimum 60-minute duration
        const [startH, startM] = s.startTime.split(':').map(Number);
        const [endH, endM] = s.endTime.split(':').map(Number);
        const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        return durationMinutes >= 60;
      })
      .slice(0, 4); // Cap at 4 suggestions max

    return suggestions;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ai/focus-blocks]', err instanceof Error ? err.message : err);
    }
    return [];
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isValidSuggestion(value: unknown): value is FocusBlockSuggestion {
  if (typeof value !== 'object' || value === null) return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(obj.date) &&
    typeof obj.startTime === 'string' &&
    /^\d{2}:\d{2}$/.test(obj.startTime) &&
    typeof obj.endTime === 'string' &&
    /^\d{2}:\d{2}$/.test(obj.endTime) &&
    typeof obj.reason === 'string' &&
    obj.reason.length > 0 &&
    (obj.priority === 'high' || obj.priority === 'medium' || obj.priority === 'low')
  );
}
