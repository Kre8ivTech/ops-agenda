import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SignOutButton } from '@/components/sign-out-button';
import { requirePlatformAdmin } from '@/lib/auth/platform-admin';

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/accounts', label: 'Accounts' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/modules', label: 'Modules' },
  { href: '/admin/audit', label: 'Audit log' },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let email: string;
  try {
    ({ email } = await requirePlatformAdmin());
  } catch {
    redirect('/dashboard');
  }

  return (
    <div className="bg-paper min-h-dvh">
      <header className="bg-ink flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-signal-on-ink font-mono text-[0.72rem] font-extrabold uppercase tracking-wide">
            Ops Agenda · Platform Admin
          </span>
          <nav className="flex flex-wrap gap-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[0.85rem] font-bold text-white/72 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[0.8rem] text-white/60">{email}</span>
          <SignOutButton variant="ink" />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
