import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  listAccounts,
  getFinanceMetrics,
  getCashFlow,
  type AccountRow,
  type TransactionRow,
  type FinanceMetrics,
  type CashFlowSummary,
} from '@/lib/finances/actions';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMoney(cents: number): string {
  const dollars = cents / 100;
  return dollars < 0
    ? `-$${Math.abs(dollars).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatMoneyFromString(centsStr: string): string {
  return formatMoney(parseInt(centsStr, 10) || 0);
}

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const STATE_BADGE: Record<string, { label: string; classes: string }> = {
  healthy: { label: 'Healthy', classes: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  below_threshold: { label: 'Below threshold', classes: 'bg-red-50 text-red-800 border-red-200' },
  statement_balance: { label: 'Statement balance', classes: 'bg-gray-50 text-gray-700 border-gray-200' },
  closed: { label: 'Closed', classes: 'bg-gray-50 text-gray-500 border-gray-200' },
};

const STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  contracted: { label: 'Contracted', classes: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  committed: { label: 'Committed', classes: 'bg-amber-50 text-amber-800 border-amber-200' },
  projected: { label: 'Projected', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  deferred: { label: 'Deferred', classes: 'bg-gray-50 text-gray-600 border-gray-200' },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function FinancesOverviewPage() {
  let accounts: AccountRow[] = [];
  let metrics: FinanceMetrics = { cashOnHand: 0, safeToSpend: 0, runwayMonths: 0, needsAttention: 0 };
  let cashFlow: CashFlowSummary = { totalIn: 0, totalOut: 0, net: 0, comingIn: [], goingOut: [] };

  try {
    [accounts, metrics, cashFlow] = await Promise.all([
      listAccounts(),
      getFinanceMetrics(),
      getCashFlow({ days: 30 }),
    ]);
  } catch {
    /* DB unavailable — render with empty state */
  }

  const belowThresholdAccounts = accounts.filter((a) => a.state === 'below_threshold');

  // Cash flow progress bar width
  const maxFlow = Math.max(cashFlow.totalIn, cashFlow.totalOut, 1);
  const inPct = Math.round((cashFlow.totalIn / maxFlow) * 100);
  const outPct = Math.round((cashFlow.totalOut / maxFlow) * 100);

  return (
    <div className="flex gap-8">
      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-signal mb-1 text-[0.76rem] font-extrabold uppercase">Finances</p>
            <h1 className="text-ink m-0 text-[1.55rem] font-extrabold tracking-[-0.02em]">Overview</h1>
            <p className="text-text-secondary m-0 mt-1 text-[0.85rem]">
              Read-only view of account balances, cash flow, and forecasted commitments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/finances/forecast"
              className="border-border text-ink hover:border-ink inline-flex h-9 items-center rounded-[8px] border bg-white px-4 text-[0.82rem] font-bold transition-colors"
            >
              Full forecast
            </Link>
            <Link
              href="/settings/connections"
              className="bg-ink inline-flex h-9 items-center rounded-[8px] px-4 text-[0.82rem] font-bold text-white transition-colors hover:bg-black"
            >
              Connect account
            </Link>
          </div>
        </header>

        {/* Entity filter chips */}
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="border-ink bg-ink inline-flex items-center rounded-full border px-3 py-1.5 text-[0.82rem] font-bold text-white">
            All entities
          </span>
        </div>

        {/* Metric cards */}
        <div className="mb-6 grid grid-cols-4 gap-4">
          <div className="border-border rounded-[8px] border bg-white px-4 py-4">
            <p className="text-text-secondary m-0 text-[0.68rem] font-extrabold uppercase tracking-wider">Cash on Hand</p>
            <p className="text-ink m-0 mt-1 text-[1.4rem] font-extrabold">{formatMoney(metrics.cashOnHand)}</p>
          </div>
          <div className="border-border rounded-[8px] border bg-white px-4 py-4">
            <p className="text-text-secondary m-0 text-[0.68rem] font-extrabold uppercase tracking-wider">Safe to Spend</p>
            <p className="text-ink m-0 mt-1 text-[1.4rem] font-extrabold">{formatMoney(metrics.safeToSpend)}</p>
          </div>
          <div className="border-border rounded-[8px] border bg-white px-4 py-4">
            <p className="text-text-secondary m-0 text-[0.68rem] font-extrabold uppercase tracking-wider">Runway</p>
            <p className="text-ink m-0 mt-1 text-[1.4rem] font-extrabold">{metrics.runwayMonths} mo</p>
          </div>
          <div className="border-border rounded-[8px] border bg-white px-4 py-4">
            <p className="text-text-secondary m-0 text-[0.68rem] font-extrabold uppercase tracking-wider">Needs Attention</p>
            <p className={`m-0 mt-1 text-[1.4rem] font-extrabold ${metrics.needsAttention > 0 ? 'text-red-700' : 'text-ink'}`}>
              {metrics.needsAttention}
            </p>
          </div>
        </div>

        {/* Alert banner */}
        {belowThresholdAccounts.length > 0 && (
          <div className="mb-6 flex items-center justify-between rounded-[8px] border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-red-100 text-[0.72rem] font-extrabold text-red-700">!</span>
              <p className="text-ink m-0 text-[0.85rem] font-bold">
                Operating — {belowThresholdAccounts[0].name} is below its threshold
              </p>
            </div>
            <Button variant="secondary" size="small">Review account</Button>
          </div>
        )}

        {/* MONEY IN AND OUT section */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-ink m-0 text-[1.1rem] font-extrabold">Money In and Out</h2>
              <p className="text-text-secondary m-0 mt-0.5 text-[0.82rem]">Next 30 days</p>
            </div>
            <div className="border-border flex overflow-hidden rounded-[6px] border bg-white">
              <span className="border-border bg-wash px-3 py-1.5 text-[0.76rem] font-bold">7</span>
              <span className="border-border bg-ink px-3 py-1.5 text-[0.76rem] font-bold text-white">30</span>
              <span className="px-3 py-1.5 text-[0.76rem] font-bold">90</span>
            </div>
          </div>

          {/* Big numbers */}
          <div className="mb-4 grid grid-cols-3 gap-6">
            <div>
              <p className="text-text-secondary m-0 text-[0.72rem] font-extrabold uppercase">In</p>
              <p className="m-0 mt-0.5 text-[1.3rem] font-extrabold text-emerald-700">{formatMoney(cashFlow.totalIn)}</p>
            </div>
            <div>
              <p className="text-text-secondary m-0 text-[0.72rem] font-extrabold uppercase">Out</p>
              <p className="m-0 mt-0.5 text-[1.3rem] font-extrabold text-red-700">{formatMoney(cashFlow.totalOut)}</p>
            </div>
            <div>
              <p className="text-text-secondary m-0 text-[0.72rem] font-extrabold uppercase">Net</p>
              <p className={`m-0 mt-0.5 text-[1.3rem] font-extrabold ${cashFlow.net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatMoney(cashFlow.net)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6 space-y-1.5">
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${inPct}%` }} />
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-red-500" style={{ width: `${outPct}%` }} />
            </div>
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-2 gap-6">
            {/* COMING IN */}
            <div>
              <p className="text-text-secondary mb-3 text-[0.72rem] font-extrabold uppercase tracking-wider">Coming In</p>
              <div className="space-y-2">
                {cashFlow.comingIn.length === 0 && (
                  <p className="text-text-secondary text-[0.82rem]">No inflows in this period.</p>
                )}
                {cashFlow.comingIn.map((tx) => (
                  <TransactionCard key={tx.id} tx={tx} />
                ))}
              </div>
            </div>
            {/* GOING OUT */}
            <div>
              <p className="text-text-secondary mb-3 text-[0.72rem] font-extrabold uppercase tracking-wider">Going Out</p>
              <div className="space-y-2">
                {cashFlow.goingOut.length === 0 && (
                  <p className="text-text-secondary text-[0.82rem]">No outflows in this period.</p>
                )}
                {cashFlow.goingOut.map((tx) => (
                  <TransactionCard key={tx.id} tx={tx} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ACCOUNTS section */}
        <section>
          <div className="mb-4">
            <h2 className="text-ink m-0 text-[1.1rem] font-extrabold">Accounts</h2>
            <p className="text-text-secondary m-0 mt-0.5 text-[0.82rem]">Where the money sits</p>
          </div>

          <div className="border-border overflow-hidden rounded-[8px] border bg-white">
            <table className="w-full text-left text-[0.82rem]">
              <thead>
                <tr className="border-border border-b bg-gray-50/50">
                  <th className="text-text-secondary px-4 py-2.5 text-[0.72rem] font-extrabold uppercase tracking-wider">Account</th>
                  <th className="text-text-secondary px-4 py-2.5 text-[0.72rem] font-extrabold uppercase tracking-wider">Entity</th>
                  <th className="text-text-secondary px-4 py-2.5 text-right text-[0.72rem] font-extrabold uppercase tracking-wider">Balance</th>
                  <th className="text-text-secondary px-4 py-2.5 text-right text-[0.72rem] font-extrabold uppercase tracking-wider">30 Days</th>
                  <th className="text-text-secondary px-4 py-2.5 text-[0.72rem] font-extrabold uppercase tracking-wider">State</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-text-secondary px-4 py-6 text-center">
                      No accounts connected. Connect a bank account to get started.
                    </td>
                  </tr>
                )}
                {accounts.map((acct) => {
                  const badge = STATE_BADGE[acct.state] ?? STATE_BADGE.healthy;
                  const isBelowThreshold = acct.state === 'below_threshold';
                  return (
                    <tr
                      key={acct.id}
                      className={`border-border border-b last:border-b-0 ${isBelowThreshold ? 'border-l-[3px] border-l-red-500' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <p className="text-ink m-0 font-bold">{acct.name}</p>
                        {acct.institution && (
                          <p className="text-text-secondary m-0 text-[0.76rem]">{acct.institution}</p>
                        )}
                      </td>
                      <td className="text-ink px-4 py-3">{acct.entityName ?? '—'}</td>
                      <td className="text-ink px-4 py-3 text-right font-bold">{formatMoneyFromString(acct.balance)}</td>
                      <td className="px-4 py-3 text-right">
                        {acct.change30d ? (
                          <span className={parseInt(acct.change30d, 10) >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                            {parseInt(acct.change30d, 10) >= 0 ? '+' : ''}{formatMoneyFromString(acct.change30d)}
                          </span>
                        ) : (
                          <span className="text-text-secondary">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[0.7rem] font-bold ${badge.classes}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Right sidebar */}
      <aside className="hidden w-[280px] shrink-0 xl:block">
        <div className="sticky top-6 space-y-6">
          {/* Cash Trough */}
          <div className="border-border rounded-[8px] border bg-white p-4">
            <p className="text-text-secondary m-0 mb-3 text-[0.72rem] font-extrabold uppercase tracking-wider">Cash Trough</p>
            {/* Mini chart placeholder */}
            <div className="border-border mb-3 flex h-24 items-center justify-center rounded-[6px] border border-dashed bg-gray-50">
              <span className="text-text-secondary text-[0.76rem]">Chart coming soon</span>
            </div>
            <p className="text-text-secondary m-0 text-[0.78rem] leading-[1.5]">
              The lowest point your combined cash balance will hit in the next 90 days based on committed and contracted cash flows.
            </p>
          </div>

          {/* What Safe to Spend Means */}
          <div className="border-border rounded-[8px] border bg-white p-4">
            <p className="text-text-secondary m-0 mb-3 text-[0.72rem] font-extrabold uppercase tracking-wider">What Safe to Spend Means</p>
            <p className="text-text-secondary m-0 text-[0.78rem] leading-[1.5]">
              Safe to Spend is your total cash on hand minus all committed and contracted outflows in the next 30 days. It tells you how much is genuinely available for discretionary spending without jeopardising fixed obligations.
            </p>
          </div>

          {/* Worth a Look */}
          <div className="border-border rounded-[8px] border bg-white p-4">
            <p className="text-text-secondary m-0 mb-3 text-[0.72rem] font-extrabold uppercase tracking-wider">Worth a Look</p>
            <ul className="m-0 list-none space-y-2 p-0">
              <li className="text-ink text-[0.8rem]">
                <span className="mr-1.5 inline-block size-1.5 rounded-full bg-amber-400" />
                2 subscriptions renewing this week
              </li>
              <li className="text-ink text-[0.8rem]">
                <span className="mr-1.5 inline-block size-1.5 rounded-full bg-red-400" />
                Quarterly tax estimate due in 12 days
              </li>
              <li className="text-ink text-[0.8rem]">
                <span className="mr-1.5 inline-block size-1.5 rounded-full bg-blue-400" />
                Forecast diverges from actuals by &gt;10%
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Transaction card sub-component
// ---------------------------------------------------------------------------

function TransactionCard({ tx }: { tx: TransactionRow }) {
  const badge = STATUS_BADGE[tx.status] ?? STATUS_BADGE.committed;

  return (
    <div className="border-border flex items-center justify-between rounded-[6px] border bg-white px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-ink m-0 truncate text-[0.82rem] font-bold">{tx.description}</p>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.66rem] font-bold ${badge.classes}`}>
            {badge.label}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-text-secondary text-[0.74rem]">{formatDate(tx.dueOn)}</span>
          {tx.recurrence && (
            <span className="text-text-secondary text-[0.74rem]">· {tx.recurrence}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-[0.9rem] font-bold ${tx.direction === 'in' ? 'text-emerald-700' : 'text-red-700'}`}>
          {tx.direction === 'in' ? '+' : '-'}{formatMoneyFromString(tx.amount)}
        </span>
        {!tx.isDeferred && tx.direction === 'out' && (
          <button className="text-text-secondary hover:text-ink text-[0.72rem] font-bold">Defer</button>
        )}
      </div>
    </div>
  );
}
