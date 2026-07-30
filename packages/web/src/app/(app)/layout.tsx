import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { SignOutButton } from '@/components/sign-out-button';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="flex min-h-full">
      <aside className="w-64 border-r border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-8 font-semibold">Ops Agenda</div>
        <nav className="space-y-2 text-sm">
          <Link
            className="block rounded px-3 py-2 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            href="/dashboard"
          >
            Dashboard
          </Link>
          <Link
            className="block rounded px-3 py-2 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            href="/productivity/tasks"
          >
            Tasks
          </Link>
        </nav>
        <div className="mt-8">
          <div className="text-xs text-zinc-500">{session?.email}</div>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
