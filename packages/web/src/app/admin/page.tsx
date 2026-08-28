import Link from 'next/link';

import { getAdminOverview } from '@/lib/admin/actions';

const connectionStatusColor: Record<string, string> = {
  healthy: 'bg-wash-green text-signal',
  degraded: 'bg-[#fff3cd] text-[#856404]',
  pending: 'bg-wash text-text-secondary',
  revoked: 'bg-risk-wash text-ink',
};

const attentionColor: Record<string, string> = {
  error: 'border-[#f5c2c7] bg-[#fff5f5]',
  warning: 'border-[#ffe69c] bg-[#fffbf0]',
};

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();
  const { accounts, users, connections, modules, integrations, ai, auditEvents, attention, database } =
    overview;

  const statCards = [
    {
      label: 'Accounts',
      value: String(accounts.total),
      note: `${accounts.active} active · ${accounts.suspended} suspended`,
      href: '/admin/accounts',
    },
    {
      label: 'Users',
      value: String(users.total),
      note: `${users.active} active · ${users.suspended} suspended`,
      href: '/admin/users',
    },
    {
      label: 'Connections',
      value: String(connections.total),
      note: `${connections.healthy} healthy · ${connections.degraded} degraded`,
      href: '/admin/connections',
    },
    {
      label: 'Integrations',
      value: String(integrations.total),
      note: `${integrations.enabled} enabled · ${integrations.testFailed} failed tests`,
      href: '/admin/integrations',
    },
    {
      label: 'AI requests',
      value: String(ai.totalRequests),
      note: `${formatPercent(ai.successRate)} success · ${Math.round(ai.avgLatencyMs)}ms avg`,
      href: '/admin/ai/usage',
    },
    {
      label: 'Database',
      value: database.ok ? `${database.latencyMs ?? 0}ms` : 'DOWN',
      note: database.ok ? 'PostgreSQL connected' : 'Check system health',
      href: '/admin/system',
    },
  ] as const;

  const connectionStatuses = [
    { key: 'healthy', label: 'Healthy', count: connections.healthy },
    { key: 'degraded', label: 'Degraded', count: connections.degraded },
    { key: 'pending', label: 'Pending', count: connections.pending },
    { key: 'revoked', label: 'Revoked', count: connections.revoked },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">
          Platform overview
        </p>
        <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
          Ops Agenda operations
        </h1>
        <p className="text-text-secondary m-0 mt-2 text-[0.9rem]">
          Current platform state across accounts, connections, integrations, and activity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="border-border hover:border-ink rounded-[8px] border bg-white p-5 transition-colors"
          >
            <p className="text-signal m-0 mb-1 text-[0.74rem] font-extrabold uppercase">
              {stat.label}
            </p>
            <strong className="text-ink text-[1.8rem] tracking-[-0.02em]">{stat.value}</strong>
            <p className="text-text-secondary m-0 mt-1 text-[0.82rem]">{stat.note}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="border-border rounded-[8px] border bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-ink m-0 text-[0.95rem] font-extrabold">Connection health</h2>
            <Link href="/admin/connections" className="text-signal hover:text-ink text-[0.82rem] font-bold">
              View all
            </Link>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {connectionStatuses.map((item) => (
              <span
                key={item.key}
                className={`rounded-full px-2.5 py-1 text-[0.75rem] font-extrabold ${
                  connectionStatusColor[item.key] ?? 'bg-wash text-text-secondary'
                }`}
              >
                {item.label}: {item.count}
              </span>
            ))}
          </div>
          <dl className="grid grid-cols-1 gap-3 text-[0.85rem] sm:grid-cols-2">
            <div>
              <dt className="text-text-secondary font-bold">With error codes</dt>
              <dd className="text-ink m-0 font-mono">{connections.withErrors}</dd>
            </div>
            <div>
              <dt className="text-text-secondary font-bold">Stale sync (&gt;24h)</dt>
              <dd className="text-ink m-0 font-mono">{connections.staleSync}</dd>
            </div>
          </dl>
        </section>

        <section className="border-border rounded-[8px] border bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-ink m-0 text-[0.95rem] font-extrabold">Module adoption</h2>
            <Link href="/admin/modules" className="text-signal hover:text-ink text-[0.82rem] font-bold">
              Manage
            </Link>
          </div>
          <p className="text-text-secondary m-0 mb-4 text-[0.85rem]">
            {modules.totalRows} flag{modules.totalRows !== 1 ? 's' : ''} across{' '}
            {modules.uniqueModules} module{modules.uniqueModules !== 1 ? 's' : ''} · {modules.enabled}{' '}
            enabled · {modules.disabled} disabled
          </p>
          {modules.byModule.length > 0 ? (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {modules.byModule.slice(0, 6).map((row) => (
                <li
                  key={row.module}
                  className="border-border flex items-center justify-between gap-3 rounded-[6px] border px-3 py-2 text-[0.85rem]"
                >
                  <span className="text-ink font-bold capitalize">{row.module}</span>
                  <span className="text-text-secondary font-mono">
                    {row.enabled}/{row.total} enabled
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-text-secondary m-0 text-[0.85rem]">No module flags configured yet.</p>
          )}
        </section>
      </div>

      {attention.length > 0 ? (
        <section className="border-border rounded-[8px] border bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-ink m-0 text-[0.95rem] font-extrabold">Needs attention</h2>
            <span className="text-text-secondary text-[0.82rem]">{attention.length} item{attention.length !== 1 ? 's' : ''}</span>
          </div>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {attention.map((item) => (
              <li key={`${item.href}-${item.label}`}>
                <Link
                  href={item.href}
                  className={`border flex flex-col gap-1 rounded-[8px] px-4 py-3 no-underline transition-colors hover:opacity-90 ${
                    attentionColor[item.severity]
                  }`}
                >
                  <span className="text-ink text-[0.88rem] font-extrabold">{item.label}</span>
                  <span className="text-text-secondary text-[0.82rem]">{item.detail}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="border-border overflow-hidden rounded-[8px] border bg-white">
        <div className="border-border flex items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="text-ink m-0 text-[0.95rem] font-extrabold">Recent audit activity</h2>
            <p className="text-text-secondary m-0 mt-1 text-[0.82rem]">
              Last {auditEvents.length} events across all accounts
            </p>
          </div>
          <Link href="/admin/audit" className="text-signal hover:text-ink text-[0.82rem] font-bold">
            Full audit log
          </Link>
        </div>
        <table className="w-full border-collapse text-[0.85rem]">
          <thead>
            <tr className="border-border bg-wash border-b text-left">
              <th className="px-4 py-3 font-extrabold text-ink">When</th>
              <th className="px-4 py-3 font-extrabold text-ink">Account</th>
              <th className="px-4 py-3 font-extrabold text-ink">Action</th>
              <th className="px-4 py-3 font-extrabold text-ink">Target</th>
              <th className="px-4 py-3 font-extrabold text-ink">Actor</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {auditEvents.map((event) => (
              <tr key={event.id}>
                <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                  {event.at.toLocaleString()}
                </td>
                <td className="px-4 py-3 font-bold text-ink">{event.accountName}</td>
                <td className="px-4 py-3 text-text-secondary">{event.action}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {event.targetType}:{event.targetId.slice(0, 8)}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {event.actorPlatformAdminId ? 'Platform admin' : (event.actorUserId ?? '—')}
                </td>
              </tr>
            ))}
            {auditEvents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-text-secondary">
                  No audit events yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
