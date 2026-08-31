import type { TaskSelect } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { AssignTaskControl } from '@/components/tasks/assign-task-control';
import { DeleteTaskButton } from '@/components/tasks/delete-task-button';
import { markHandledAction, reopenAction, startTaskAction } from '@/lib/dashboard/actions';
import type { AssignableUser } from '@/lib/tasks/actions';

// ---------------------------------------------------------------------------
// Priority badge
// ---------------------------------------------------------------------------

const PRIORITY_STYLE: Record<string, string> = {
  p1: 'bg-red-100 text-red-800 border-red-200',
  p2: 'bg-amber-50 text-amber-800 border-amber-200',
  p3: 'bg-white text-ink border-border',
  fysa: 'bg-wash text-text-secondary border-border',
};

function priorityLabel(p: string): string {
  return p.toUpperCase();
}

// ---------------------------------------------------------------------------
// Status tag
// ---------------------------------------------------------------------------

type StatusTag = 'extracted' | 'focus' | 'waiting' | 'blocking' | 'complete' | null;

const STATUS_TAG_STYLE: Record<string, string> = {
  extracted: 'bg-wash-green text-signal',
  focus: 'bg-amber-50 text-amber-800',
  waiting: 'bg-info-wash text-info',
  blocking: 'bg-risk-wash text-risk',
  complete: 'bg-wash-green text-signal',
};

function getStatusTag(task: TaskSelect, column: KanbanColumn): StatusTag {
  if (column === 'done') return 'complete';
  if (task.sourceConnectionId) return 'extracted';
  if (task.flagState === 'at_risk') return 'blocking';
  if (task.flagState === 'attention') return 'waiting';
  if (task.priority === 'p1') return 'focus';
  return null;
}

function statusTagLabel(tag: StatusTag, task: TaskSelect): string {
  if (tag === 'extracted') return 'Extracted';
  if (tag === 'focus') return 'Focus';
  if (tag === 'waiting') return 'Waiting';
  if (tag === 'blocking') return `Blocking ${task.flagReasonCode ?? ''}`.trim();
  if (tag === 'complete') return 'Complete';
  return '';
}

// ---------------------------------------------------------------------------
// Column classification
// ---------------------------------------------------------------------------

export type KanbanColumn = 'inbox' | 'today' | 'in_progress' | 'done';

export type KanbanCardAction = 'reopen' | 'complete' | 'start';

/** Maps a board column to the status transition the card button performs. */
export function kanbanActionForColumn(column: KanbanColumn): KanbanCardAction {
  if (column === 'done') return 'reopen';
  if (column === 'in_progress') return 'complete';
  return 'start';
}

export function classifyTask(task: TaskSelect): KanbanColumn {
  // Done = handled or settled
  if (task.handledAt || task.flagState === 'settled') return 'done';

  // In Progress = status is 'in_progress' or flagState is attention/at_risk
  if (
    task.status === 'in_progress' ||
    task.flagState === 'attention' ||
    task.flagState === 'at_risk'
  ) {
    return 'in_progress';
  }

  // Today = due today or earlier
  if (task.dueOn) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueOn);
    due.setHours(0, 0, 0, 0);
    if (due <= today) return 'today';
  }

  // Everything else = inbox
  return 'inbox';
}

// ---------------------------------------------------------------------------
// Action button per column
// ---------------------------------------------------------------------------

function actionLabel(column: KanbanColumn, task: TaskSelect): string {
  if (column === 'inbox' && task.sourceConnectionId) return 'Approve';
  if (column === 'today') return 'Start';
  if (column === 'in_progress') return 'Complete';
  if (column === 'done') return 'Reopen';
  return 'Start';
}

function actionVariant(column: KanbanColumn, task: TaskSelect): 'primary' | 'secondary' | 'ghost' {
  if (column === 'inbox' && task.sourceConnectionId) return 'primary';
  if (column === 'done') return 'ghost';
  return 'secondary';
}

function actionForForm(column: KanbanColumn) {
  const kind = kanbanActionForColumn(column);
  if (kind === 'reopen') return reopenAction;
  if (kind === 'complete') return markHandledAction;
  return startTaskAction;
}

// ---------------------------------------------------------------------------
// Due label
// ---------------------------------------------------------------------------

function dueLabel(task: TaskSelect): string | null {
  if (!task.dueOn) return null;
  const now = new Date();
  const due = new Date(task.dueOn);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diff = Math.round((dueDay.getTime() - today.getTime()) / 86400000);

  if (diff === 0) {
    // Show time if available
    const h = due.getHours();
    if (h > 0) {
      return due.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return 'Today';
  }
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff <= 6) {
    return due.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Source label
// ---------------------------------------------------------------------------

function sourceLabel(task: TaskSelect): string | null {
  if (task.sourceConnectionId) return 'From mail';
  if (task.description) return task.description.slice(0, 40);
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface TaskCardProps {
  task: TaskSelect;
  column: KanbanColumn;
  assignableUsers?: AssignableUser[];
}

export function TaskCard({ task, column, assignableUsers = [] }: TaskCardProps) {
  const tag = getStatusTag(task, column);
  const due = dueLabel(task);
  const source = sourceLabel(task);
  const isUrgent = due && (due.includes('overdue') || due.includes('AM') || due.includes('PM'));
  const isP1Inbox = column === 'inbox' && task.priority === 'p1';
  const assignee = assignableUsers.find((u) => u.id === task.ownerUserId);
  const assigneeLabel = assignee
    ? assignee.name?.trim() || assignee.email
    : task.ownerUserId
      ? 'Assigned'
      : null;

  return (
    <div
      className={`rounded-[8px] border bg-white p-3.5 ${isP1Inbox ? 'border-risk/40' : 'border-border'}`}
    >
      {/* Priority + Status tag row */}
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`rounded-[4px] border px-1.5 py-0.5 text-[0.68rem] font-extrabold ${PRIORITY_STYLE[task.priority]}`}
        >
          {priorityLabel(task.priority)}
        </span>
        {tag && (
          <span
            className={`rounded-[4px] px-1.5 py-0.5 text-[0.68rem] font-bold ${STATUS_TAG_STYLE[tag]}`}
          >
            {statusTagLabel(tag, task)}
          </span>
        )}
        {assigneeLabel ? (
          <span className="text-text-secondary ml-auto truncate text-[0.68rem] font-bold">
            {assigneeLabel}
          </span>
        ) : null}
      </div>

      {/* Title */}
      <p className="text-ink m-0 text-[0.88rem] font-bold leading-tight">{task.title}</p>

      {/* Source / description */}
      {source && <p className="text-text-secondary m-0 mt-1 text-[0.78rem]">{source}</p>}

      {/* Due + Action row */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={`text-[0.78rem] font-bold ${isUrgent ? 'text-risk' : 'text-text-secondary'}`}
        >
          {due ?? ''}
        </span>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <DeleteTaskButton taskId={task.id} compact />
          <form action={actionForForm(column)}>
            <input type="hidden" name="id" value={task.id} />
            <Button type="submit" variant={actionVariant(column, task)} size="small">
              {actionLabel(column, task)}
            </Button>
          </form>
        </div>
      </div>

      {assignableUsers.length > 0 ? (
        <div className="border-border mt-3 border-t pt-3">
          <AssignTaskControl
            taskId={task.id}
            ownerUserId={task.ownerUserId}
            users={assignableUsers}
            compact
          />
        </div>
      ) : null}
    </div>
  );
}
