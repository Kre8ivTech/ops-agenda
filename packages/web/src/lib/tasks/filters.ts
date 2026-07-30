import type { TaskSelect } from '@/lib/db/schema';

/**
 * Filter chip taxonomy for the Tasks record table (`08-portal-requirements.md`
 * ST-03). Predicates here must match the SQL predicates in
 * `src/lib/tasks/actions.ts#queryTasks` — this module exists so the rule can
 * be unit-tested without a database.
 */
export const TASK_FILTERS = ['all', 'needs_attention', 'settled'] as const;
export type TaskFilter = (typeof TASK_FILTERS)[number];

export const TASK_FILTER_LABELS: Record<TaskFilter, string> = {
  all: 'All',
  needs_attention: 'Needs attention',
  settled: 'Settled',
};

export const TASK_SORTS = ['priority', 'due_on', 'created_at', 'title'] as const;
export type TaskSort = (typeof TASK_SORTS)[number];

export type SortDirection = 'asc' | 'desc';

type FlagRow = Pick<TaskSelect, 'handledAt' | 'flagState' | 'dueOn'>;

export function isTaskSettled(task: Pick<FlagRow, 'handledAt' | 'flagState'>): boolean {
  return task.handledAt !== null || task.flagState === 'settled';
}

/** Unhandled and either explicitly flagged or past its due date. */
export function isTaskNeedsAttention(task: FlagRow, now: Date = new Date()): boolean {
  if (isTaskSettled(task)) return false;
  if (task.flagState === 'attention' || task.flagState === 'at_risk') return true;
  return task.dueOn !== null && task.dueOn.getTime() <= now.getTime();
}

export function matchesTaskFilter(
  task: FlagRow,
  filter: TaskFilter,
  now: Date = new Date(),
): boolean {
  switch (filter) {
    case 'needs_attention':
      return isTaskNeedsAttention(task, now);
    case 'settled':
      return isTaskSettled(task);
    case 'all':
    default:
      return true;
  }
}

export function parseTaskFilter(value: string | string[] | undefined): TaskFilter {
  const candidate = Array.isArray(value) ? value[0] : value;
  return (TASK_FILTERS as readonly string[]).includes(candidate ?? '')
    ? (candidate as TaskFilter)
    : 'all';
}

export function parseTaskSort(value: string | string[] | undefined): TaskSort {
  const candidate = Array.isArray(value) ? value[0] : value;
  return (TASK_SORTS as readonly string[]).includes(candidate ?? '')
    ? (candidate as TaskSort)
    : 'priority';
}

export function parseSortDirection(value: string | string[] | undefined): SortDirection {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === 'desc' ? 'desc' : 'asc';
}

export function parsePage(value: string | string[] | undefined): number {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(candidate ?? '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * Row anatomy per `05-design-system.md`: "A flagged row carries a 3px left
 * border in its status colour; a handled row drops to a plain border."
 * Green/settled and grey/inert states never get an accent — only the two
 * states that require a person's attention today do.
 */
export function taskFlagBorderClass(task: Pick<FlagRow, 'handledAt' | 'flagState'>): string {
  if (isTaskSettled(task)) return 'border-l-transparent';
  if (task.flagState === 'at_risk') return 'border-l-risk';
  if (task.flagState === 'attention') return 'border-l-info';
  return 'border-l-transparent';
}

export function taskFlagLabel(task: Pick<FlagRow, 'handledAt' | 'flagState'>): string | null {
  if (isTaskSettled(task)) return null;
  if (task.flagState === 'at_risk') return 'At risk';
  if (task.flagState === 'attention') return 'Needs attention';
  return null;
}
