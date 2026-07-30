import type { TaskSelect } from '@/lib/db/schema';

export type DashboardTask = Pick<
  TaskSelect,
  | 'id'
  | 'title'
  | 'description'
  | 'priority'
  | 'status'
  | 'flagState'
  | 'flagReasonCode'
  | 'flagReasonText'
  | 'dueOn'
  | 'handledAt'
  | 'createdAt'
>;

const PRIORITY_RANK: Record<string, number> = { p1: 0, p2: 1, p3: 2, fysa: 3 };

function startOfLocalDay(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function endOfLocalDay(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}

export function isUnhandled(task: DashboardTask): boolean {
  return task.handledAt == null && task.flagState !== 'settled';
}

export function isAtRisk(task: DashboardTask): boolean {
  return isUnhandled(task) && task.flagState === 'at_risk';
}

export function isDueTodayOrOverdue(task: DashboardTask, now: Date): boolean {
  if (!task.dueOn || !isUnhandled(task)) return false;
  return task.dueOn.getTime() <= endOfLocalDay(now).getTime();
}

export function wasHandledToday(task: DashboardTask, now: Date): boolean {
  if (!task.handledAt) return false;
  const start = startOfLocalDay(now).getTime();
  const end = endOfLocalDay(now).getTime();
  const t = task.handledAt.getTime();
  return t >= start && t <= end;
}

function isPriorityCandidate(task: DashboardTask): boolean {
  if (!isUnhandled(task)) return false;
  return (
    task.flagState === 'attention' ||
    task.flagState === 'at_risk' ||
    task.priority === 'p1'
  );
}

function comparePriorityThenDue(a: DashboardTask, b: DashboardTask): number {
  const pr = (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
  if (pr !== 0) return pr;
  const aDue = a.dueOn?.getTime() ?? Number.POSITIVE_INFINITY;
  const bDue = b.dueOn?.getTime() ?? Number.POSITIVE_INFINITY;
  return aDue - bDue;
}

/** Up to `limit` unhandled priorities: flagged/at-risk/p1 first, else next by priority. */
export function selectTopPriorities(tasks: DashboardTask[], limit = 3): DashboardTask[] {
  const unhandled = tasks.filter(isUnhandled);
  const preferred = unhandled.filter(isPriorityCandidate).sort(comparePriorityThenDue);
  if (preferred.length >= limit) return preferred.slice(0, limit);

  const preferredIds = new Set(preferred.map((t) => t.id));
  const fillers = unhandled
    .filter((t) => !preferredIds.has(t.id))
    .sort(comparePriorityThenDue);

  return [...preferred, ...fillers].slice(0, limit);
}

export function selectDueOuts(tasks: DashboardTask[], limit = 6): DashboardTask[] {
  return tasks
    .filter((t) => isUnhandled(t) && t.dueOn != null)
    .sort((a, b) => (a.dueOn!.getTime() ?? 0) - (b.dueOn!.getTime() ?? 0))
    .slice(0, limit);
}

export function whyLine(task: DashboardTask, now: Date = new Date()): string {
  if (task.flagReasonText?.trim()) return task.flagReasonText.trim();

  if (task.flagReasonCode) {
    const code = task.flagReasonCode.replace(/_/g, ' ');
    return code.charAt(0).toUpperCase() + code.slice(1);
  }

  if (task.dueOn) {
    const due = task.dueOn;
    const todayStart = startOfLocalDay(now).getTime();
    const todayEnd = endOfLocalDay(now).getTime();
    const dueMs = due.getTime();
    if (dueMs < todayStart) return 'Overdue';
    if (dueMs <= todayEnd) return 'Due today';
    return `Due ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }

  return 'No due date';
}

export function buildNarrative(tasks: DashboardTask[], now: Date = new Date()): {
  headline: string;
  body: string;
} {
  const unhandled = tasks.filter(isUnhandled);
  const atRisk = unhandled.filter(isAtRisk);
  const dueSoon = unhandled.filter((t) => isDueTodayOrOverdue(t, now));
  const top = selectTopPriorities(tasks, 3);

  if (unhandled.length === 0) {
    return {
      headline: 'Nothing open on your task list.',
      body: 'Create a task or wait for sync — the agenda is built from what you own.',
    };
  }

  const n = top.length;
  const headline =
    n === 1
      ? 'One move protects the slate today.'
      : `${n} moves protect the deadline slate.`;

  const parts: string[] = [];
  parts.push(`${unhandled.length} open ${unhandled.length === 1 ? 'priority' : 'priorities'}.`);
  if (atRisk.length > 0) {
    parts.push(
      `${atRisk.length} at risk before end of day${atRisk[0] ? ` — lead with “${atRisk[0].title}”` : ''}.`,
    );
  } else if (dueSoon.length > 0) {
    parts.push(`${dueSoon.length} due today or overdue.`);
  } else {
    parts.push('Nothing flagged at risk; work the list by priority.');
  }

  return { headline, body: parts.join(' ') };
}

export function plannedPercent(tasks: DashboardTask[], now: Date = new Date()): number {
  const topOpen = selectTopPriorities(tasks, 3).length;
  const handledToday = tasks.filter((t) => wasHandledToday(t, now)).length;
  const denom = handledToday + topOpen;
  if (denom === 0) return 100;
  return Math.min(100, Math.round((handledToday / denom) * 100));
}

export type CapacityLevel = 'Open' | 'Balanced' | 'Tight';

export function capacityStatus(tasks: DashboardTask[], now: Date = new Date()): {
  level: CapacityLevel;
  fillPercent: number;
  detail: string;
  roomLabel: string;
} {
  const unhandled = tasks.filter(isUnhandled);
  const p1 = unhandled.filter((t) => t.priority === 'p1').length;
  const dueToday = unhandled.filter((t) => isDueTodayOrOverdue(t, now)).length;
  const pressure = p1 * 2 + dueToday;

  if (pressure >= 4 || p1 >= 2) {
    return {
      level: 'Tight',
      fillPercent: Math.min(92, 55 + pressure * 8),
      detail: 'Anything new above 90 minutes today displaces a P1. Clear a due-out before adding work.',
      roomLabel: `${Math.max(0, 25 - pressure * 3)}% flexible room`,
    };
  }
  if (pressure >= 2 || unhandled.length >= 5) {
    return {
      level: 'Balanced',
      fillPercent: 48 + pressure * 6,
      detail: 'Room for one more focused block if nothing new goes at risk.',
      roomLabel: `${Math.max(15, 40 - pressure * 5)}% flexible room`,
    };
  }
  return {
    level: 'Open',
    fillPercent: Math.max(18, 20 + unhandled.length * 4),
    detail: 'Capacity is open. Pull the next open task before the day fills in.',
    roomLabel: `${Math.max(40, 70 - unhandled.length * 5)}% flexible room`,
  };
}

export function greetingName(session: { name?: string; email?: string }): string {
  if (session.name?.trim()) {
    return session.name.trim().split(/\s+/)[0] ?? 'there';
  }
  if (session.email) {
    const local = session.email.split('@')[0] ?? '';
    const token = local.split(/[._-]/)[0];
    if (token) return token.charAt(0).toUpperCase() + token.slice(1);
  }
  return 'there';
}

export function formatDashboardDate(now: Date = new Date()): string {
  return now.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatDueLabel(task: DashboardTask, now: Date = new Date()): string {
  if (!task.dueOn) return 'No due date';
  if (isAtRisk(task)) return 'At risk';
  const todayStart = startOfLocalDay(now).getTime();
  const todayEnd = endOfLocalDay(now).getTime();
  const dueMs = task.dueOn.getTime();
  if (dueMs < todayStart) return 'Overdue';
  if (dueMs <= todayEnd) {
    return task.dueOn.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  return task.dueOn.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function priorityLabel(priority: string): string {
  return priority.toUpperCase();
}
