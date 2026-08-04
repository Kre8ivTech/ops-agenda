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
// listCalendarEventsWeek
// ---------------------------------------------------------------------------

/**
 * Returns events for a full work week (Mon-Fri) given a date range.
 * Same query pattern as listCalendarEvents but specifically for weekly views.
 */
export async function listCalendarEventsWeek(
  startOfWeek: string,
  endOfWeek: string,
): Promise<CalendarEventRow[]> {
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
          gte(calendarEvent.startAt, new Date(startOfWeek)),
          lte(calendarEvent.startAt, new Date(endOfWeek)),
        ),
      )
      .orderBy(calendarEvent.startAt);

    return rows;
  });
}

// ---------------------------------------------------------------------------
// getWeekSummary
// ---------------------------------------------------------------------------

export interface DaySummary {
  date: string; // YYYY-MM-DD
  dayName: string; // 'Mon', 'Tue', etc.
  eventCount: number;
  meetingHours: number; // total hours of non-all-day events
  focusHours: number; // 8h workday minus meetingHours
  hasConflict: boolean;
  tag: 'heavy' | 'balanced' | 'light'; // heavy = >5h meetings, light = <2h, balanced = between
}

export interface WeekSummary {
  days: DaySummary[];
  totalMeetingHours: number;
  totalFocusHours: number;
  unbookedHours: number; // 40h work week minus total meeting hours
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const WORKDAY_HOURS = 8;
const WORK_WEEK_HOURS = 40;

function getDayTag(meetingHours: number): 'heavy' | 'balanced' | 'light' {
  if (meetingHours > 5) return 'heavy';
  if (meetingHours < 2) return 'light';
  return 'balanced';
}

/**
 * Returns a per-day summary for the given work week including meeting hours,
 * focus hours, conflict detection, and day tagging.
 */
export async function getWeekSummary(
  startOfWeek: string,
  endOfWeek: string,
): Promise<WeekSummary> {
  const events = await listCalendarEventsWeek(startOfWeek, endOfWeek);

  // Group events by date (YYYY-MM-DD)
  const eventsByDate = new Map<string, CalendarEventRow[]>();
  for (const event of events) {
    const dateKey = event.startAt.toISOString().slice(0, 10);
    const existing = eventsByDate.get(dateKey) ?? [];
    existing.push(event);
    eventsByDate.set(dateKey, existing);
  }

  // Generate day summaries for each weekday in the range
  const days: DaySummary[] = [];
  const start = new Date(startOfWeek);
  const end = new Date(endOfWeek);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    // Skip weekends (0 = Sun, 6 = Sat)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateKey = d.toISOString().slice(0, 10);
    const dayEvents = eventsByDate.get(dateKey) ?? [];

    // Calculate meeting hours from non-all-day events
    let meetingHours = 0;
    let hasConflict = false;

    for (const event of dayEvents) {
      if (!event.isAllDay) {
        const durationMs = event.endAt.getTime() - event.startAt.getTime();
        meetingHours += durationMs / (1000 * 60 * 60);
      }
      if (event.hasConflict) {
        hasConflict = true;
      }
    }

    // Cap meeting hours at workday max
    meetingHours = Math.min(meetingHours, WORKDAY_HOURS);
    const focusHours = Math.max(0, WORKDAY_HOURS - meetingHours);

    days.push({
      date: dateKey,
      dayName: DAY_NAMES[dayOfWeek] as string,
      eventCount: dayEvents.length,
      meetingHours: Math.round(meetingHours * 100) / 100,
      focusHours: Math.round(focusHours * 100) / 100,
      hasConflict,
      tag: getDayTag(meetingHours),
    });
  }

  const totalMeetingHours = days.reduce((sum, d) => sum + d.meetingHours, 0);
  const totalFocusHours = days.reduce((sum, d) => sum + d.focusHours, 0);
  const unbookedHours = Math.max(0, WORK_WEEK_HOURS - totalMeetingHours);

  return {
    days,
    totalMeetingHours: Math.round(totalMeetingHours * 100) / 100,
    totalFocusHours: Math.round(totalFocusHours * 100) / 100,
    unbookedHours: Math.round(unbookedHours * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// suggestFocusBlockSlots
// ---------------------------------------------------------------------------

export interface FocusSlot {
  date: string;
  startHour: number; // e.g. 9 for 9:00 AM
  endHour: number; // e.g. 10.5 for 10:30 AM
}

const WORK_START_HOUR = 8;
const WORK_END_HOUR = 18;
const FOCUS_BLOCK_DURATION = 1.5; // 90 minutes in hours
const MAX_SUGGESTIONS = 5;

/**
 * Finds available 90-minute slots in the week where no events exist
 * (between 8am-6pm). Returns up to 5 suggestions.
 */
export async function suggestFocusBlockSlots(
  startOfWeek: string,
  endOfWeek: string,
): Promise<FocusSlot[]> {
  const events = await listCalendarEventsWeek(startOfWeek, endOfWeek);

  // Group non-all-day events by date
  const eventsByDate = new Map<string, { startHour: number; endHour: number }[]>();
  for (const event of events) {
    if (event.isAllDay) continue;
    const dateKey = event.startAt.toISOString().slice(0, 10);
    const startHour = event.startAt.getHours() + event.startAt.getMinutes() / 60;
    const endHour = event.endAt.getHours() + event.endAt.getMinutes() / 60;
    const existing = eventsByDate.get(dateKey) ?? [];
    existing.push({ startHour, endHour });
    eventsByDate.set(dateKey, existing);
  }

  const slots: FocusSlot[] = [];
  const start = new Date(startOfWeek);
  const end = new Date(endOfWeek);

  for (let d = new Date(start); d <= end && slots.length < MAX_SUGGESTIONS; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateKey = d.toISOString().slice(0, 10);
    const dayEvents = eventsByDate.get(dateKey) ?? [];

    // Sort events by start time
    const sorted = [...dayEvents].sort((a, b) => a.startHour - b.startHour);

    // Find gaps between events in the work window
    let cursor = WORK_START_HOUR;

    for (const event of sorted) {
      // Only consider events within work hours
      const eventStart = Math.max(event.startHour, WORK_START_HOUR);
      const eventEnd = Math.min(event.endHour, WORK_END_HOUR);

      if (eventStart <= cursor) {
        // Event overlaps or starts before cursor, advance cursor
        cursor = Math.max(cursor, eventEnd);
        continue;
      }

      // Gap exists between cursor and this event's start
      const gapDuration = eventStart - cursor;
      if (gapDuration >= FOCUS_BLOCK_DURATION) {
        slots.push({
          date: dateKey,
          startHour: cursor,
          endHour: cursor + FOCUS_BLOCK_DURATION,
        });
        if (slots.length >= MAX_SUGGESTIONS) break;
      }

      cursor = Math.max(cursor, eventEnd);
    }

    // Check remaining time after last event
    if (slots.length < MAX_SUGGESTIONS && cursor < WORK_END_HOUR) {
      const remainingGap = WORK_END_HOUR - cursor;
      if (remainingGap >= FOCUS_BLOCK_DURATION) {
        slots.push({
          date: dateKey,
          startHour: cursor,
          endHour: cursor + FOCUS_BLOCK_DURATION,
        });
      }
    }
  }

  return slots.slice(0, MAX_SUGGESTIONS);
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
