import { getSession } from '@/lib/auth';
import { getWeekSummary } from '@/lib/calendar/actions';
import { ButtonLink } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CapacityPage() {
  const session = await getSession();

  if (!session?.accountId || !session?.userId) {
    return (
      <div className="border-border bg-risk-wash text-ink rounded-[8px] border p-4">
        <p className="m-0 text-[0.95rem]">Complete onboarding to access Capacity.</p>
        <ButtonLink href="/onboarding" className="mt-4" size="medium">
          Continue onboarding
        </ButtonLink>
      </div>
    );
  }

  const monday = getMonday();
  const friday = addDays(monday, 4);
  const startOfWeek = monday + 'T00:00:00';
  const endOfWeek = friday + 'T23:59:59';

  let summary = { days: [] as { date: string; dayName: string; meetingHours: number; focusHours: number; eventCount: number; hasConflict: boolean; tag: 'heavy' | 'balanced' | 'light' }[], totalMeetingHours: 0, totalFocusHours: 0, unbookedHours: 40 };

  try {
    summary = await getWeekSummary(startOfWeek, endOfWeek);
  } catch { /* DB unavailable */ }

  const commitHours = 40;
  const utilisationPct = Math.round((summary.totalMeetingHours / commitHours) * 100);
  const focusPct = Math.round((summary.totalFocusHours / commitHours) * 100);

  const TAG_COLOR: Record<string, string> = {
    heavy: 'bg-risk-wash text-risk',
    balanced: 'bg-info-wash text-info',
    light: 'bg-wash-green text-signal',
  };

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header */}
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Productivity</p>
        <h1 className="text-ink m-0 text-[1.55rem] font-extrabold tracking-[-0.02em]">Capacity</h1>
        <p className="text-text-secondary m-0 mt-2 max-w-[62ch] text-[0.92rem] leading-[1.5]">
          Week capacity derived from calendar and time entries. Not a manual forecast.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-[8px] border border-border bg-white px-4 py-3">
          <p className="m-0 text-[0.68rem] font-extrabold uppercase text-text-secondary">Committed</p>
          <p className="m-0 mt-1 text-[1.5rem] font-extrabold text-ink">{commitHours}h</p>
          <p className="m-0 mt-0.5 text-[0.76rem] text-text-secondary">Work week</p>
        </div>
        <div className="rounded-[8px] border border-border bg-white px-4 py-3">
          <p className="m-0 text-[0.68rem] font-extrabold uppercase text-text-secondary">Booked</p>
          <p className="m-0 mt-1 text-[1.5rem] font-extrabold text-ink">{summary.totalMeetingHours.toFixed(1)}h</p>
          <p className="m-0 mt-0.5 text-[0.76rem] text-text-secondary">{utilisationPct}% utilisation</p>
        </div>
        <div className="rounded-[8px] border border-border bg-white px-4 py-3">
          <p className="m-0 text-[0.68rem] font-extrabold uppercase text-text-secondary">Focus Available</p>
          <p className="m-0 mt-1 text-[1.5rem] font-extrabold text-signal">{summary.totalFocusHours.toFixed(1)}h</p>
          <p className="m-0 mt-0.5 text-[0.76rem] text-text-secondary">{focusPct}% of week</p>
        </div>
        <div className="rounded-[8px] border border-border bg-white px-4 py-3">
          <p className="m-0 text-[0.68rem] font-extrabold uppercase text-text-secondary">Unbooked</p>
          <p className="m-0 mt-1 text-[1.5rem] font-extrabold text-ink">{summary.unbookedHours.toFixed(1)}h</p>
          <p className="m-0 mt-0.5 text-[0.76rem] text-text-secondary">Available for tasks</p>
        </div>
      </div>

      {/* Daily breakdown */}
      <div className="rounded-[8px] border border-border bg-white">
        <div className="border-b border-border px-5 py-3">
          <h2 className="m-0 text-[0.95rem] font-extrabold text-ink">Daily Breakdown</h2>
        </div>
        {summary.days.length === 0 ? (
          <div className="px-5 py-8 text-center text-[0.88rem] text-text-secondary">
            No calendar data. Connect an account in Settings → Connections.
          </div>
        ) : (
          <table className="w-full border-collapse text-[0.82rem]">
            <thead>
              <tr className="bg-wash text-left">
                <th className="px-5 py-2 font-extrabold text-ink">Day</th>
                <th className="px-5 py-2 font-extrabold text-ink">Events</th>
                <th className="px-5 py-2 font-extrabold text-ink">Meeting Hours</th>
                <th className="px-5 py-2 font-extrabold text-ink">Focus Hours</th>
                <th className="px-5 py-2 font-extrabold text-ink">Load</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {summary.days.map((day) => (
                <tr key={day.date}>
                  <td className="px-5 py-2.5 font-bold text-ink">
                    {day.dayName}{' '}
                    <span className="font-mono text-[0.74rem] text-text-secondary">
                      {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-text-secondary">{day.eventCount}</td>
                  <td className="px-5 py-2.5 text-text-secondary">{day.meetingHours.toFixed(1)}h</td>
                  <td className="px-5 py-2.5 font-bold text-signal">{day.focusHours.toFixed(1)}h</td>
                  <td className="px-5 py-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-[0.72rem] font-extrabold ${TAG_COLOR[day.tag] ?? 'bg-wash text-text-secondary'}`}>
                      {day.tag === 'heavy' ? 'Heavy' : day.tag === 'light' ? 'Light' : 'Balanced'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
