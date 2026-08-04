import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { FilterChips, type FilterChipData } from '@/components/record-table/filter-chips';
import { MetricCards, type MetricCardData } from '@/components/record-table/metric-cards';
import { Pagination } from '@/components/record-table/pagination';
import {
  listEmails,
  markEmailHandled,
  reopenEmail,
  getEmailMetrics,
  type EmailFilter,
  type EmailRow,
} from '@/lib/email/actions';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const SIGNAL_BADGE_CLASSES: Record<string, string> = {
  action_required: 'bg-risk-wash text-ink',
  follow_up: 'bg-[#fff3cd] text-[#856404]',
  waiting: 'bg-wash-green text-signal',
  fyi: 'bg-wash text-text-secondary',
  newsletter: 'bg-wash text-text-secondary',
  none: 'bg-wash text-text-secondary',
};

function signalLabel(signal: string): string {
  return signal.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatReceived(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / (1000 * 60 * 60);
  if (diffH < 1) return `${Math.max(1, Math.round(diffMs / 60000))}m ago`;
  if (diffH < 24) return `${Math.round(diffH)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type EmailSearchParams = { filter?: string; page?: string };

function buildHref(current: EmailSearchParams, overrides: Partial<EmailSearchParams>): string {
  const params = new URLSearchParams();
  const merged = { ...current, ...overrides };
  if (merged.filter && merged.filter !== 'all') params.set('filter', merged.filter);
  if (merged.page && merged.page !== '1') params.set('page', merged.page);
  const query = params.toString();
  return query ? `/productivity/email?${query}` : '/productivity/email';
}

function parseFilter(raw?: string): EmailFilter {
  if (raw === 'action_required' || raw === 'follow_up' || raw === 'handled') return raw;
  return 'all';
}

function parsePage(raw?: string): number {
  const n = parseInt(raw ?? '1', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function EmailPage({
  searchParams,
}: {
  searchParams: Promise<EmailSearchParams>;
}) {
  const params = await searchParams;
  const filter = parseFilter(params.filter);
  const page = parsePage(params.page);

  const [result, metrics] = await Promise.all([
    listEmails({ filter, page }),
    getEmailMetrics(),
  ]);

  /* Metric cards */
  const metricCards: MetricCardData[] = [
    { label: 'Total Messages', value: String(metrics.total) },
    { label: 'Unread', value: String(metrics.unread) },
    {
      label: 'Action Required',
      value: String(metrics.actionRequired),
      tone: metrics.actionRequired > 0 ? 'risk' : 'default',
    },
    { label: 'Follow Up', value: String(metrics.followUp), tone: 'signal' },
  ];

  /* Filter chips */
  const chips: FilterChipData[] = [
    {
      key: 'all',
      label: 'All',
      count: result.counts.all,
      href: buildHref(params, { filter: 'all', page: '1' }),
      active: filter === 'all',
    },
    {
      key: 'action_required',
      label: 'Action Required',
      count: result.counts.actionRequired,
      href: buildHref(params, { filter: 'action_required', page: '1' }),
      active: filter === 'action_required',
    },
    {
      key: 'follow_up',
      label: 'Follow Up',
      count: result.counts.followUp,
      href: buildHref(params, { filter: 'follow_up', page: '1' }),
      active: filter === 'follow_up',
    },
    {
      key: 'handled',
      label: 'Handled',
      count: result.counts.handled,
      href: buildHref(params, { filter: 'handled', page: '1' }),
      active: filter === 'handled',
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
      {/* Header */}
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Productivity</p>
        <h1 className="text-ink m-0 text-[1.55rem] font-extrabold tracking-[-0.02em]">Email</h1>
        <p className="text-text-secondary m-0 mt-2 max-w-[62ch] text-[0.88rem] leading-[1.5]">
          AI-ranked messages across all connected accounts. Open in your provider — we never store
          bodies.
        </p>
      </div>

      {/* Metric cards */}
      <MetricCards items={metricCards} />

      {/* Filter chips */}
      <FilterChips chips={chips} />

      {/* Table */}
      {result.rows.length > 0 ? (
        <>
          {/* Column headers */}
          <div className="border-border hidden rounded-t-[8px] border border-b-0 bg-[var(--wash)] px-4 py-2.5 lg:grid lg:grid-cols-[80px_minmax(0,1fr)_minmax(0,1.5fr)_100px_120px_auto] lg:gap-3">
            <span className="text-text-secondary font-mono text-[0.72rem] font-extrabold uppercase">
              Priority
            </span>
            <span className="text-text-secondary font-mono text-[0.72rem] font-extrabold uppercase">
              From
            </span>
            <span className="text-text-secondary font-mono text-[0.72rem] font-extrabold uppercase">
              Subject
            </span>
            <span className="text-text-secondary font-mono text-[0.72rem] font-extrabold uppercase">
              Received
            </span>
            <span className="text-text-secondary font-mono text-[0.72rem] font-extrabold uppercase">
              Signal
            </span>
            <span className="text-text-secondary text-right font-mono text-[0.72rem] font-extrabold uppercase">
              Actions
            </span>
          </div>

          {/* Rows */}
          <ul className="divide-border border-border grid divide-y rounded-[8px] border bg-white lg:rounded-t-none">
            {result.rows.map((email) => (
              <EmailRowItem key={email.id} email={email} />
            ))}
          </ul>

          {/* Pagination */}
          <Pagination
            page={page}
            pageSize={25}
            total={result.total}
            buildHref={(nextPage) => buildHref(params, { page: String(nextPage) })}
          />
        </>
      ) : (
        /* Empty state */
        <div className="border-border text-text-secondary rounded-[8px] border bg-white px-4 py-8 text-center text-[0.88rem]">
          No emails synced yet. Connect an email account in Settings → Connections.
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Row Component                                                              */
/* -------------------------------------------------------------------------- */

function EmailRowItem({ email }: { email: EmailRow }) {
  const badgeClasses = SIGNAL_BADGE_CLASSES[email.signal] ?? SIGNAL_BADGE_CLASSES.none;
  const rankDisplay = email.rankScore ? `#${email.rankScore}` : '—';

  return (
    <li className="grid items-center gap-2 px-4 py-3 lg:grid-cols-[80px_minmax(0,1fr)_minmax(0,1.5fr)_100px_120px_auto] lg:gap-3">
      {/* Priority / Rank */}
      <span className="text-ink font-mono text-[0.82rem] font-bold">{rankDisplay}</span>

      {/* From */}
      <span className="text-ink truncate text-[0.88rem] font-medium">
        {email.fromName || email.fromAddress}
      </span>

      {/* Subject */}
      <span className="text-text-secondary truncate text-[0.85rem]">{email.subject}</span>

      {/* Received */}
      <span className="text-text-secondary text-[0.8rem]">{formatReceived(email.receivedAt)}</span>

      {/* Signal badge */}
      <span
        className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-extrabold uppercase ${badgeClasses}`}
      >
        {signalLabel(email.signal)}
      </span>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        {email.handledAt ? (
          <form
            action={async () => {
              'use server';
              await reopenEmail({ emailId: email.id });
            }}
          >
            <Button type="submit" size="small" variant="ghost">
              Reopen
            </Button>
          </form>
        ) : (
          <form
            action={async () => {
              'use server';
              await markEmailHandled({ emailId: email.id });
            }}
          >
            <Button type="submit" size="small" variant="ghost">
              Mark handled
            </Button>
          </form>
        )}
        {email.webLink && (
          <a
            href={email.webLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink hover:text-signal inline-flex items-center text-[0.82rem] font-extrabold transition-colors"
          >
            Open ↗
          </a>
        )}
      </div>
    </li>
  );
}
