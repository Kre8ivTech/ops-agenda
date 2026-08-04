import type { DaySummary, WeekSummary } from '@/lib/calendar/actions';

// ---------------------------------------------------------------------------
// Tag colors
// ---------------------------------------------------------------------------

const TAG_STYLE: Record<string, string> = {
  heavy: 'bg-risk-wash text-risk border-risk/30',
  balanced: 'bg-info-wash text-info border-info/30',
  light: 'bg-wash-green text-signal border-signal/30',
};

const TAG_LABEL: Record<string, string> = {
  heavy: 'Heavy',
  balanced: 'Balanced',
  light: 'Light',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface WeekSidebarProps {
  summary: WeekSummary;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WeekSidebar({ summary }: WeekSidebarProps) {
  return (
    <aside className="border-border flex w-[300px] shrink-0 flex-col gap-4 overflow-y-auto rounded-[8px] border bg-white/88 p-4 shadow-panel">
      {/* Week totals */}
      <div className="border-border border-b pb-4">
        <p className="text-text-secondary m-0 mb-2 text-[0.68rem] font-extrabold uppercase tracking-wider">
          This week
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-ink m-0 text-[1.3rem] font-extrabold">{summary.totalMeetingHours.toFixed(1)}h</p>
            <p className="text-text-secondary m-0 text-[0.74rem]">meetings</p>
          </div>
          <div>
            <p className="text-signal m-0 text-[1.3rem] font-extrabold">{summary.unbookedHours.toFixed(1)}h</p>
            <p className="text-text-secondary m-0 text-[0.74rem]">unbooked</p>
          </div>
        </div>
      </div>

      {/* Per-day breakdown */}
      <div className="flex flex-col gap-2">
        <p className="text-text-secondary m-0 text-[0.68rem] font-extrabold uppercase tracking-wider">
          Daily breakdown
        </p>
        {summary.days.map((day) => (
          <DayCard key={day.date} day={day} />
        ))}
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Day card
// ---------------------------------------------------------------------------

function DayCard({ day }: { day: DaySummary }) {
  const tagStyle = TAG_STYLE[day.tag] ?? TAG_STYLE.balanced;
  const tagLabel = TAG_LABEL[day.tag] ?? 'Balanced';

  return (
    <div className="border-border rounded-[7px] border px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-ink text-[0.85rem] font-extrabold">{day.dayName}</span>
          <span className="text-text-secondary font-mono text-[0.74rem]">
            {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[0.66rem] font-extrabold ${tagStyle}`}>
          {tagLabel}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-4 text-[0.76rem]">
        <span className="text-text-secondary">
          <strong className="text-ink font-bold">{day.eventCount}</strong> events
        </span>
        <span className="text-text-secondary">
          <strong className="text-ink font-bold">{day.meetingHours.toFixed(1)}h</strong> meetings
        </span>
        <span className="text-text-secondary">
          <strong className="text-signal font-bold">{day.focusHours.toFixed(1)}h</strong> focus
        </span>
      </div>
      {day.hasConflict && (
        <p className="text-risk m-0 mt-1 text-[0.72rem] font-bold">⚠ Has conflicts</p>
      )}
    </div>
  );
}
