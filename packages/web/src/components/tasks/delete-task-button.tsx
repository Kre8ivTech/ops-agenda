'use client';

import { useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { deleteTaskFormAction } from '@/lib/dashboard/actions';
import { deleteTaskAction, type TaskActionState } from '@/lib/tasks/form-actions';

function SubmitLabel({ idle, pending }: { idle: string; pending: string }) {
  const { pending: isPending } = useFormStatus();
  return <>{isPending ? pending : idle}</>;
}

/**
 * Two-step delete control: first click arms confirm, second submits soft-delete.
 * Matches list/board density without a modal dialog.
 */
export function DeleteTaskButton({
  taskId,
  compact = false,
}: {
  taskId: string;
  compact?: boolean;
}) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="small"
        onClick={() => setArmed(true)}
        aria-label="Delete task"
      >
        {compact ? 'Delete' : 'Delete'}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <form action={deleteTaskFormAction}>
        <input type="hidden" name="id" value={taskId} />
        <Button type="submit" variant="quiet" size="small" className="text-risk hover:text-risk">
          <SubmitLabel idle="Confirm delete" pending="Deleting…" />
        </Button>
      </form>
      <Button type="button" variant="ghost" size="small" onClick={() => setArmed(false)}>
        Cancel
      </Button>
    </div>
  );
}

/** Delete used inside the edit panel with message feedback. */
export function DeleteTaskFormButton({ taskId, onDone }: { taskId: string; onDone?: () => void }) {
  const [armed, setArmed] = useState(false);
  const [state, setState] = useState<TaskActionState>({ ok: false });
  const [pending, startTransition] = useTransition();

  if (!armed) {
    return (
      <Button type="button" variant="ghost" size="small" onClick={() => setArmed(true)}>
        Delete task
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {state.message && !state.ok ? (
        <p className="text-risk m-0 text-[0.82rem]">{state.message}</p>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          variant="quiet"
          size="small"
          className="text-risk hover:text-risk"
          disabled={pending}
          onClick={() => {
            const fd = new FormData();
            fd.set('id', taskId);
            startTransition(async () => {
              const result = await deleteTaskAction(state, fd);
              setState(result);
              if (result.ok) onDone?.();
            });
          }}
        >
          {pending ? 'Deleting…' : 'Confirm delete'}
        </Button>
        <Button type="button" variant="ghost" size="small" onClick={() => setArmed(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
