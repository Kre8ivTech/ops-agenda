'use client';

import Link from 'next/link';
import type { CalendarEventRow } from '@/lib/calendar/actions';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOUR_START = 8;
const HOUR_END = 18;
const TOTAL_HOURS = HOUR_END - HOUR_START;

const HOUR_LABELS: string[] = [];
for (let h = HOUR_START; h <= HOUR_END; h++) {
  if (h < 12) HOUR_LABELS.push(`${h} AM`);
  else if (h === 12) HOUR_LABELS.push('12 PM');
  else HOUR_LABELS.push(`${h - 12} PM`);
}

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
  selectedEventId?: string;
}

// ---------------------------------------------------------------------------
// Event classification
// ---------------------------------------------------------------------------

/** Determines if an event is a "protected" focus/deep-work block */
function isProtected(event: CalendarEventRow): boolean {
  const t = (event.title ?? '').toLowerCase();
  return (
    t.includes('deep work') ||
    t.includes('focus') ||
    t.includes('protected') ||
    event.calendarColor === 'green' ||
    !!event.prepSuggestion
  );
}

function eventBlockClasses(event: CalendarEventRow, isSelected: boolean): string {
  const base = 'absolute inset-x-[3px] overflow-hidden rounded-[4px] border px-2 py-1 cursor-pointer transition-shadow';
  const selected = isSelected ? ' ring-2 ring-ink shadow-md' : '';

  if (event.hasConflict) {
    return `${base} bg-white border-border${selected}`;
  }
  if (isProtected(event)) {
    return `${base} bg-wash-green border-signal/40${selected}`;
  }
  // Regular meeting
  return `${base} bg-white border-border${selected}`;
}

// ---------------------------------------------------------------------------
// Positioning
// ---------------------------------------------------------------------------

function eventTop(startAt: Date): string {
  const h = startAt.getHours() + startAt.getMinutes() / 60;
  const offset = Math.max(0, h - HOUR_START);
  return `${(offset / TOTAL_HOURS) * 100}%`;
}

function eventHeight(startAt: Date, endAt: Date): string {
  const durationH = (endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60);
  const clamped = Math.min(durationH, TOTAL_HOURS);
  return `${(clamped / TOTAL_HOURS) * 100}%`;
}

function formatTimeShort(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${hour}:00` : `${hour}:${m.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WeekGrid({ days, events, selectedEventId }: WeekGridProps) {
  // Group events by date (non-all-day only)
  const eventsByDate = new Map<string, CalendarEventRow[]>();
  for (const event of events) {
    if (event.isAllDay) continue;
    const dateKey = new Date(event.startAt).toISOString().slice(0, 10);
    const existing = eventsByDate.get(dateKey) ?? [];
    existing.push(event);
    eventsByDate.set(dateKey, existing);
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[8px] border border-border bg-white shadow-panel">
      {/* Legend row */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-[0.76rem] font-extrabold uppercase text-signal">
            {days[0]?.num} – {days[days.length - 1]?.num} July
          </span>
          <div className="flex items-center gap-3 text-[0.78rem] text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-[10px] w-[10px] rounded-[3px] border border-info bg-info-wash" />
              Meeting
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-[10px] w-[10px] rounded-[3px] border border-signal bg-wash-green" />
              Protected
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-[10px] w-[10px] rounded-[3px] border border-dashed border-amber-600 bg-[#f6ead8]" />
              Suggested
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-[10px] w-[10px] rounded-[3px] border border-risk bg-risk-wash" />
              Conflict
            </span>
          </div>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-[52px_repeat(5,minmax(0,1fr))] gap-[6px] px-4 pt-3 pb-1">
        <span />
        {days.map((d) => (
          <div
            key={d.date}
            className={`flex items-baseline justify-between rounded-[7px] px-2.5 py-[7px] ${
              d.isToday ? 'bg-signal text-white' : 'bg-wash'
            }`}
          >
            <span className={`text-[0.8rem] font-extrabold ${d.isToday ? 'text-white' : 'text-ink'}`}>
              {d.name}
            </span>
            <span className={`font-mono text-[0.78rem] font-bold ${d.isToday ? 'text-white/80' : 'text-text-secondary'}`}>
              {d.num}
            </span>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="relative flex-1 overflow-y-auto">
        <div className="grid min-h-[700px] grid-cols-[52px_repeat(5,minmax(0,1fr))] gap-[6px] px-4 pb-4">
          {/* Hour labels column */}
          <div className="relative">
            {HOUR_LABELS.map((label, i) => (
              <span
                key={label}
                className="absolute right-2 font-mono text-[0.7rem] font-semibold text-text-secondary"
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
                className="relative rounded-[7px]"
                style={{
                  backgroundColor: d.isToday ? 'rgba(37,114,77,0.04)' : undefined,
                  backgroundImage: 'repeating-linear-gradient(to bottom, var(--border) 0 1px, transparent 1px 10%)',
                }}
              >
                {dayEvents.map((event) => {
                  const startDate = new Date(event.startAt);
                  const endDate = new Date(event.endAt);
                  const isSelected = event.id === selectedEventId;

                  return (
                    <Link
                      key={event.id}
                      href={`/productivity/calendar?view=week&date=${d.date}&event=${event.id}`}
                      className={eventBlockClasses(event, isSelected)}
                      style={{
                        top: eventTop(startDate),
                        height: eventHeight(startDate, endDate),
                        minHeight: '28px',
                        textDecoration: 'none',
                      }}
                    >
                      {/* Conflict dot */}
                      {event.hasConflict && (
                        <span className="absolute top-1.5 right-1.5 h-[7px] w-[7px] rounded-full bg-risk" />
                      )}
                      <p className="m-0 truncate text-[0.78rem] font-bold leading-tight text-ink">
                        {event.title}
                      </p>
                      <p className="m-0 truncate font-mono text-[0.68rem] text-text-secondary">
                        {formatTimeShort(startDate)} – {formatTimeShort(endDate)}
                      </p>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
