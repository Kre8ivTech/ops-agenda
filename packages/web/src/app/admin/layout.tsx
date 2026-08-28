import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { SignOutButton } from '@/components/sign-out-button';
import { requirePlatformAdmin } from '@/lib/auth/platform-admin';

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/accounts', label: 'Accounts' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/connections', label: 'Connections' },
  { href: '/admin/integrations', label: 'Integrations' },
  { href: '/admin/ai', label: 'AI' },
  { href: '/admin/modules', label: 'Modules' },
  { href: '/admin/platform-admins', label: 'Admins' },
  { href: '/admin/audit', label: 'Audit log' },
  { href: '/admin/system', label: 'System' },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let email: string;
  try {
    ({ email } = await requirePlatformAdmin());
  } catch {
    redirect('/dashboard');
  }

  const headersList = await headers();
  const pathname = headersList.get('x-next-pathname') ?? headersList.get('x-invoke-path') ?? '/admin';

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
                className={`text-[0.85rem] font-bold transition-colors ${
                  isActive(pathname, item.href)
                    ? 'text-white'
                    : 'text-white/55 hover:text-white/85'
                }`}
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
      <main className="flex w-full flex-col gap-6 p-[2%]">
        {children}
      </main>
    </div>
  );
}
