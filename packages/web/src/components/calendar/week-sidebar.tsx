import type { CalendarEventRow, WeekSummary } from '@/lib/calendar/actions';
import type { FocusBlockSuggestion } from '@/lib/ai/focus-blocks';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface WeekSidebarProps {
  summary: WeekSummary;
  selectedEvent: CalendarEventRow | null;
  suggestedHolds: FocusBlockSuggestion[];
  needsTime: { title: string; estimate: string; detail: string }[];
}

// ---------------------------------------------------------------------------
// Load bar colors
// ---------------------------------------------------------------------------

function loadBarColor(pct: number): string {
  if (pct >= 80) return 'bg-risk';
  if (pct >= 60) return 'bg-amber-500';
  return 'bg-signal';
}

function formatTimeRange(event: CalendarEventRow): string {
  const s = new Date(event.startAt);
  const e = new Date(event.endAt);
  const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${fmt(s)} – ${fmt(e)}`;
}

function dayNameFromDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WeekSidebar({ summary, selectedEvent, suggestedHolds, needsTime }: WeekSidebarProps) {
  return (
    <aside className="flex w-[300px] shrink-0 flex-col gap-0 overflow-y-auto">
      {/* Section 1: Selected Event */}
      <div className="rounded-t-[8px] border border-border bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-[0.68rem] font-extrabold uppercase text-text-secondary">Selected</span>
          {selectedEvent && (
            <span className="cursor-pointer text-[0.74rem] text-text-secondary hover:text-ink">close</span>
          )}
        </div>
        {selectedEvent ? (
          <div className="mt-2">
            <h3 className="m-0 text-[1rem] font-extrabold leading-tight text-ink">
              {selectedEvent.title}
            </h3>
            <p className="m-0 mt-1 text-[0.82rem] text-text-secondary">
              {formatTimeRange(selectedEvent)} · {dayNameFromDate(new Date(selectedEvent.startAt).toISOString().slice(0, 10))}
            </p>
            {selectedEvent.prepSuggestion && (
              <p className="m-0 mt-2 text-[0.82rem] text-ink">
                {selectedEvent.prepSuggestion}
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" size="small">Prep pack</Button>
              <Button variant="ghost" size="small">Dismiss</Button>
            </div>
          </div>
        ) : (
          <p className="m-0 mt-2 text-[0.82rem] text-text-secondary">
            Click an event to see details.
          </p>
        )}
      </div>

      {/* Section 2: Load by Day */}
      <div className="border-x border-b border-border bg-white p-4">
        <span className="text-[0.68rem] font-extrabold uppercase text-signal">Load by Day</span>
        <div className="mt-3 flex flex-col gap-2">
          {summary.days.map((day) => {
            const pct = Math.round((day.meetingHours / 8) * 100);
            return (
              <div key={day.date} className="flex items-center gap-2">
                <span className="w-[28px] text-[0.78rem] font-bold text-ink">{day.dayName}</span>
                <div className="relative h-[8px] flex-1 overflow-hidden rounded-full bg-wash">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${loadBarColor(pct)}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <span className="w-[32px] text-right font-mono text-[0.72rem] font-bold text-text-secondary">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Suggested Holds */}
      <div className="border-x border-b border-border bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-[0.68rem] font-extrabold uppercase text-signal">Suggested Holds</span>
          <span className="text-[0.72rem] text-text-secondary">{suggestedHolds.length} open</span>
        </div>
        <p className="m-0 mt-1 text-[0.76rem] leading-[1.4] text-text-secondary">
          Placed against your P1 work. Nothing is written to Outlook until you apply it.
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {suggestedHolds.length === 0 ? (
            <p className="m-0 text-[0.82rem] text-text-secondary">No suggestions right now.</p>
          ) : (
            suggestedHolds.map((hold, i) => (
              <div key={i} className="rounded-[6px] border-l-[3px] border-signal bg-wash-green/50 px-3 py-2.5">
                <p className="m-0 text-[0.85rem] font-bold leading-tight text-ink">{hold.reason}</p>
                <p className="m-0 mt-0.5 font-mono text-[0.72rem] font-bold text-signal">
                  {dayNameFromDate(hold.date)} {hold.startTime} – {hold.endTime}
                </p>
                {hold.reason && (
                  <p className="m-0 mt-1 text-[0.76rem] leading-[1.4] text-text-secondary">
                    {hold.reason}
                  </p>
                )}
                <div className="mt-2 flex gap-2">
                  <Button variant="primary" size="small">Apply</Button>
                  <Button variant="ghost" size="small">Dismiss</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Section 4: Needs Time */}
      <div className="rounded-b-[8px] border-x border-b border-border bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-[0.68rem] font-extrabold uppercase text-risk">Needs Time</span>
          <span className="text-[0.72rem] text-text-secondary">{needsTime.length} unscheduled</span>
        </div>
        <div className="mt-3 flex flex-col gap-2.5">
          {needsTime.length === 0 ? (
            <p className="m-0 text-[0.82rem] text-text-secondary">All tasks have time allocated.</p>
          ) : (
            needsTime.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[0.85rem] font-bold text-ink">{item.title}</p>
                  <p className="m-0 text-[0.74rem] text-text-secondary">{item.estimate} · {item.detail}</p>
                </div>
                <Button variant="secondary" size="small">Find time</Button>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
