import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { getSession } from '@/lib/auth';
import { listTimeEntries, getTimeMetrics, type TimeFilter, type TimeEntryRow } from '@/lib/time/actions';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATE_BADGE: Record<string, string> = {
  invoiced: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  unbilled: 'bg-amber-50 text-amber-800 border-amber-200',
  non_billable: 'bg-gray-100 text-gray-600 border-gray-200',
  written_off: 'bg-gray-100 text-gray-600 border-gray-200',
};

function stateLabel(state: string): string {
  if (state === 'invoiced') return 'Invoiced';
  if (state === 'unbilled') return 'Unbilled';
  if (state === 'non_billable') return 'Non-billable';
  if (state === 'written_off') return 'Written off';
  return state;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TimePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();

  if (!session?.accountId || !session?.userId) {
    return (
      <div className="border-border bg-risk-wash rounded-[8px] border p-4">
        <p className="text-ink font-bold">Complete onboarding to access Time Tracking.</p>
      </div>
    );
  }

  const filter: TimeFilter =
    params.filter === 'needs_attention' || params.filter === 'settled'
      ? params.filter
      : 'all';
  const search = params.q?.trim() || undefined;

  let result: Awaited<ReturnType<typeof listTimeEntries>> | null = null;
  let metrics: Awaited<ReturnType<typeof getTimeMetrics>> | null = null;
  let unavailable = false;

  try {
    [result, metrics] = await Promise.all([
      listTimeEntries({ filter, search }),
      getTimeMetrics(),
    ]);
  } catch {
    unavailable = true;
  }

  const rows = result?.rows ?? [];
  const counts = result?.counts ?? { all: 0, needsAttention: 0, settled: 0 };

  // Compute unbilled clients for sidebar
  const unbilledByClient: Record<string, number> = {};
  for (const row of rows) {
    if (row.state === 'unbilled' && row.billableAmount) {
      unbilledByClient[row.client] =
        (unbilledByClient[row.client] ?? 0) + Number(row.billableAmount);
    }
  }
  const totalAtRisk = Object.values(unbilledByClient).reduce((sum, v) => sum + v, 0);

  // Active count for the current filter
  const activeCount =
    filter === 'needs_attention'
      ? counts.needsAttention
      : filter === 'settled'
        ? counts.settled
        : counts.all;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] gap-6">
      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Productivity</p>
            <h1 className="text-ink m-0 text-[1.55rem] font-extrabold tracking-[-0.02em]">Time</h1>
            <p className="text-text-secondary m-0 mt-1 text-[0.88rem]">
              Track billable hours, monitor utilisation, and stay on top of unbilled work.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              placeholder="Filter entries…"
              defaultValue={search ?? ''}
              className="border-border text-ink placeholder:text-text-secondary h-9 rounded-[8px] border bg-white px-3 text-[0.85rem] focus:outline-none focus:ring-2 focus:ring-signal/30"
            />
            <Button variant="primary" size="medium">Log time</Button>
          </div>
        </div>

        {unavailable ? (
          <div className="border-border bg-info-wash text-ink rounded-[8px] border px-3.5 py-3 text-[0.85rem]">
            Database is not connected. Set <code className="font-mono text-[0.8rem]">DATABASE_URL</code> to load time entries.
          </div>
        ) : (
          <>
            {/* Metric cards */}
            <div className="grid grid-cols-4 gap-3">
              <MetricCard label="Tracked This Week" value={`${metrics?.trackedThisWeek ?? 0}h`} />
              <MetricCard label="Billable" value={`${metrics?.billableHours ?? 0}h`} tone="signal" />
              <MetricCard label="Unbilled" value={`${metrics?.unbilledHours ?? 0}h`} tone="risk" />
              <MetricCard label="Rate Realised" value={formatCurrency(metrics?.rateRealised ?? 0)} />
            </div>

            {/* Section header with filter chips */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-text-secondary m-0 text-[0.72rem] font-extrabold uppercase tracking-wider">
                This Week by Client
              </p>
              <div className="flex items-center gap-2">
                {([
                  { key: 'all' as const, label: 'All', count: counts.all },
                  { key: 'needs_attention' as const, label: 'Needs attention', count: counts.needsAttention },
                  { key: 'settled' as const, label: 'Settled', count: counts.settled },
                ]).map((chip) => (
                  <Link
                    key={chip.key}
                    href={`/productivity/time?filter=${chip.key}${search ? `&q=${encodeURIComponent(search)}` : ''}`}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.82rem] font-bold transition-colors ${
                      filter === chip.key
                        ? 'border-ink bg-ink text-white'
                        : 'border-border bg-white text-ink hover:border-ink'
                    }`}
                  >
                    {chip.label}
                    <span className={`text-[0.72rem] ${filter === chip.key ? 'text-white/70' : 'text-text-secondary'}`}>
                      {chip.count}
                    </span>
                  </Link>
                ))}
              </div>
              <span className="text-text-secondary text-[0.82rem]">
                {activeCount} entr{activeCount === 1 ? 'y' : 'ies'}
              </span>
            </div>

            {/* Table */}
            <div className="border-border overflow-hidden rounded-[8px] border bg-white">
              {/* Table header */}
              <div className="border-border grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_80px_100px_110px] gap-3 border-b bg-[var(--wash)] px-4 py-2.5">
                <span className="text-text-secondary font-mono text-[0.72rem] font-extrabold uppercase">Client</span>
                <span className="text-text-secondary font-mono text-[0.72rem] font-extrabold uppercase">Entity</span>
                <span className="text-text-secondary text-right font-mono text-[0.72rem] font-extrabold uppercase">Hours</span>
                <span className="text-text-secondary text-right font-mono text-[0.72rem] font-extrabold uppercase">Billable</span>
                <span className="text-text-secondary text-right font-mono text-[0.72rem] font-extrabold uppercase">State</span>
              </div>

              {/* Table rows */}
              {rows.length > 0 ? (
                rows.map((entry) => <TimeRow key={entry.id} entry={entry} />)
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-text-secondary text-[0.88rem]">
                    {search || filter !== 'all'
                      ? 'No time entries match this filter.'
                      : 'No time entries yet. Log your first entry above.'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right sidebar */}
      <aside className="hidden w-[280px] shrink-0 flex-col gap-5 xl:flex">
        {/* Cross-module */}
        <div className="border-border rounded-[8px] border bg-white">
          <div className="border-border border-b px-4 py-2.5">
            <p className="text-text-secondary m-0 text-[0.68rem] font-extrabold uppercase tracking-wider">
              Cross-Module
            </p>
          </div>
          <div className="px-4 py-3">
            <Link
              href="/productivity/capacity"
              className="text-signal text-[0.85rem] font-bold hover:underline"
            >
              Capacity planner →
            </Link>
            <p className="text-text-secondary m-0 mt-1 text-[0.78rem]">
              See how tracked hours map to your weekly capacity targets.
            </p>
          </div>
        </div>

        {/* Unbilled summary */}
        <div className="border-border rounded-[8px] border bg-white">
          <div className="border-border border-b px-4 py-2.5">
            <p className="text-text-secondary m-0 text-[0.68rem] font-extrabold uppercase tracking-wider">
              Unbilled
            </p>
          </div>
          <div className="flex flex-col gap-2 px-4 py-3">
            {Object.entries(unbilledByClient).length > 0 ? (
              Object.entries(unbilledByClient).map(([client, amount]) => (
                <div key={client} className="flex items-center justify-between">
                  <span className="text-ink text-[0.82rem] font-semibold">{client}</span>
                  <span className="text-text-secondary text-[0.78rem]">
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-text-secondary m-0 text-[0.82rem]">No unbilled entries.</p>
            )}
          </div>
          {totalAtRisk > 0 && (
            <div className="border-border border-t px-4 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-ink text-[0.78rem] font-extrabold">Total at risk</span>
                <span className="text-risk text-[0.88rem] font-extrabold">
                  {formatCurrency(totalAtRisk)}
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------

function MetricCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const valueColor = tone === 'signal' ? 'text-signal' : tone === 'risk' ? 'text-risk' : 'text-ink';
  return (
    <div className="rounded-[8px] border border-border bg-white px-4 py-3">
      <p className="m-0 text-[0.68rem] font-extrabold uppercase text-text-secondary">{label}</p>
      <p className={`m-0 mt-1 text-[1.5rem] font-extrabold ${valueColor}`}>{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Time Row
// ---------------------------------------------------------------------------

function TimeRow({ entry }: { entry: TimeEntryRow }) {
  return (
    <div className="border-border grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_80px_100px_110px] items-center gap-3 border-b px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-ink m-0 truncate text-[0.85rem] font-bold">{entry.client}</p>
        {entry.description && (
          <p className="text-text-secondary m-0 mt-0.5 truncate text-[0.76rem]">{entry.description}</p>
        )}
      </div>
      <span className="text-text-secondary truncate text-[0.82rem]">{entry.entityName ?? '—'}</span>
      <span className="text-ink text-right text-[0.88rem] font-bold">{entry.hours}h</span>
      <span className="text-text-secondary text-right text-[0.82rem]">
        {entry.billableAmount ? formatCurrency(Number(entry.billableAmount)) : '—'}
      </span>
      <div className="flex justify-end">
        <span
          className={`inline-block rounded-full border px-2 py-0.5 text-[0.72rem] font-extrabold ${STATE_BADGE[entry.state] ?? STATE_BADGE.non_billable}`}
        >
          {stateLabel(entry.state)}
        </span>
      </div>
    </div>
  );
}
