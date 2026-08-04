'use client';

import Link from 'next/link';
import type { CalendarEventRow } from '@/lib/calendar/actions';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOUR_START = 8;
const HOUR_END = 18;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const HOUR_LABELS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
  const h = HOUR_START + i;
  if (h === 12) return '12 PM';
  if (h > 12) return `${h - 12} PM`;
  return `${h} AM`;
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WeekDay {
  date: string;
  name: string;
  num: number;
  isToday: boolean;
}

export interface WeekGridProps {
  days: WeekDay[];
  events: CalendarEventRow[];
  selectedDate?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function eventTop(startAt: Date): string {
  const h = startAt.getHours() + startAt.getMinutes() / 60;
  const offset = Math.max(0, h - HOUR_START);
  return `${(offset / TOTAL_HOURS) * 100}%`;
}

function eventHeight(startAt: Date, endAt: Date): string {
  const durationH = (endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60);
  return `${(Math.min(durationH, TOTAL_HOURS) / TOTAL_HOURS) * 100}%`;
}

function eventStyle(event: CalendarEventRow): string {
  if (event.hasConflict) return 'bg-risk-wash border-risk';
  if (event.prepSuggestion) return 'bg-wash-green border-signal';
  return 'bg-info-wash border-info';
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WeekGrid({ days, events, selectedDate }: WeekGridProps) {
  // Group events by date
  const eventsByDate = new Map<string, CalendarEventRow[]>();
  for (const event of events) {
    if (event.isAllDay) continue;
    const dateKey = new Date(event.startAt).toISOString().slice(0, 10);
    const existing = eventsByDate.get(dateKey) ?? [];
    existing.push(event);
    eventsByDate.set(dateKey, existing);
  }

  return (
    <section className="border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-[8px] border bg-white/88 shadow-panel">
      {/* Legend */}
      <div className="border-border flex items-center justify-between gap-4 border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-signal text-[0.76rem] font-extrabold uppercase">
            {days[0]?.num} – {days[days.length - 1]?.num}{' '}
            {new Date(days[0]?.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long' })}
          </span>
          <div className="text-text-secondary flex items-center gap-3 text-[0.8rem]">
            <span className="inline-flex items-center gap-1.5">
              <span className="bg-info-wash border-info inline-block h-2.5 w-2.5 rounded-[3px] border" />
              Meeting
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="bg-wash-green border-signal inline-block h-2.5 w-2.5 rounded-[3px] border" />
              Protected hold
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-[3px] border border-dashed border-amber-600 bg-amber-50" />
              Suggested
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="bg-risk-wash border-risk inline-block h-2.5 w-2.5 rounded-[3px] border" />
              Conflict
            </span>
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[52px_repeat(5,minmax(0,1fr))] gap-1.5 px-4 pt-3 pb-1.5">
        <span />
        {days.map((d) => (
          <Link
            key={d.date}
            href={`/productivity/calendar?view=day&date=${d.date}`}
            className={`flex items-baseline justify-between gap-1.5 rounded-[7px] px-2.5 py-2 transition-colors ${
              d.isToday
                ? 'bg-wash-green'
                : d.date === selectedDate
                  ? 'bg-wash'
                  : 'hover:bg-wash/50'
            }`}
          >
            <span className={`text-[0.8rem] font-extrabold ${d.isToday ? 'text-signal' : 'text-ink'}`}>
              {d.name}
            </span>
            <span className={`font-mono text-[0.78rem] font-bold ${d.isToday ? 'text-signal' : 'text-text-secondary'}`}>
              {d.num}
            </span>
          </Link>
        ))}
      </div>

      {/* Grid body */}
      <div className="relative flex min-h-0 flex-1 overflow-y-auto">
        <div className="grid min-h-[600px] w-full grid-cols-[52px_repeat(5,minmax(0,1fr))] gap-1.5 px-4 pb-4">
          {/* Hour labels */}
          <div className="relative">
            {HOUR_LABELS.map((label, i) => (
              <span
                key={label}
                className="text-text-secondary absolute right-2 font-mono text-[0.7rem] font-semibold"
                style={{ top: `${(i / TOTAL_HOURS) * 100}%`, transform: 'translateY(-50%)' }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d) => {
            const dayEvents = eventsByDate.get(d.date) ?? [];
            return (
              <div
                key={d.date}
                className="border-border/30 relative rounded-[7px] bg-[repeating-linear-gradient(to_bottom,var(--border)_0_1px,transparent_1px_10%)]"
              >
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`absolute inset-x-1 overflow-hidden rounded-[5px] border px-2 py-1 ${eventStyle(event)}`}
                    style={{
                      top: eventTop(new Date(event.startAt)),
                      height: eventHeight(new Date(event.startAt), new Date(event.endAt)),
                      minHeight: '24px',
                    }}
                    title={`${event.title}\n${formatTime(new Date(event.startAt))} – ${formatTime(new Date(event.endAt))}`}
                  >
                    <p className="text-ink m-0 truncate text-[0.72rem] font-bold leading-tight">
                      {event.title}
                    </p>
                    <p className="text-text-secondary m-0 truncate text-[0.66rem] leading-tight">
                      {formatTime(new Date(event.startAt))}
                    </p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
