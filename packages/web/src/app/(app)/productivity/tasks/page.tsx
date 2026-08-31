import Link from 'next/link';

import { getSession } from '@/lib/auth';
import { listAssignableUsers, queryTasks } from '@/lib/tasks/actions';
import type { AssignableUser } from '@/lib/tasks/actions';
import {
  TASK_FILTER_LABELS,
  TASK_FILTERS,
  parsePage,
  parseSortDirection,
  parseTaskFilter,
  parseTaskSort,
} from '@/lib/tasks/filters';
import { CreateTaskForm } from '@/components/create-task-form';
import { FilterChips, type FilterChipData } from '@/components/record-table/filter-chips';
import { Pagination } from '@/components/record-table/pagination';
import { SearchBox } from '@/components/record-table/search-box';
import { TaskRow } from '@/components/record-table/task-row';
import { ButtonLink } from '@/components/ui/button';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { ExtractionBanner } from '@/components/tasks/extraction-banner';
import { classifyTask } from '@/components/tasks/task-card';

type TasksSearchParams = {
  view?: string;
  filter?: string;
  q?: string;
  sort?: string;
  dir?: string;
  page?: string;
};

function buildHref(current: TasksSearchParams, overrides: Partial<TasksSearchParams>): string {
  const params = new URLSearchParams();
  const merged = { ...current, ...overrides };
  if (merged.view && merged.view !== 'board') params.set('view', merged.view);
  if (merged.filter && merged.filter !== 'all') params.set('filter', merged.filter);
  if (merged.q) params.set('q', merged.q);
  if (merged.sort && merged.sort !== 'priority') params.set('sort', merged.sort);
  if (merged.dir && merged.dir !== 'asc') params.set('dir', merged.dir);
  if (merged.page && merged.page !== '1') params.set('page', merged.page);
  const query = params.toString();
  return query ? `/productivity/tasks?${query}` : '/productivity/tasks';
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<TasksSearchParams>;
}) {
  const session = await getSession();

  if (!session?.accountId || !session?.userId) {
    return (
      <div className="border-border bg-risk-wash text-ink rounded-[8px] border p-4">
        <p className="m-0 text-[0.95rem]">
          Your session is not linked to a tenant account. Complete onboarding to continue.
        </p>
        <ButtonLink href="/onboarding" className="mt-4" size="medium">
          Continue onboarding
        </ButtonLink>
      </div>
    );
  }

  const tenant = { accountId: session.accountId, userId: session.userId };
  const params = await searchParams;
  const view = params.view === 'list' || params.view === 'timeline' ? params.view : 'board';
  const filter = parseTaskFilter(params.filter);
  const search = params.q?.trim() || undefined;
  const sort = parseTaskSort(params.sort);
  const direction = parseSortDirection(params.dir);
  const page = parsePage(params.page);
  const now = new Date();

  let result: Awaited<ReturnType<typeof queryTasks>> | null = null;
  let assignableUsers: AssignableUser[] = [];
  let unavailable = false;
  try {
    const [taskResult, users] = await Promise.all([
      queryTasks(tenant, { filter, search, sort, direction, page, pageSize: 100 }),
      listAssignableUsers(),
    ]);
    result = taskResult;
    assignableUsers = users;
  } catch {
    unavailable = true;
  }

  // Compute board metrics
  const allTasks = result?.rows ?? [];
  const openCount = allTasks.filter((t) => !t.handledAt && t.flagState !== 'settled').length;
  const extractedCount = allTasks.filter(
    (t) => t.sourceConnectionId && !t.handledAt && t.status === 'open',
  ).length;

  // Metrics matching design: Due Today, Awaiting Approval, In Progress, Closed
  const dueToday = allTasks.filter((t) => {
    if (!t.dueOn || t.handledAt) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(t.dueOn);
    due.setHours(0, 0, 0, 0);
    return due.getTime() === today.getTime();
  }).length;
  const awaitingApproval = extractedCount;
  const inProgressCount = allTasks.filter((t) => classifyTask(t) === 'in_progress').length;
  const closedCount = allTasks.filter((t) => classifyTask(t) === 'done').length;

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Productivity</p>
          <h1 className="text-ink m-0 text-[1.55rem] font-extrabold tracking-[-0.02em]">
            Tasks — {openCount} open
            {awaitingApproval > 0 ? `, ${awaitingApproval} awaiting approval` : ''}
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          {/* View toggle */}
          <ViewToggle active={view} />
          <ButtonLink
            href={buildHref(params, { view: 'list', filter: 'needs_attention', page: '1' })}
            variant="secondary"
            size="medium"
          >
            Filter
          </ButtonLink>
          <CreateTaskForm />
        </div>
      </div>

      {unavailable ? (
        <div className="border-border bg-info-wash text-ink rounded-[8px] border px-3.5 py-3 text-[0.85rem]">
          Database is not connected. Set{' '}
          <code className="font-mono text-[0.8rem]">DATABASE_URL</code> to load tasks.
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-4 gap-3">
            <MetricCard label="Due Today" value={dueToday} subtitle="Scheduled for today" />
            <MetricCard
              label="Awaiting Approval"
              value={awaitingApproval}
              subtitle="Extracted from mail"
              tone="signal"
            />
            <MetricCard
              label="In Progress"
              value={inProgressCount}
              subtitle="Started, not finished"
            />
            <MetricCard label="Closed" value={closedCount} subtitle="This week" />
          </div>

          {/* Extraction banner */}
          <ExtractionBanner count={awaitingApproval} />

          {view === 'board' ? (
            <KanbanBoard tasks={allTasks} assignableUsers={assignableUsers} />
          ) : view === 'timeline' ? (
            <div className="border-border rounded-[8px] border bg-white px-4 py-8 text-center">
              <p className="text-ink m-0 text-[0.95rem] font-bold">
                Timeline view is not available yet.
              </p>
              <p className="text-text-secondary m-0 mt-1 text-[0.85rem]">
                Use Board or List for now. Timeline will land with calendar-linked due sequencing.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <ButtonLink href={buildHref(params, { view: 'board' })} size="small">
                  Open board
                </ButtonLink>
                <ButtonLink
                  href={buildHref(params, { view: 'list' })}
                  variant="secondary"
                  size="small"
                >
                  Open list
                </ButtonLink>
              </div>
            </div>
          ) : (
            <ListView
              result={result}
              params={params}
              filter={filter}
              search={search}
              now={now}
              assignableUsers={assignableUsers}
            />
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// View Toggle
// ---------------------------------------------------------------------------

function ViewToggle({ active }: { active: string }) {
  return (
    <div className="border-border bg-wash flex items-center gap-0.5 rounded-[8px] border p-1">
      {(['board', 'list', 'timeline'] as const).map((v) => (
        <Link
          key={v}
          href={`/productivity/tasks?view=${v}`}
          className={`grid h-[30px] place-items-center rounded-[6px] px-3 text-[0.82rem] font-extrabold capitalize transition-colors ${
            active === v ? 'text-ink bg-white shadow-sm' : 'text-text-secondary hover:text-ink'
          }`}
        >
          {v === 'board' ? 'Board' : v === 'list' ? 'List' : 'Timeline'}
        </Link>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  subtitle,
  tone,
}: {
  label: string;
  value: number;
  subtitle: string;
  tone?: string;
}) {
  const valueColor = tone === 'signal' ? 'text-signal' : tone === 'risk' ? 'text-risk' : 'text-ink';
  return (
    <div className="border-border rounded-[8px] border bg-white px-4 py-3">
      <p className="text-text-secondary m-0 text-[0.68rem] font-extrabold uppercase">{label}</p>
      <p className={`m-0 mt-1 text-[1.5rem] font-extrabold ${valueColor}`}>{value}</p>
      <p className="text-text-secondary m-0 mt-0.5 text-[0.76rem]">{subtitle}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// List View (existing table layout)
// ---------------------------------------------------------------------------

function ListView({
  result,
  params,
  filter,
  search,
  now,
  assignableUsers,
}: {
  result: Awaited<ReturnType<typeof queryTasks>> | null;
  params: TasksSearchParams;
  filter: ReturnType<typeof parseTaskFilter>;
  search: string | undefined;
  now: Date;
  assignableUsers: AssignableUser[];
}) {
  const chips: FilterChipData[] = TASK_FILTERS.map((key) => ({
    key,
    label: TASK_FILTER_LABELS[key],
    count:
      result === null
        ? 0
        : key === 'all'
          ? result.counts.all
          : key === 'needs_attention'
            ? result.counts.needsAttention
            : result.counts.settled,
    href: buildHref(params, { view: 'list', filter: key, page: '1' }),
    active: filter === key,
  }));

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips chips={chips} />
        <SearchBox />
      </div>

      <div className="border-border hidden rounded-t-[8px] border border-b-0 bg-[var(--wash)] px-4 py-2.5 lg:grid lg:grid-cols-[88px_minmax(0,1fr)_120px_auto] lg:gap-3">
        <span className="text-text-secondary font-mono text-[0.72rem] font-extrabold uppercase">
          Priority
        </span>
        <span className="text-text-secondary font-mono text-[0.72rem] font-extrabold uppercase">
          Title
        </span>
        <span className="text-text-secondary text-right font-mono text-[0.72rem] font-extrabold uppercase">
          Due
        </span>
        <span className="text-text-secondary text-right font-mono text-[0.72rem] font-extrabold uppercase">
          Actions
        </span>
      </div>

      <ul className="divide-border border-border grid divide-y rounded-[8px] border bg-white lg:rounded-t-none">
        {result && result.rows.length > 0 ? (
          result.rows.map((task) => (
            <TaskRow key={task.id} task={task} now={now} assignableUsers={assignableUsers} />
          ))
        ) : (
          <li className="text-text-secondary px-4 py-8 text-center text-[0.88rem]">
            {search || filter !== 'all'
              ? 'No tasks match this filter and search.'
              : 'No tasks yet. Create one above.'}
          </li>
        )}
      </ul>

      {result ? (
        <Pagination
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
          buildHref={(nextPage) => buildHref(params, { view: 'list', page: String(nextPage) })}
        />
      ) : null}
    </>
  );
}
