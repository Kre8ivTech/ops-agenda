'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/select';
import type { AssignableUser } from '@/lib/tasks/actions';
import { assignTaskAction, type TaskActionState } from '@/lib/tasks/form-actions';

function displayName(u: AssignableUser): string {
  return u.name?.trim() || u.email;
}

/** Compact assignee picker — persists ownerUserId and attempts assignment email. */
export function AssignTaskControl({
  taskId,
  ownerUserId,
  users,
  compact = false,
}: {
  taskId: string;
  ownerUserId: string | null;
  users: AssignableUser[];
  compact?: boolean;
}) {
  const [state, setState] = useState<TaskActionState>({ ok: false });
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await assignTaskAction(state, formData);
      setState(result);
    });
  }

  return (
    <form action={handleSubmit} className={compact ? 'grid gap-1.5' : 'grid gap-2'}>
      <input type="hidden" name="id" value={taskId} />
      <SelectField
        label={compact ? 'Assignee' : 'Assign to'}
        name="ownerUserId"
        defaultValue={ownerUserId ?? ''}
        disabled={pending || users.length === 0}
      >
        <option value="">Unassigned</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {displayName(u)}
          </option>
        ))}
      </SelectField>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="secondary" size="small" disabled={pending || users.length === 0}>
          {pending ? 'Saving…' : 'Assign'}
        </Button>
        {state.message ? (
          <p
            className={`m-0 text-[0.78rem] ${state.ok ? 'text-text-secondary' : 'text-risk'}`}
          >
            {state.message}
          </p>
        ) : null}
        {users.length === 0 ? (
          <p className="text-text-secondary m-0 text-[0.78rem]">No account users to assign.</p>
        ) : null}
      </div>
    </form>
  );
}
