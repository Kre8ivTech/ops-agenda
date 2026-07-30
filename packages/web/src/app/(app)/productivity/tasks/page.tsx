import { getSession } from '@/lib/auth';
import { queryTasks } from '@/lib/tasks/actions';
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
import { MetricCards, type MetricCardData } from '@/components/record-table/metric-cards';
import { Pagination } from '@/components/record-table/pagination';
import { SearchBox } from '@/components/record-table/search-box';
import { TaskRow } from '@/components/record-table/task-row';
import { ButtonLink } from '@/components/ui/button';

type TasksSearchParams = {
  filter?: string;
  q?: string;
  sort?: string;
  dir?: string;
  page?: string;
};

function buildHref(current: TasksSearchParams, overrides: Partial<TasksSearchParams>): string {
  const params = new URLSearchParams();
  const merged = { ...current, ...overrides };
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
  const filter = parseTaskFilter(params.filter);
  const search = params.q?.trim() || undefined;
  const sort = parseTaskSort(params.sort);
  const direction = parseSortDirection(params.dir);
  const page = parsePage(params.page);
  const now = new Date();

  let result: Awaited<ReturnType<typeof queryTasks>> | null = null;
  let unavailable = false;
  try {
    result = await queryTasks(tenant, { filter, search, sort, direction, page });
  } catch {
    unavailable = true;
  }

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
    href: buildHref(params, { filter: key, page: '1' }),
    active: filter === key,
  }));

  const metrics: MetricCardData[] = result
    ? [
        { label: 'Open', value: String(result.counts.all - result.counts.settled) },
        {
          label: 'Needs attention',
          value: String(result.counts.needsAttention),
          tone: result.counts.needsAttention > 0 ? 'risk' : 'default',
        },
        { label: 'Settled', value: String(result.counts.settled), tone: 'signal' },
        { label: 'Total', value: String(result.counts.all) },
      ]
    : [];

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Productivity</p>
          <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">Tasks</h1>
          <p className="text-text-secondary m-0 mt-2 max-w-[62ch] text-[0.95rem] leading-[1.5]">
            Open work that feeds the dashboard agenda. Mark items handled from here or the brief.
          </p>
        </div>
        <CreateTaskForm />
      </div>

      {unavailable ? (
        <div className="border-border bg-info-wash text-ink rounded-[8px] border px-3.5 py-3 text-[0.85rem]">
          Database is not connected. Set{' '}
          <code className="font-mono text-[0.8rem]">DATABASE_URL</code> to create and list tasks.
        </div>
      ) : (
        <>
          <MetricCards items={metrics} />

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
              result.rows.map((task) => <TaskRow key={task.id} task={task} now={now} />)
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
              buildHref={(nextPage) => buildHref(params, { page: String(nextPage) })}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
