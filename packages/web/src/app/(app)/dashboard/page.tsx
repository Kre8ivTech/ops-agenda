import Link from 'next/link';

import { DueOutsPanel } from '@/components/dashboard/due-outs-panel';
import { PriorityCard } from '@/components/dashboard/priority-card';
import { Button, ButtonLink } from '@/components/ui/button';
import { getSession } from '@/lib/auth';
import {
  buildNarrative,
  capacityStatus,
  formatDashboardDate,
  greetingName,
  plannedPercent,
  selectDueOuts,
  selectTopPriorities,
} from '@/lib/dashboard/brief';
import { refreshDashboardAction } from '@/lib/dashboard/actions';
import { listDashboardTasks } from '@/lib/tasks/actions';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.accountId || !session?.userId) {
    return (
      <div className="rounded-[8px] border border-border bg-risk-wash p-4 text-ink">
        <h1 className="text-lg font-extrabold">Dashboard</h1>
        <p className="mt-2 text-[0.95rem] text-text-secondary">
          Your session is not linked to a tenant account. Complete onboarding to continue.
        </p>
        <ButtonLink href="/onboarding" className="mt-4" size="medium">
          Continue onboarding
        </ButtonLink>
      </div>
    );
  }

  const tenant = { accountId: session.accountId, userId: session.userId };
  const now = new Date();
  let tasks: Awaited<ReturnType<typeof listDashboardTasks>> = [];
  let tasksUnavailable = false;
  try {
    tasks = await listDashboardTasks(tenant);
  } catch {
    // No DATABASE_URL / unreachable Postgres — still render the shell.
    tasksUnavailable = true;
  }
  const priorities = selectTopPriorities(tasks, 3);
  const dueOuts = selectDueOuts(tasks, 6);
  const narrative = buildNarrative(tasks, now);
  const planned = plannedPercent(tasks, now);
  const capacity = capacityStatus(tasks, now);
  const firstName = greetingName(session);

  return (
    <div className="-m-8 min-h-full bg-[linear-gradient(135deg,rgba(37,114,77,0.08),transparent_32rem),linear-gradient(315deg,rgba(49,93,143,0.09),transparent_34rem),var(--paper)] px-[26px] py-[22px] pb-[30px]">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-[18px]">
        <header className="flex flex-col gap-4 pb-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1.5 text-[0.76rem] font-extrabold uppercase text-signal">
              {formatDashboardDate(now)}
            </p>
            <h1 className="m-0 text-[1.85rem] leading-[1.04] font-extrabold tracking-[-0.02em] text-ink">
              Good morning, {firstName}.
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-[7px] rounded-[8px] border border-border bg-white/78 px-3 py-2.5 text-[0.82rem] text-text-secondary">
              <span className="size-2 rounded-full bg-signal shadow-[0_0_0_3px_var(--wash-green)]" />
              Agenda from your tasks
            </span>
            <form action={refreshDashboardAction}>
              <Button type="submit" variant="quiet" size="medium">
                Refresh
              </Button>
            </form>
            <ButtonLink href="#today-priorities" size="medium">
              Start the day
            </ButtonLink>
          </div>
        </header>

        {tasksUnavailable ? (
          <div className="rounded-[8px] border border-border bg-info-wash px-3.5 py-3 text-[0.85rem] text-ink">
            Database is not connected — showing an empty agenda. Set{' '}
            <code className="font-mono text-[0.8rem]">DATABASE_URL</code> to load real tasks.
          </div>
        ) : null}

        <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
          <section
            id="today-priorities"
            className="rounded-[8px] border border-border bg-white/88 p-6 shadow-[var(--shadow-panel)]"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="m-0 mb-1.5 text-[0.76rem] font-extrabold uppercase text-signal">
                  Today
                </p>
                <h2 className="m-0 mb-2 text-[1.5rem] leading-[1.1] font-extrabold tracking-[-0.02em] text-ink text-pretty">
                  {narrative.headline}
                </h2>
                <p className="m-0 max-w-[62ch] text-[0.95rem] leading-[1.5] text-text-secondary">
                  {narrative.body}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-wash-green px-2.5 py-2 text-[0.84rem] font-extrabold text-signal">
                {planned}% planned
              </span>
            </div>

            {priorities.length === 0 ? (
              <div className="rounded-[8px] border border-border bg-wash px-4 py-6">
                <p className="m-0 text-[0.95rem] text-ink">No open priorities yet.</p>
                <p className="mt-2 m-0 text-[0.88rem] text-text-secondary">
                  Create a task to populate today&apos;s agenda. Flagging and due dates feed this
                  list.
                </p>
                <ButtonLink href="/productivity/tasks" className="mt-4" size="medium">
                  Go to Tasks
                </ButtonLink>
              </div>
            ) : (
              <div className="grid gap-3">
                {priorities.map((item) => (
                  <PriorityCard key={item.id} task={item} tenant={tenant} now={now} />
                ))}
              </div>
            )}
          </section>

          <div className="grid gap-[18px]">
            <aside className="rounded-[8px] border border-border bg-white/88 p-[18px] shadow-[var(--shadow-panel)]">
              <p className="m-0 mb-1 text-[0.76rem] font-extrabold uppercase text-signal">
                Capacity
              </p>
              <div className="my-[18px] h-3.5 overflow-hidden rounded-full bg-wash">
                <span
                  className="block h-full rounded-full bg-[linear-gradient(90deg,#25724d,#b46c22,#a33b32)]"
                  style={{ width: `${capacity.fillPercent}%` }}
                />
              </div>
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <strong className="text-[1.35rem] tracking-[-0.01em] text-ink">
                  {capacity.level}
                </strong>
                <span className="text-[0.9rem] text-text-secondary">{capacity.roomLabel}</span>
              </div>
              <p className="m-0 text-[0.86rem] leading-[1.45] text-text-secondary text-pretty">
                {capacity.detail}
              </p>
            </aside>

            <DueOutsPanel items={dueOuts} tenant={tenant} now={now} />
          </div>
        </div>

        <section className="rounded-[8px] border border-border bg-white/88 px-5 py-[22px] shadow-[var(--shadow-panel)]">
          <div className="mb-[18px] flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="m-0 mb-1.5 text-[0.76rem] font-extrabold uppercase text-signal">
                Schedule
              </p>
              <h2 className="m-0 text-[1.3rem] leading-[1.1] font-extrabold tracking-[-0.01em] text-ink">
                Today at a glance
              </h2>
            </div>
          </div>
          <div className="rounded-[8px] border border-border bg-wash px-4 py-5">
            <p className="m-0 text-[0.95rem] text-ink">Calendar sync lands in Phase 2.</p>
            <p className="mt-2 m-0 text-[0.88rem] text-text-secondary">
              Meetings and focus blocks will appear here once mail and calendar connectors are live.
              Until then, work from Tasks and the priorities above.
            </p>
            <Link
              href="/productivity/tasks"
              className="mt-3 inline-block text-[0.88rem] font-extrabold text-signal hover:text-ink"
            >
              Open Tasks →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
