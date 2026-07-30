import { formatDueLabel, priorityLabel, whyLine, type DashboardTask } from '@/lib/dashboard/brief';
import { ButtonLink } from '@/components/ui/button';
import { MarkHandledButton } from '@/components/dashboard/mark-handled-button';

const PRIORITY_PILL: Record<string, string> = {
  p1: 'bg-wash-green text-signal',
  p2: 'bg-info-wash text-info',
  p3: 'bg-wash text-text-secondary',
  fysa: 'bg-wash text-text-secondary',
};

function statusPill(task: DashboardTask): { label: string; className: string } {
  if (task.flagState === 'at_risk') {
    return { label: 'At risk', className: 'bg-risk-wash text-risk' };
  }
  if (task.flagState === 'attention') {
    return { label: 'Needs attention', className: 'bg-info-wash text-info' };
  }
  return { label: 'Open', className: 'bg-wash text-text-secondary' };
}

export function PriorityCard({
  task,
  tenant,
  now,
}: {
  task: DashboardTask;
  tenant: { accountId: string; userId: string };
  now: Date;
}) {
  const status = statusPill(task);
  const dueClass =
    task.flagState === 'at_risk' || formatDueLabel(task, now) === 'Overdue'
      ? 'font-bold text-risk'
      : 'text-ink';

  return (
    <article className="border-border grid grid-cols-1 gap-[18px] rounded-[8px] border bg-white p-4 md:grid-cols-[minmax(0,1fr)_minmax(150px,auto)]">
      <div className="min-w-0">
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-[5px] font-mono text-[0.72rem] font-extrabold leading-none ${PRIORITY_PILL[task.priority] ?? PRIORITY_PILL.p3}`}
          >
            {priorityLabel(task.priority)}
          </span>
          <span
            className={`rounded-full px-2 py-[5px] text-[0.76rem] font-extrabold leading-none ${status.className}`}
          >
            {status.label}
          </span>
        </div>
        <h3 className="text-ink m-0 mb-1.5 text-pretty text-base font-bold leading-[1.24]">
          {task.title}
        </h3>
        {task.description ? (
          <p className="text-text-secondary m-0 mb-2.5 text-[0.88rem] leading-[1.45]">
            {task.description}
          </p>
        ) : null}
        <p className="border-border text-text-secondary m-0 mb-2.5 border-l-2 pl-[11px] text-[0.82rem] leading-[1.4]">
          {whyLine(task, now)}
        </p>
        <div className="flex flex-wrap gap-2">
          <MarkHandledButton tenant={tenant} taskId={task.id} />
          <ButtonLink href="/productivity/tasks" variant="quiet" size="small">
            Open task
          </ButtonLink>
        </div>
      </div>
      <div className="text-text-secondary grid content-start gap-1.5 text-right text-[0.9rem]">
        <strong className={dueClass}>{formatDueLabel(task, now)}</strong>
        <span className="capitalize">{task.status}</span>
      </div>
    </article>
  );
}
