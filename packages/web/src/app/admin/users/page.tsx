import { listAllUsers, setUserStatus } from '@/lib/admin/actions';
import { Button } from '@/components/ui/button';

export default async function AdminUsersPage() {
  const users = await listAllUsers();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Users</p>
        <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
          All users
        </h1>
        <p className="text-text-secondary m-0 mt-2 text-[0.9rem]">{users.length} total</p>
      </div>

      <div className="border-border overflow-hidden rounded-[8px] border bg-white">
        <table className="w-full border-collapse text-[0.85rem]">
          <thead>
            <tr className="border-border bg-wash border-b text-left">
              <th className="px-4 py-3 font-extrabold text-ink">Email</th>
              <th className="px-4 py-3 font-extrabold text-ink">Account</th>
              <th className="px-4 py-3 font-extrabold text-ink">Role</th>
              <th className="px-4 py-3 font-extrabold text-ink">Status</th>
              <th className="px-4 py-3 font-extrabold text-ink">Last seen</th>
              <th className="px-4 py-3 font-extrabold text-ink">Action</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-bold text-ink">{u.email}</td>
                <td className="px-4 py-3 text-text-secondary">{u.accountName}</td>
                <td className="px-4 py-3 text-text-secondary">{u.role}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.75rem] font-extrabold ${
                      u.status === 'active' ? 'bg-wash-green text-signal' : 'bg-risk-wash text-ink'
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {u.lastSeenAt ? u.lastSeenAt.toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <form
                    action={async () => {
                      'use server';
                      await setUserStatus({
                        accountId: u.accountId,
                        userId: u.id,
                        status: u.status === 'active' ? 'suspended' : 'active',
                      });
                    }}
                  >
                    <Button type="submit" variant="secondary" size="small">
                      {u.status === 'active' ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-text-secondary">
                  No users yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
