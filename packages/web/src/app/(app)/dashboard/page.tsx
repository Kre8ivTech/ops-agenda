import { auth } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Welcome{session?.user?.email ? `, ${session.user.email}` : ''}. The Daily Ops Brief will
        appear here in Phase 2.
      </p>
    </div>
  );
}
