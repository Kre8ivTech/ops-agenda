'use server';

import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { createDb, withTenant } from '@/lib/db';
import { calendarEvent } from '@/lib/db/schema';
import { env } from '@/lib/env';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDb() {
  return createDb(env.DATABASE_URL);
}

async function requireTenant() {
  const session = await getSession();
  if (!session?.accountId || !session.userId) {
    throw new Error('Your session is not linked to a tenant account');
  }
  return { accountId: session.accountId, userId: session.userId };
}

// ---------------------------------------------------------------------------
// listCalendarEvents
// ---------------------------------------------------------------------------

export interface CalendarEventRow {
  id: string;
  title: string;
  location: string | null;
  startAt: Date;
  endAt: Date;
  isAllDay: boolean;
  organizer: string | null;
  attendeeCount: string | null;
  responseStatus: string | null;
  calendarName: string | null;
  calendarColor: string | null;
  prepSuggestion: string | null;
  hasConflict: boolean;
  conflictWith: string | null;
  webLink: string | null;
}

export async function listCalendarEvents(params: {
  startDate: string;
  endDate: string;
  view?: 'day' | 'week';
}): Promise<CalendarEventRow[]> {
  const tenant = await requireTenant();
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const rows = await tx
      .select({
        id: calendarEvent.id,
        title: calendarEvent.title,
        location: calendarEvent.location,
        startAt: calendarEvent.startAt,
        endAt: calendarEvent.endAt,
        isAllDay: calendarEvent.isAllDay,
        organizer: calendarEvent.organizer,
        attendeeCount: calendarEvent.attendeeCount,
        responseStatus: calendarEvent.responseStatus,
        calendarName: calendarEvent.calendarName,
        calendarColor: calendarEvent.calendarColor,
        prepSuggestion: calendarEvent.prepSuggestion,
        hasConflict: calendarEvent.hasConflict,
        conflictWith: calendarEvent.conflictWith,
        webLink: calendarEvent.webLink,
      })
      .from(calendarEvent)
      .where(
        and(
          eq(calendarEvent.accountId, tenant.accountId),
          gte(calendarEvent.startAt, new Date(params.startDate)),
          lte(calendarEvent.startAt, new Date(params.endDate)),
        ),
      )
      .orderBy(calendarEvent.startAt);

    return rows;
  });
}

// ---------------------------------------------------------------------------
// getCalendarMetrics
// ---------------------------------------------------------------------------

export interface CalendarMetrics {
  totalEvents: number;
  conflicts: number;
  allDay: number;
  withPrep: number;
}

export async function getCalendarMetrics(params: {
  startDate: string;
  endDate: string;
}): Promise<CalendarMetrics> {
  const tenant = await requireTenant();
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const [metrics] = await tx
      .select({
        totalEvents: sql<number>`count(*)`.mapWith(Number),
        conflicts:
          sql<number>`count(*) filter (where ${calendarEvent.hasConflict} = true)`.mapWith(Number),
        allDay:
          sql<number>`count(*) filter (where ${calendarEvent.isAllDay} = true)`.mapWith(Number),
        withPrep:
          sql<number>`count(*) filter (where ${calendarEvent.prepSuggestion} is not null)`.mapWith(
            Number,
          ),
      })
      .from(calendarEvent)
      .where(
        and(
          eq(calendarEvent.accountId, tenant.accountId),
          gte(calendarEvent.startAt, new Date(params.startDate)),
          lte(calendarEvent.startAt, new Date(params.endDate)),
        ),
      );

    return metrics ?? { totalEvents: 0, conflicts: 0, allDay: 0, withPrep: 0 };
  });
}

// ---------------------------------------------------------------------------
// detectConflicts
// ---------------------------------------------------------------------------

/**
 * Detects overlapping events in a date range and updates the `hasConflict`
 * and `conflictWith` fields. Two events conflict when one starts before
 * the other ends and vice-versa (excluding all-day events).
 */
export async function detectConflicts(params: {
  startDate: string;
  endDate: string;
}): Promise<{ updated: number }> {
  const tenant = await requireTenant();
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    // First, reset conflicts in the date range
    await tx
      .update(calendarEvent)
      .set({ hasConflict: false, conflictWith: null, updatedAt: new Date() })
      .where(
        and(
          eq(calendarEvent.accountId, tenant.accountId),
          gte(calendarEvent.startAt, new Date(params.startDate)),
          lte(calendarEvent.startAt, new Date(params.endDate)),
        ),
      );

    // Find overlapping non-all-day events using a self-join
    const conflicts = await tx.execute(sql`
      UPDATE calendar_event AS a
      SET has_conflict = true,
          conflict_with = b.id,
          updated_at = now()
      FROM calendar_event AS b
      WHERE a.account_id = ${tenant.accountId}
        AND b.account_id = ${tenant.accountId}
        AND a.id != b.id
        AND a.is_all_day = false
        AND b.is_all_day = false
        AND a.start_at >= ${new Date(params.startDate)}::timestamptz
        AND a.start_at <= ${new Date(params.endDate)}::timestamptz
        AND a.start_at < b.end_at
        AND a.end_at > b.start_at
    `);

    return { updated: conflicts.rowCount ?? 0 };
  });
}
