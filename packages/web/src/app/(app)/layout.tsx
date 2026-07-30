import { Suspense } from 'react';

import { AppSidebar } from '@/components/chrome/app-sidebar';
import { DegradedBannerSlot } from '@/components/chrome/degraded-banner-slot';
import { EntitySwitcher } from '@/components/chrome/entity-switcher';
import { getSession } from '@/lib/auth';
import { countOpenTasks } from '@/lib/modules/counts';
import { resolveAppNav } from '@/lib/modules/nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  let taskOpenCount: number | undefined;
  if (session?.accountId && session?.userId) {
    taskOpenCount = await countOpenTasks({
      accountId: session.accountId,
      userId: session.userId,
    });
  }

  const nav = resolveAppNav({ tasks: taskOpenCount });

  return (
    <div className="bg-paper flex min-h-dvh">
      <AppSidebar
        nav={nav}
        user={{
          name: session?.name,
          email: session?.email,
          orgLabel: session?.accountId ? 'Workspace' : 'Local preview',
        }}
      />
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <main className="flex min-h-dvh min-w-0 flex-1 flex-col gap-[18px] bg-[linear-gradient(135deg,rgba(37,114,77,0.08),transparent_32rem),linear-gradient(315deg,rgba(49,93,143,0.09),transparent_34rem),var(--paper)] px-[26px] pb-[30px] pt-14 lg:pt-[22px]">
          <Suspense fallback={null}>
            <DegradedBannerSlot />
          </Suspense>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <EntitySwitcher />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
