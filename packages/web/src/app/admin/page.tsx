import Link from 'next/link';

import { listAllAccounts, listAllUsers } from '@/lib/admin/actions';

export default async function AdminOverviewPage() {
  const [accounts, users] = await Promise.all([listAllAccounts(), listAllUsers()]);
  const activeAccounts = accounts.filter((a) => a.status === 'active').length;
  const activeUsers = users.filter((u) => u.status === 'active').length;

  const stats = [
    { label: 'Accounts', value: accounts.length, href: '/admin/accounts', note: `${activeAccounts} active` },
    { label: 'Users', value: users.length, href: '/admin/users', note: `${activeUsers} active` },
    { label: 'Modules', value: undefined, href: '/admin/modules', note: 'Per-account flags' },
    { label: 'Audit log', value: undefined, href: '/admin/audit', note: 'Recent activity' },
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
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="border-border hover:border-ink rounded-[8px] border bg-white p-5 transition-colors"
          >
            <p className="text-signal m-0 mb-1 text-[0.74rem] font-extrabold uppercase">
              {stat.label}
            </p>
            {stat.value !== undefined ? (
              <strong className="text-ink text-[1.8rem] tracking-[-0.02em]">{stat.value}</strong>
            ) : null}
            <p className="text-text-secondary m-0 mt-1 text-[0.82rem]">{stat.note}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
