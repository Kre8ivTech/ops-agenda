import Link from 'next/link';

import { getSession } from '@/lib/auth';
import {
  listCalendarEvents,
  listCalendarEventsWeek,
  getCalendarMetrics,
  getWeekSummary,
  type CalendarEventRow,
  type WeekSummary,
} from '@/lib/calendar/actions';
import { Button, ButtonLink } from '@/components/ui/button';
import { syncCalendar } from '@/lib/connectors/sync';
import { WeekGrid } from '@/components/calendar/week-grid';
import { WeekSidebar } from '@/components/calendar/week-sidebar';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

function getMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days
  d.setDate(d.getDate() + diff);
  return toDateString(d);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDateFull(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string; event?: string }>;
}) {
  const session = await getSession();

  if (!session?.accountId || !session?.userId) {
    return (
      <div className="border-border bg-risk-wash text-ink rounded-[8px] border p-4">
        <p className="m-0 text-[0.95rem]">
          Complete onboarding to access Calendar.
        </p>
        <ButtonLink href="/onboarding" className="mt-4" size="medium">
          Continue onboarding
        </ButtonLink>
      </div>
    );
  }

  const params = await searchParams;
  const today = toDateString(new Date());
  const view = params.view === 'day' ? 'day' : 'week';
  const selectedDate = params.date || today;
  const selectedEventId = params.event;

  // Server action for sync
  async function handleSync() {
    'use server';
    await syncCalendar();
  }

  if (view === 'week') {
    return <WeekView selectedDate={selectedDate} today={today} selectedEventId={selectedEventId} />;
  }

  return <DayView selectedDate={selectedDate} today={today} handleSync={handleSync} />;
}

// ---------------------------------------------------------------------------
// Week View
// ---------------------------------------------------------------------------

async function WeekView({
  selectedDate,
  today,
  selectedEventId,
}: {
  selectedDate: string;
  today: string;
  selectedEventId?: string;
}) {
  const monday = getMonday(selectedDate);
  const friday = addDays(monday, 4);
  const startOfWeek = monday + 'T00:00:00';
  const endOfWeek = friday + 'T23:59:59';

  const todayMonday = getMonday(today);

  // Build day headers
  const days = Array.from({ length: 5 }, (_, i) => {
    const dateStr = addDays(monday, i);
    const d = new Date(dateStr + 'T00:00:00');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      date: dateStr,
      name: dayNames[d.getDay()],
      num: d.getDate(),
      isToday: dateStr === today,
    };
  });

  let events: CalendarEventRow[] = [];
  let summary: WeekSummary = { days: [], totalMeetingHours: 0, totalFocusHours: 0, unbookedHours: 40 };
  let unavailable = false;

  try {
    [events, summary] = await Promise.all([
      listCalendarEventsWeek(startOfWeek, endOfWeek),
      getWeekSummary(startOfWeek, endOfWeek),
    ]);
  } catch {
    unavailable = true;
  }

  const weekLabel = new Date(monday + 'T00:00:00').toLocaleDateString('en-US', {
    day: 'numeric', month: 'long',
  });

  return (
    <div className="flex h-[calc(100dvh-120px)] flex-col gap-3">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Productivity</p>
          <h1 className="text-ink m-0 text-[1.55rem] font-extrabold tracking-[-0.02em]">
            Calendar — week of {weekLabel}
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          {/* View toggle */}
          <ViewToggle active="week" date={selectedDate} />
          {/* Today button */}
          {monday !== todayMonday && (
            <ButtonLink href="/productivity/calendar?view=week" size="medium">
              Today
            </ButtonLink>
          )}
          {/* Protect focus time */}
          <ButtonLink href={`/productivity/calendar?view=week&date=${selectedDate}&focus=1`} size="medium" variant="primary">
            Protect focus time
          </ButtonLink>
        </div>
      </div>

      {/* Unbooked hours line */}
      <div className="flex items-center justify-end">
        <span className="text-[0.82rem] text-text-secondary">
          {summary.unbookedHours.toFixed(1)} h unbooked
        </span>
      </div>

      {unavailable ? (
        <div className="border-border bg-info-wash text-ink rounded-[8px] border px-3.5 py-3 text-[0.85rem]">
          Database is not connected. Set <code className="font-mono text-[0.8rem]">DATABASE_URL</code> to load calendar events.
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 gap-4">
          <WeekGrid days={days} events={events} selectedEventId={selectedEventId} />
          <WeekSidebar
            summary={summary}
            selectedEvent={selectedEventId ? events.find((e) => e.id === selectedEventId) ?? null : null}
            suggestedHolds={[]}
            needsTime={[]}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Day View
// ---------------------------------------------------------------------------

async function DayView({
  selectedDate,
  today,
  handleSync,
}: {
  selectedDate: string;
  today: string;
  handleSync: () => Promise<void>;
}) {
  const startDate = selectedDate + 'T00:00:00';
  const endDate = selectedDate + 'T23:59:59';
  const prevDate = addDays(selectedDate, -1);
  const nextDate = addDays(selectedDate, 1);

  let events: CalendarEventRow[] = [];
  let metrics = { totalEvents: 0, conflicts: 0, allDay: 0, withPrep: 0 };
  let unavailable = false;

  try {
    [events, metrics] = await Promise.all([
      listCalendarEvents({ startDate, endDate, view: 'day' }),
      getCalendarMetrics({ startDate, endDate }),
    ]);
  } catch {
    unavailable = true;
  }

  const allDayEvents = events.filter((e) => e.isAllDay);
  const timedEvents = events.filter((e) => !e.isAllDay);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Productivity</p>
          <h1 className="text-ink m-0 text-[1.55rem] font-extrabold tracking-[-0.02em]">Calendar</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <ViewToggle active="day" date={selectedDate} />
          <form action={handleSync}>
            <Button type="submit" variant="secondary" size="medium">↻ Sync</Button>
          </form>
        </div>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-3">
        <ButtonLink href={`/productivity/calendar?view=day&date=${prevDate}`} size="medium">
          ← Prev
        </ButtonLink>
        <span className="text-ink text-[0.95rem] font-extrabold">
          {formatDateFull(new Date(selectedDate + 'T00:00:00'))}
        </span>
        <ButtonLink href={`/productivity/calendar?view=day&date=${nextDate}`} size="medium">
          Next →
        </ButtonLink>
        {selectedDate !== today && (
          <ButtonLink href="/productivity/calendar?view=day" size="medium">Today</ButtonLink>
        )}
      </div>

      {unavailable ? (
        <div className="border-border bg-info-wash text-ink rounded-[8px] border px-3.5 py-3 text-[0.85rem]">
          Database is not connected.
        </div>
      ) : (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-4 gap-3">
            <MetricCard label="Events" value={String(metrics.totalEvents)} />
            <MetricCard label="Conflicts" value={String(metrics.conflicts)} tone={metrics.conflicts > 0 ? 'risk' : undefined} />
            <MetricCard label="All Day" value={String(metrics.allDay)} />
            <MetricCard label="With Prep" value={String(metrics.withPrep)} tone="signal" />
          </div>

          {events.length === 0 ? (
            <div className="text-text-secondary rounded-[8px] border border-dashed px-4 py-8 text-center text-[0.88rem]">
              No events today. Connect a calendar in{' '}
              <Link href="/settings/connections" className="text-signal font-bold">Settings → Connections</Link>.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* All-day */}
              {allDayEvents.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-text-secondary m-0 text-[0.74rem] font-extrabold uppercase">All-Day</p>
                  <div className="flex flex-wrap gap-2">
                    {allDayEvents.map((e) => (
                      <div key={e.id} className="border-border flex items-center gap-2 rounded-[8px] border bg-white px-3 py-2">
                        <span className="text-ink text-[0.85rem] font-bold">{e.title}</span>
                        {e.webLink && (
                          <a href={e.webLink} target="_blank" rel="noopener noreferrer" className="text-signal text-[0.78rem] font-bold">Open ↗</a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {timedEvents.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-text-secondary m-0 text-[0.74rem] font-extrabold uppercase">Timeline</p>
                  <ul className="m-0 flex list-none flex-col gap-3 p-0">
                    {timedEvents.map((event) => (
                      <li key={event.id}>
                        <div className="border-border rounded-[8px] border bg-white p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex flex-col gap-1">
                              <p className="text-text-secondary m-0 text-[0.78rem] font-bold">
                                {formatTime(new Date(event.startAt))} – {formatTime(new Date(event.endAt))}
                              </p>
                              <p className="text-ink m-0 text-[0.95rem] font-bold">{event.title}</p>
                              {event.location && <p className="text-text-secondary m-0 text-[0.82rem]">{event.location}</p>}
                              <div className="flex items-center gap-2">
                                {event.attendeeCount && (
                                  <span className="text-text-secondary text-[0.78rem]">
                                    {event.attendeeCount} attendee{Number(event.attendeeCount) !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {event.hasConflict && (
                                <span className="bg-risk-wash text-ink rounded px-2 py-1 text-[0.72rem] font-bold">⚠ Conflict</span>
                              )}
                              {event.webLink && (
                                <a href={event.webLink} target="_blank" rel="noopener noreferrer" className="text-signal text-[0.78rem] font-bold">Open ↗</a>
                              )}
                            </div>
                          </div>
                          {event.prepSuggestion && (
                            <div className="bg-wash-green mt-3 rounded-[6px] px-3 py-2">
                              <p className="text-ink m-0 text-[0.82rem]">
                                <span className="font-bold">Prep:</span> {event.prepSuggestion}
                              </p>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// View Toggle
// ---------------------------------------------------------------------------

function ViewToggle({ active, date }: { active: 'day' | 'week'; date: string }) {
  return (
    <div className="border-border flex items-center gap-0.5 rounded-[8px] border bg-wash p-1">
      <Link
        href={`/productivity/calendar?view=day&date=${date}`}
        className={`grid h-[30px] place-items-center rounded-[6px] px-3 text-[0.82rem] font-extrabold transition-colors ${
          active === 'day' ? 'bg-white text-ink shadow-sm' : 'text-text-secondary hover:text-ink'
        }`}
      >
        Day
      </Link>
      <Link
        href={`/productivity/calendar?view=week&date=${date}`}
        className={`grid h-[30px] place-items-center rounded-[6px] px-3 text-[0.82rem] font-extrabold transition-colors ${
          active === 'week' ? 'bg-white text-ink shadow-sm' : 'text-text-secondary hover:text-ink'
        }`}
      >
        Week
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric Card (inline for day view)
// ---------------------------------------------------------------------------

function MetricCard({ label, value, tone }: { label: string; value: string; tone?: 'risk' | 'signal' }) {
  const valueColor = tone === 'risk' ? 'text-risk' : tone === 'signal' ? 'text-signal' : 'text-ink';
  return (
    <div className="border-border rounded-[8px] border bg-white px-4 py-3">
      <p className="text-text-secondary m-0 text-[0.68rem] font-extrabold uppercase">{label}</p>
      <p className={`m-0 mt-1 text-[1.3rem] font-extrabold ${valueColor}`}>{value}</p>
    </div>
  );
}
