import { listPlatformAdmins, revokePlatformAdminAccess } from '@/lib/admin/actions';
import { Button } from '@/components/ui/button';

export default async function AdminPlatformAdminsPage() {
  const admins = await listPlatformAdmins();
  const active = admins.filter((a) => !a.revokedAt);
  const revoked = admins.filter((a) => a.revokedAt);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">
          Platform admins
        </p>
        <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
          Operator access
        </h1>
        <p className="text-text-secondary m-0 mt-2 text-[0.9rem]">
          {active.length} active operator{active.length !== 1 ? 's' : ''}.
          Platform admins are added via direct database insert for security.
        </p>
      </div>

      <div className="border-border overflow-hidden rounded-[8px] border bg-white">
        <table className="w-full border-collapse text-[0.85rem]">
          <thead>
            <tr className="border-border bg-wash border-b text-left">
              <th className="px-4 py-3 font-extrabold text-ink">Email</th>
              <th className="px-4 py-3 font-extrabold text-ink">Name</th>
              <th className="px-4 py-3 font-extrabold text-ink">Status</th>
              <th className="px-4 py-3 font-extrabold text-ink">Added</th>
              <th className="px-4 py-3 font-extrabold text-ink">Action</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {active.map((admin) => (
              <tr key={admin.id}>
                <td className="px-4 py-3 font-bold text-ink">{admin.email}</td>
                <td className="px-4 py-3 text-text-secondary">{admin.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-wash-green px-2.5 py-1 text-[0.75rem] font-extrabold text-signal">
                    active
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                  {admin.createdAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <form
                    action={async () => {
                      'use server';
                      await revokePlatformAdminAccess({ platformAdminId: admin.id });
                    }}
                  >
                    <Button type="submit" variant="secondary" size="small">
                      Revoke
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
            {active.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-text-secondary">
                  No active platform admins.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {revoked.length > 0 ? (
        <details className="border-border rounded-[8px] border bg-white">
          <summary className="text-text-secondary cursor-pointer px-4 py-3 text-[0.85rem] font-bold">
            {revoked.length} revoked admin{revoked.length !== 1 ? 's' : ''}
          </summary>
          <table className="w-full border-collapse text-[0.85rem]">
            <tbody className="divide-border divide-y">
              {revoked.map((admin) => (
                <tr key={admin.id} className="opacity-60">
                  <td className="px-4 py-3 text-ink">{admin.email}</td>
                  <td className="px-4 py-3 text-text-secondary">{admin.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-risk-wash px-2.5 py-1 text-[0.75rem] font-extrabold text-ink">
                      revoked
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                    {admin.revokedAt?.toLocaleDateString() ?? '—'}
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ) : null}
    </div>
  );
}
