import { listRecentAuditEvents } from '@/lib/admin/actions';

export default async function AdminAuditPage() {
  const events = await listRecentAuditEvents(100);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Audit log</p>
        <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
          Recent activity across every account
        </h1>
        <p className="text-text-secondary m-0 mt-2 text-[0.9rem]">
          Showing the most recent {events.length} events.
        </p>
      </div>

      <div className="border-border overflow-hidden rounded-[8px] border bg-white">
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
            {events.map((event) => (
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
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-text-secondary">
                  No audit events yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
