import Link from 'next/link';

import { listAllConnections } from '@/lib/admin/actions';

const statusColor: Record<string, string> = {
  healthy: 'bg-wash-green text-signal',
  degraded: 'bg-[#fff3cd] text-[#856404]',
  pending: 'bg-wash text-text-secondary',
  revoked: 'bg-risk-wash text-ink',
};

export default async function AdminConnectionsPage() {
  const connections = await listAllConnections();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Connections</p>
        <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
          All data connections
        </h1>
        <p className="text-text-secondary m-0 mt-2 text-[0.9rem]">
          {connections.length} connection{connections.length !== 1 ? 's' : ''} across all accounts
        </p>
      </div>

      <div className="border-border overflow-hidden rounded-[8px] border bg-white">
        <table className="w-full border-collapse text-[0.85rem]">
          <thead>
            <tr className="border-border bg-wash border-b text-left">
              <th className="px-4 py-3 font-extrabold text-ink">Account</th>
              <th className="px-4 py-3 font-extrabold text-ink">Provider</th>
              <th className="px-4 py-3 font-extrabold text-ink">Kind</th>
              <th className="px-4 py-3 font-extrabold text-ink">Status</th>
              <th className="px-4 py-3 font-extrabold text-ink">Last sync</th>
              <th className="px-4 py-3 font-extrabold text-ink">Error</th>
              <th className="px-4 py-3 font-extrabold text-ink">Created</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {connections.map((conn) => (
              <tr key={conn.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/accounts/${conn.accountId}`}
                    className="text-signal hover:text-ink font-bold"
                  >
                    {conn.accountName}
                  </Link>
                </td>
                <td className="px-4 py-3 font-bold text-ink">{conn.provider}</td>
                <td className="px-4 py-3 text-text-secondary">{conn.kind}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.75rem] font-extrabold ${
                      statusColor[conn.status] ?? 'bg-wash text-text-secondary'
                    }`}
                  >
                    {conn.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                  {conn.lastSyncAt ? conn.lastSyncAt.toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {conn.lastErrorCode ?? '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                  {conn.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
            {connections.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-text-secondary">
                  No connections yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
