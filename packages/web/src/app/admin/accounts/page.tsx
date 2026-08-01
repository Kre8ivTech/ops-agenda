import Link from 'next/link';

import { listAllAccounts, setAccountStatus } from '@/lib/admin/actions';
import { Button, ButtonLink } from '@/components/ui/button';

export default async function AdminAccountsPage() {
  const accounts = await listAllAccounts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Accounts</p>
          <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
            All tenant accounts
          </h1>
          <p className="text-text-secondary m-0 mt-2 text-[0.9rem]">{accounts.length} total</p>
        </div>
        <ButtonLink href="/admin/accounts/new" size="medium">
          + Create account
        </ButtonLink>
      </div>

      <div className="border-border overflow-hidden rounded-[8px] border bg-white">
        <table className="w-full border-collapse text-[0.85rem]">
          <thead>
            <tr className="border-border bg-wash border-b text-left">
              <th className="px-4 py-3 font-extrabold text-ink">Name</th>
              <th className="px-4 py-3 font-extrabold text-ink">Plan</th>
              <th className="px-4 py-3 font-extrabold text-ink">Status</th>
              <th className="px-4 py-3 font-extrabold text-ink">Users</th>
              <th className="px-4 py-3 font-extrabold text-ink">Created</th>
              <th className="px-4 py-3 font-extrabold text-ink">Action</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {accounts.map((acc) => (
              <tr key={acc.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/accounts/${acc.id}`}
                    className="text-signal hover:text-ink font-bold"
                  >
                    {acc.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-text-secondary">{acc.plan}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.75rem] font-extrabold ${
                      acc.status === 'active'
                        ? 'bg-wash-green text-signal'
                        : 'bg-risk-wash text-ink'
                    }`}
                  >
                    {acc.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">{acc.userCount}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {acc.createdAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <form
                    action={async () => {
                      'use server';
                      await setAccountStatus({
                        accountId: acc.id,
                        status: acc.status === 'active' ? 'suspended' : 'active',
                      });
                    }}
                  >
                    <Button type="submit" variant="secondary" size="small">
                      {acc.status === 'active' ? 'Suspend' : 'Reactivate'}
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-text-secondary">
                  No accounts yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
