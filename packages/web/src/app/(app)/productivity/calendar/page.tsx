import { getSession } from '@/lib/auth';
import {
  listCalendarEvents,
  getCalendarMetrics,
  type CalendarEventRow,
} from '@/lib/calendar/actions';
import { MetricCards, type MetricCardData } from '@/components/record-table/metric-cards';
import { Button, ButtonLink } from '@/components/ui/button';
import { syncCalendar } from '@/lib/connectors/sync';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await getSession();

  if (!session?.accountId || !session?.userId) {
    return (
      <div className="border-border bg-risk-wash text-ink rounded-[8px] border p-4">
        <p className="m-0 text-[0.95rem]">
          Your session is not linked to a tenant account. Complete onboarding to continue.
        </p>
        <ButtonLink href="/onboarding" className="mt-4" size="medium">
          Continue onboarding
        </ButtonLink>
      </div>
    );
  }

  const params = await searchParams;
  const today = toDateString(new Date());
  const selectedDate = params.date || today;
  const startDate = selectedDate + 'T00:00:00';
  const endDate = selectedDate + 'T23:59:59';

  let events: CalendarEventRow[] = [];
  let metrics: { totalEvents: number; conflicts: number; allDay: number; withPrep: number } = {
    totalEvents: 0,
    conflicts: 0,
    allDay: 0,
    withPrep: 0,
  };
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

  const prevDate = addDays(selectedDate, -1);
  const nextDate = addDays(selectedDate, 1);

  const metricCards: MetricCardData[] = [
    { label: 'Total Events', value: String(metrics.totalEvents) },
    {
      label: 'Conflicts',
      value: String(metrics.conflicts),
      tone: metrics.conflicts > 0 ? 'risk' : 'default',
    },
    { label: 'All Day', value: String(metrics.allDay) },
    { label: 'With Prep', value: String(metrics.withPrep), tone: 'signal' },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Productivity</p>
          <h1 className="text-ink m-0 text-[1.55rem] font-extrabold tracking-[-0.02em]">Calendar</h1>
          <p className="text-text-secondary m-0 mt-2 max-w-[62ch] text-[0.88rem] leading-[1.5]">
            All calendars reflected. Prep suggestions powered by AI.
          </p>
        </div>
        <form action={async () => { 'use server'; await syncCalendar(); }}>
          <Button type="submit" variant="secondary" size="medium">
            ↻ Sync now
          </Button>
        </form>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-3">
        <ButtonLink href={`/productivity/calendar?date=${prevDate}`} size="medium">
          ← Prev
        </ButtonLink>
        <span className="text-ink text-[0.95rem] font-extrabold">
          {formatDate(new Date(selectedDate + 'T00:00:00'))}
        </span>
        <ButtonLink href={`/productivity/calendar?date=${nextDate}`} size="medium">
          Next →
        </ButtonLink>
        {selectedDate !== today && (
          <ButtonLink href="/productivity/calendar" size="medium">
            Today
          </ButtonLink>
        )}
      </div>

      {unavailable ? (
        <div className="border-border bg-info-wash text-ink rounded-[8px] border px-3.5 py-3 text-[0.85rem]">
          Database is not connected. Set{' '}
          <code className="font-mono text-[0.8rem]">DATABASE_URL</code> to load calendar events.
        </div>
      ) : (
        <>
          {/* Metrics */}
          <MetricCards items={metricCards} />

          {events.length === 0 ? (
            <div className="text-text-secondary rounded-[8px] border border-dashed px-4 py-8 text-center text-[0.88rem]">
              No events today. Connect a calendar account in Settings → Connections.
            </div>
          ) : (
            <>
              {/* All-day events */}
              {allDayEvents.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-text-secondary m-0 text-[0.74rem] font-extrabold uppercase">
                    All-Day Events
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allDayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="border-border flex items-center gap-2 rounded-[8px] border bg-white px-3 py-2"
                      >
                        {event.calendarColor && (
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: event.calendarColor }}
                          />
                        )}
                        <span className="text-ink text-[0.85rem] font-bold">{event.title}</span>
                        {event.hasConflict && (
                          <span className="bg-risk-wash text-ink rounded px-1.5 py-0.5 text-[0.72rem] font-bold">
                            ⚠ Conflict
                          </span>
                        )}
                        {event.webLink && (
                          <a
                            href={event.webLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-signal text-[0.78rem] font-bold"
                          >
                            Open ↗
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {timedEvents.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-text-secondary m-0 text-[0.74rem] font-extrabold uppercase">
                    Timeline
                  </p>
                  <ul className="m-0 flex list-none flex-col gap-3 p-0">
                    {timedEvents.map((event) => (
                      <li key={event.id}>
                        <div className="border-border rounded-[8px] border bg-white p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex flex-col gap-1">
                              {/* Time range */}
                              <p className="text-text-secondary m-0 text-[0.78rem] font-bold">
                                {formatTime(new Date(event.startAt))} –{' '}
                                {formatTime(new Date(event.endAt))}
                              </p>
                              {/* Title */}
                              <p className="text-ink m-0 text-[0.95rem] font-bold">{event.title}</p>
                              {/* Location */}
                              {event.location && (
                                <p className="text-text-secondary m-0 text-[0.82rem]">
                                  {event.location}
                                </p>
                              )}
                              {/* Calendar + Attendees */}
                              <div className="flex items-center gap-2">
                                {event.calendarColor && (
                                  <span
                                    className="inline-block h-2 w-2 rounded-full"
                                    style={{ backgroundColor: event.calendarColor }}
                                  />
                                )}
                                {event.calendarName && (
                                  <span className="text-text-secondary text-[0.78rem]">
                                    {event.calendarName}
                                  </span>
                                )}
                                {event.attendeeCount && (
                                  <span className="text-text-secondary text-[0.78rem]">
                                    · {event.attendeeCount} attendee
                                    {Number(event.attendeeCount) !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {event.hasConflict && (
                                <span className="bg-risk-wash text-ink rounded px-2 py-1 text-[0.72rem] font-bold">
                                  ⚠ Conflict
                                </span>
                              )}
                              {event.webLink && (
                                <a
                                  href={event.webLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-signal text-[0.78rem] font-bold"
                                >
                                  Open ↗
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Prep suggestion */}
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
            </>
          )}
        </>
      )}
    </div>
  );
}
