/**
 * lib/ai/calendar-prep.ts — AI-powered meeting prep suggestions.
 * Generates short, actionable prep suggestions for upcoming calendar events.
 */

import { eq, inArray } from 'drizzle-orm';
import { createDb, withTenant } from '@/lib/db';
import { calendarEvent } from '@/lib/db/schema';
import type { CalendarEventSelect } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { complete } from './client';
import { logUsage } from './usage';

// ---------------------------------------------------------------------------
// Helper — determine whether an event warrants prep
// ---------------------------------------------------------------------------

const SKIP_TITLES = ['lunch', 'focus time'];

/**
 * Returns true for events where meeting prep makes sense.
 * Skips all-day events, events with ≤1 attendee, and events titled
 * "Lunch" or "Focus time" (case-insensitive).
 */
export function shouldGeneratePrep(event: CalendarEventSelect): boolean {
  if (event.isAllDay) return false;

  const attendees = Number(event.attendeeCount) || 0;
  if (attendees <= 1) return false;

  const titleLower = (event.title ?? '').toLowerCase().trim();
  if (SKIP_TITLES.includes(titleLower)) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Main — generate prep suggestions for a batch of events
// ---------------------------------------------------------------------------

/**
 * Takes a batch of calendar event IDs, generates AI-powered prep suggestions
 * for each, and updates `calendarEvent.prepSuggestion` in the database.
 */
export async function generatePrepSuggestions(
  tenant: { accountId: string; userId: string },
  eventIds: string[],
): Promise<void> {
  if (eventIds.length === 0) return;

  const db = createDb(env.DATABASE_URL);

  const events = await withTenant(db, tenant, async (tx) =>
    tx
      .select()
      .from(calendarEvent)
      .where(inArray(calendarEvent.id, eventIds)),
  );

  const toPrep = events.filter(shouldGeneratePrep);
  if (toPrep.length === 0) return;

  // Build context for the AI
  const eventDescriptions = toPrep
    .map((e, i) => {
      const duration = Math.round(
        (e.endAt.getTime() - e.startAt.getTime()) / (1000 * 60),
      );
      const attendees = e.attendeeCount ?? '?';
      const organizer = e.organizer ?? 'unknown';
      const location = e.location ?? 'none';
      // No recurring field on schema — omit from prompt
      return `${i + 1}. Title: "${e.title}" | Duration: ${duration}min | Attendees: ${attendees} | Organizer: ${organizer} | Location: ${location}`;
    })
    .join('\n');

  const userMessage = `Generate a short (1-2 sentence) actionable meeting prep suggestion for each of these ${toPrep.length} calendar events.

${eventDescriptions}

Consider:
- What materials or updates the user should prepare
- Whether it's a large group (status update) vs small 1:1
- Whether the title implies a recurring standup/check-in

Respond with a JSON array — one string per event, in order:
["suggestion 1", "suggestion 2", ...]

Keep each suggestion concise and action-oriented.`;

  try {
    const response = await complete({
      agentSlug: 'meeting-prep',
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.3,
      maxTokens: 1024,
    });

    logUsage(response, { accountId: tenant.accountId, userId: tenant.userId });

    // Parse response
    const text = response.content.trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return;

    const suggestions: string[] = JSON.parse(jsonMatch[0]);

    // Update each event
    await withTenant(db, tenant, async (tx) => {
      for (let i = 0; i < Math.min(suggestions.length, toPrep.length); i++) {
        const suggestion = suggestions[i];
        const event = toPrep[i];
        await tx
          .update(calendarEvent)
          .set({
            prepSuggestion: suggestion,
            updatedAt: new Date(),
          })
          .where(eq(calendarEvent.id, event.id));
      }
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ai/calendar-prep]', err instanceof Error ? err.message : err);
    }
  }
}
