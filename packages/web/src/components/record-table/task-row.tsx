'use client';

import { useState } from 'react';

import { PRIORITY_PILL } from '@/components/dashboard/priority-card';
import { MarkHandledButton, ReopenButton } from '@/components/dashboard/mark-handled-button';
import { TaskEditForm } from '@/components/record-table/task-edit-form';
import { Button } from '@/components/ui/button';
import type { TaskSelect } from '@/lib/db/schema';
import { formatDueLabel, priorityLabel, whyLine } from '@/lib/dashboard/brief';
import { taskFlagBorderClass, taskFlagLabel } from '@/lib/tasks/filters';

/** ST-05/06/07/10: flagged border, row expansion, contextual actions, mobile stacking. */
export function TaskRow({ task, now }: { task: TaskSelect; now: Date }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  const flagLabel = taskFlagLabel(task);
  const borderClass = taskFlagBorderClass(task);
  const handled = task.handledAt !== null;
  const dueLabel = formatDueLabel(task, now);
  const showPanel = expanded || editing;

  return (
    <li
      className={`border-border grid grid-cols-1 gap-2.5 border-b border-l-[3px] px-4 py-3.5 last:border-b-0 lg:grid-cols-[88px_minmax(0,1fr)_120px_auto] lg:items-center lg:gap-3 ${borderClass}`}
    >
      <span
        className={`w-fit rounded-full px-2 py-[5px] font-mono text-[0.72rem] font-extrabold leading-none ${PRIORITY_PILL[task.priority] ?? PRIORITY_PILL.p3}`}
      >
        {priorityLabel(task.priority)}
      </span>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="text-ink focus-visible:outline-signal flex min-w-0 items-baseline gap-2 text-left font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span className="truncate">{task.title}</span>
        {task.sourceConnectionId ? (
          <span className="text-signal shrink-0 text-[0.76rem] font-extrabold">From mail</span>
        ) : null}
        {flagLabel ? (
          <span className="text-risk shrink-0 text-[0.76rem] font-extrabold">{flagLabel}</span>
        ) : null}
      </button>

      <span
        className={`text-[0.85rem] lg:text-right ${
          flagLabel === 'At risk' ? 'text-risk font-bold' : 'text-text-secondary'
        }`}
      >
        {dueLabel}
      </span>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        {handled ? <ReopenButton taskId={task.id} /> : <MarkHandledButton taskId={task.id} />}
        <Button type="button" variant="quiet" size="small" onClick={() => setEditing((v) => !v)}>
          {editing ? 'Close' : 'Edit'}
        </Button>
      </div>

      {showPanel ? (
        <div className="border-border mt-1 grid gap-3 border-t pt-3 lg:col-span-4">
          {task.description ? (
            <p className="text-ink m-0 text-[0.88rem] leading-[1.5]">{task.description}</p>
          ) : null}
          {flagLabel ? (
            <p className="border-border text-text-secondary m-0 border-l-2 pl-[11px] text-[0.82rem] leading-[1.4]">
              {whyLine(task, now)}
            </p>
          ) : (
            <p className="text-text-secondary m-0 text-[0.82rem]">No flags on this task.</p>
          )}
          {editing ? <TaskEditForm task={task} onDone={() => setEditing(false)} /> : null}
        </div>
      ) : null}
    </li>
  );
}
