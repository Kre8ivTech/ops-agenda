import Link from 'next/link';

import { BusinessSelector } from '@/components/finances/business-selector';
import { ButtonLink } from '@/components/ui/button';
import { getBusinessFinanceData, type BusinessTransactionRow } from '@/lib/finances/actions';
import {
  BUSINESS_PERIODS,
  parseBusinessPeriod,
  summarizeBusinessFinances,
  type BusinessPeriod,
  type BusinessTrendPoint,
} from '@/lib/finances/business-metrics';

type BusinessSearchParams = { period?: string | string[] };

const PERIOD_LABELS: Record<BusinessPeriod, string> = {
  30: '30 days',
  90: '90 days',
  365: '12 months',
};

const STATUS_STYLES: Record<string, string> = {
  committed: 'bg-wash-green text-signal',
  contracted: 'bg-info-wash text-info',
  projected: 'bg-[#f5ead2] text-[#775b20]',
  deferred: 'bg-wash text-text-secondary',
};

function formatMoney(cents: number, compact = false): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 0 : 2,
  }).format(cents / 100);
}

function formatDate(date: Date | null): string {
  if (!date) return 'No date';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function titleCase(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

export default async function BusinessPage({
  searchParams,
}: {
  searchParams: Promise<BusinessSearchParams>;
}) {
  const params = await searchParams;
  const period = parseBusinessPeriod(params.period);
  let data: Awaited<ReturnType<typeof getBusinessFinanceData>> | null = null;
  let unavailable = false;

  try {
    data = await getBusinessFinanceData({ days: period });
  } catch {
    unavailable = true;
  }

  const summary = summarizeBusinessFinances(data?.transactions ?? [], { days: period });
  const accountBalance = (data?.accounts ?? []).reduce(
    (total, account) => total + (Number.parseInt(account.balance, 10) || 0),
    0,
  );
  const scopeLabel = data?.selectedBusiness?.name ?? 'All businesses';

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Finances</p>
          <h1 className="text-ink m-0 text-[1.75rem] font-extrabold tracking-[-0.035em]">Business finances</h1>
          <p className="text-text-secondary m-0 mt-2 max-w-[64ch] text-[0.9rem] leading-[1.55]">
            Revenue, operating expenses, and account activity for each business entity.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {data && data.businesses.length > 0 ? (
            <BusinessSelector
              key={data.selectedBusiness?.id ?? 'all'}
              businesses={data.businesses}
              selectedBusinessId={data.selectedBusiness?.id ?? 'all'}
            />
          ) : null}
          <ButtonLink href="/finances/connect" variant="secondary" size="medium">
            Connect account
          </ButtonLink>
        </div>
      </header>

      {unavailable ? (
        <section className="border-border bg-info-wash rounded-[10px] border px-5 py-4" role="status">
          <h2 className="text-ink m-0 text-[0.95rem] font-extrabold">Finance data is unavailable</h2>
          <p className="text-text-secondary m-0 mt-1 text-[0.82rem]">
            The database connection could not be reached. Try again after the connection is restored.
          </p>
        </section>
      ) : data && data.businesses.length === 0 ? (
        <section className="border-border relative overflow-hidden rounded-[12px] border bg-white px-6 py-12 sm:px-10">
          <div className="bg-wash-green absolute -right-16 -top-20 size-64 rounded-full opacity-70" aria-hidden="true" />
          <div className="relative max-w-[34rem]">
            <p className="text-signal m-0 text-[0.72rem] font-extrabold uppercase tracking-[0.1em]">First step</p>
            <h2 className="text-ink m-0 mt-2 text-[1.35rem] font-extrabold tracking-[-0.02em]">Add a business entity</h2>
            <p className="text-text-secondary m-0 mt-2 text-[0.88rem] leading-[1.55]">
              Create the company, then assign its financial accounts so revenue and expenses stay separated from personal activity.
            </p>
            <ButtonLink href="/settings/connections" className="mt-5" size="medium">
              Add a business
            </ButtonLink>
          </div>
        </section>
      ) : data ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <p className="text-ink m-0 text-[0.88rem] font-extrabold">{scopeLabel}</p>
              <p className="text-text-secondary m-0 mt-0.5 text-[0.76rem]">
                {data.accounts.length} account{data.accounts.length === 1 ? '' : 's'} · {data.transactions.length} transaction{data.transactions.length === 1 ? '' : 's'} in view
              </p>
            </div>
            <nav className="border-border flex rounded-[8px] border bg-white p-1" aria-label="Finance period">
              {BUSINESS_PERIODS.map((option) => {
                const active = option === period;
                return (
                  <Link
                    key={option}
                    href={`/finances/business?period=${option}`}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-[6px] px-3 py-1.5 text-[0.76rem] font-extrabold transition-colors focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--wash-green)] ${
                      active ? 'bg-ink text-white' : 'text-text-secondary hover:bg-wash hover:text-ink'
                    }`}
                  >
                    {PERIOD_LABELS[option]}
                  </Link>
                );
              })}
            </nav>
          </div>

          <section className="bg-ink relative overflow-hidden rounded-[12px] px-5 py-5 text-white shadow-[0_20px_50px_rgba(22,32,27,0.14)] sm:px-6 sm:py-6">
            <div className="bg-signal absolute -right-24 -top-36 size-80 rounded-full opacity-20 blur-2xl" aria-hidden="true" />
            <div className="relative grid gap-6 md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))] md:items-end">
              <div>
                <p className="text-signal-on-ink m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.1em]">Net income · {PERIOD_LABELS[period]}</p>
                <p className={`m-0 mt-2 font-mono text-[2.1rem] font-bold tracking-[-0.05em] tabular-nums ${summary.net < 0 ? 'text-[#f0aaa3]' : 'text-white'}`}>
                  {formatMoney(summary.net, true)}
                </p>
                <p className="m-0 mt-1 text-[0.76rem] text-white/55">Revenue minus recorded operating expenses</p>
              </div>
              <SummaryMetric label="Revenue" value={formatMoney(summary.revenue, true)} tone="positive" />
              <SummaryMetric label="Expenses" value={formatMoney(summary.expenses, true)} tone="negative" />
              <SummaryMetric
                label="Account balance"
                value={formatMoney(accountBalance, true)}
                detail={`${Math.round(summary.margin * 100)}% margin`}
              />
            </div>
          </section>

          {data.transactions.length === 0 ? (
            <section className="border-border grid gap-5 rounded-[12px] border bg-white px-6 py-8 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <h2 className="text-ink m-0 text-[1.05rem] font-extrabold">No business activity in this period</h2>
                <p className="text-text-secondary m-0 mt-1.5 max-w-[58ch] text-[0.84rem] leading-[1.5]">
                  Choose a longer period, select another business, or connect an account assigned to {scopeLabel}.
                </p>
              </div>
              <ButtonLink href="/finances/connect" size="medium">Connect account</ButtonLink>
            </section>
          ) : (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(280px,0.75fr)]">
              <section className="border-border min-w-0 rounded-[12px] border bg-white p-5 sm:p-6" aria-labelledby="cash-activity-heading">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 id="cash-activity-heading" className="text-ink m-0 text-[1.05rem] font-extrabold">Revenue and expenses</h2>
                    <p className="text-text-secondary m-0 mt-1 text-[0.78rem]">Rolling {PERIOD_LABELS[period].toLowerCase()}</p>
                  </div>
                  <div className="flex items-center gap-4 text-[0.72rem] font-bold text-text-secondary" aria-hidden="true">
                    <span><span className="bg-signal mr-1.5 inline-block size-2.5 rounded-[2px]" />Revenue</span>
                    <span><span className="bg-risk mr-1.5 inline-block size-2.5 rounded-[2px]" />Expenses</span>
                  </div>
                </div>
                <TrendChart points={summary.trend} />
              </section>

              <aside className="border-border rounded-[12px] border bg-white p-5 sm:p-6" aria-labelledby="expense-heading">
                <h2 id="expense-heading" className="text-ink m-0 text-[1.05rem] font-extrabold">Expense mix</h2>
                <p className="text-text-secondary m-0 mt-1 text-[0.78rem]">Where operating costs went</p>
                <div className="mt-5 grid gap-4">
                  {summary.categories.length === 0 ? (
                    <p className="text-text-secondary m-0 text-[0.82rem]">No expenses in this period.</p>
                  ) : (
                    summary.categories.slice(0, 6).map((category) => (
                      <div key={category.name}>
                        <div className="mb-1.5 flex items-baseline justify-between gap-3">
                          <span className="text-ink truncate text-[0.8rem] font-bold">{category.name}</span>
                          <span className="text-text-secondary shrink-0 font-mono text-[0.75rem] tabular-nums">{formatMoney(category.amount, true)}</span>
                        </div>
                        <div className="bg-wash h-1.5 overflow-hidden rounded-full">
                          <div className="bg-risk h-full rounded-full" style={{ width: `${Math.max(category.share * 100, 2)}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </aside>
            </div>
          )}

          <AccountsSection accounts={data.accounts} />
          <TransactionsSection transactions={data.transactions} />
        </>
      ) : null}
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: 'positive' | 'negative';
}) {
  return (
    <div className="border-t border-white/12 pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
      <p className="m-0 text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-white/50">{label}</p>
      <p className={`m-0 mt-1.5 font-mono text-[1.2rem] font-bold tabular-nums ${tone === 'positive' ? 'text-signal-on-ink' : tone === 'negative' ? 'text-[#f0aaa3]' : 'text-white'}`}>
        {value}
      </p>
      {detail ? <p className="m-0 mt-1 text-[0.7rem] text-white/50">{detail}</p> : null}
    </div>
  );
}

function TrendChart({ points }: { points: BusinessTrendPoint[] }) {
  const maxValue = Math.max(...points.flatMap((point) => [point.revenue, point.expenses]), 0);
  if (maxValue === 0) {
    return <div className="bg-wash text-text-secondary mt-6 grid h-52 place-items-center rounded-[8px] text-[0.82rem]">No activity to chart.</div>;
  }

  const width = 720;
  const height = 250;
  const chartTop = 12;
  const chartBottom = 205;
  const chartHeight = chartBottom - chartTop;
  const groupWidth = width / points.length;
  const barWidth = Math.min(16, groupWidth * 0.2);

  return (
    <div className="mt-5 overflow-x-auto">
      <svg className="h-[250px] min-w-[620px] w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="trend-title trend-description">
        <title id="trend-title">Revenue and expense trend</title>
        <desc id="trend-description">Grouped bars compare revenue and expenses across the selected period.</desc>
        {[0, 0.5, 1].map((ratio) => {
          const y = chartBottom - ratio * chartHeight;
          return <line key={ratio} x1="0" x2={width} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" />;
        })}
        {points.map((point, index) => {
          const center = index * groupWidth + groupWidth / 2;
          const revenueHeight = (point.revenue / maxValue) * chartHeight;
          const expenseHeight = (point.expenses / maxValue) * chartHeight;
          return (
            <g key={`${point.label}-${index}`}>
              <rect x={center - barWidth - 2} y={chartBottom - revenueHeight} width={barWidth} height={Math.max(revenueHeight, 1)} rx="3" fill="var(--signal)" />
              <rect x={center + 2} y={chartBottom - expenseHeight} width={barWidth} height={Math.max(expenseHeight, 1)} rx="3" fill="var(--risk)" />
              <text x={center} y="232" textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontWeight="650">{point.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function AccountsSection({ accounts }: { accounts: Awaited<ReturnType<typeof getBusinessFinanceData>>['accounts'] }) {
  if (accounts.length === 0) return null;

  return (
    <section aria-labelledby="business-accounts-heading">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id="business-accounts-heading" className="text-ink m-0 text-[1.05rem] font-extrabold">Business accounts</h2>
          <p className="text-text-secondary m-0 mt-1 text-[0.78rem]">Accounts assigned to the selected business scope</p>
        </div>
        <Link href="/finances/connect" className="text-signal hover:text-ink text-[0.78rem] font-extrabold transition-colors">Manage accounts →</Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {accounts.map((account) => {
          const change = Number.parseInt(account.change30d ?? '0', 10) || 0;
          return (
            <article key={account.id} className="border-border rounded-[10px] border bg-white px-4 py-4 transition-colors hover:border-[#aab8ae]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-ink m-0 truncate text-[0.86rem] font-extrabold">{account.name}</h3>
                  <p className="text-text-secondary m-0 mt-1 truncate text-[0.74rem]">{account.institution ?? titleCase(account.kind)}</p>
                </div>
                <span className={`shrink-0 rounded-[5px] px-2 py-1 text-[0.66rem] font-extrabold ${account.state === 'below_threshold' ? 'bg-risk-wash text-risk' : 'bg-wash-green text-signal'}`}>
                  {titleCase(account.state)}
                </span>
              </div>
              <p className="text-ink m-0 mt-5 font-mono text-[1.2rem] font-bold tabular-nums">{formatMoney(Number.parseInt(account.balance, 10) || 0)}</p>
              <p className={`m-0 mt-1 text-[0.72rem] font-bold ${change < 0 ? 'text-risk' : change > 0 ? 'text-signal' : 'text-text-secondary'}`}>
                {change === 0 ? 'No 30-day change' : `${change > 0 ? '+' : ''}${formatMoney(change)} over 30 days`}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function TransactionsSection({ transactions }: { transactions: BusinessTransactionRow[] }) {
  if (transactions.length === 0) return null;
  const visibleTransactions = transactions.slice(0, 20);

  return (
    <section className="border-border overflow-hidden rounded-[12px] border bg-white" aria-labelledby="business-transactions-heading">
      <div className="border-border flex flex-wrap items-end justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 id="business-transactions-heading" className="text-ink m-0 text-[1.05rem] font-extrabold">Recent activity</h2>
          <p className="text-text-secondary m-0 mt-1 text-[0.76rem]">Showing {visibleTransactions.length} of {transactions.length} transactions</p>
        </div>
        <span className="text-text-secondary text-[0.72rem]">Read-only</span>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[780px] border-collapse text-left text-[0.8rem]">
          <thead>
            <tr className="bg-wash/60 text-text-secondary">
              <th className="px-5 py-2.5 text-[0.68rem] font-extrabold uppercase tracking-[0.06em]">Date</th>
              <th className="px-5 py-2.5 text-[0.68rem] font-extrabold uppercase tracking-[0.06em]">Description</th>
              <th className="px-5 py-2.5 text-[0.68rem] font-extrabold uppercase tracking-[0.06em]">Category</th>
              <th className="px-5 py-2.5 text-[0.68rem] font-extrabold uppercase tracking-[0.06em]">Status</th>
              <th className="px-5 py-2.5 text-right text-[0.68rem] font-extrabold uppercase tracking-[0.06em]">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {visibleTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-wash/45 transition-colors">
                <td className="text-text-secondary whitespace-nowrap px-5 py-3">{formatDate(transaction.dueOn)}</td>
                <td className="px-5 py-3">
                  <p className="text-ink m-0 max-w-[26rem] truncate font-extrabold">{transaction.description}</p>
                  <p className="text-text-secondary m-0 mt-0.5 text-[0.72rem]">{transaction.accountName ?? transaction.entityName ?? 'Business account'}</p>
                </td>
                <td className="text-text-secondary px-5 py-3">{transaction.category ?? 'Uncategorized'}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-[5px] px-2 py-1 text-[0.66rem] font-extrabold ${STATUS_STYLES[transaction.status] ?? STATUS_STYLES.committed}`}>{titleCase(transaction.status)}</span>
                </td>
                <td className={`whitespace-nowrap px-5 py-3 text-right font-mono font-bold tabular-nums ${transaction.direction === 'in' ? 'text-signal' : 'text-risk'}`}>
                  {transaction.direction === 'in' ? '+' : '−'}{formatMoney(Number.parseInt(transaction.amount, 10) || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-border divide-y md:hidden">
        {visibleTransactions.map((transaction) => (
          <article key={transaction.id} className="px-4 py-3.5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-ink m-0 truncate text-[0.82rem] font-extrabold">{transaction.description}</h3>
                <p className="text-text-secondary m-0 mt-1 text-[0.72rem]">{formatDate(transaction.dueOn)} · {transaction.category ?? 'Uncategorized'}</p>
              </div>
              <span className={`shrink-0 font-mono text-[0.82rem] font-bold tabular-nums ${transaction.direction === 'in' ? 'text-signal' : 'text-risk'}`}>
                {transaction.direction === 'in' ? '+' : '−'}{formatMoney(Number.parseInt(transaction.amount, 10) || 0)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
