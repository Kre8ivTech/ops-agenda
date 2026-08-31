'use client';

import { useState, useTransition } from 'react';

import { AssignTaskControl } from '@/components/tasks/assign-task-control';
import { DeleteTaskFormButton } from '@/components/tasks/delete-task-button';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { TextareaField } from '@/components/ui/textarea';
import type { TaskSelect } from '@/lib/db/schema';
import type { AssignableUser } from '@/lib/tasks/actions';
import { updateTaskAction, type TaskActionState } from '@/lib/tasks/form-actions';

function toDateInputValue(date: Date | null): string {
  if (!date) return '';
  return date.toISOString().slice(0, 10);
}

const initialState: TaskActionState = { ok: false };

/** ST-08: edit form uses screen-specific columns; save persists in place. */
export function TaskEditForm({
  task,
  assignableUsers = [],
  onDone,
}: {
  task: TaskSelect;
  assignableUsers?: AssignableUser[];
  onDone: () => void;
}) {
  const [state, setState] = useState<TaskActionState>(initialState);
  const [pending, startTransition] = useTransition();
  const errors = state.fieldErrors ?? {};

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateTaskAction(state, formData);
      setState(result);
      if (result.ok) onDone();
    });
  }

  return (
    <div className="grid gap-3">
      <form
        action={handleSubmit}
        className="border-border bg-wash grid gap-3 rounded-[8px] border p-3.5"
      >
        <input type="hidden" name="id" value={task.id} />
        {state.message ? <p className="text-risk m-0 text-[0.82rem]">{state.message}</p> : null}
        <TextField
          label="Title"
          name="title"
          defaultValue={task.title}
          required
          error={errors.title?.[0]}
        />
        <TextareaField
          label="Description"
          name="description"
          defaultValue={task.description ?? ''}
          rows={3}
        />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Priority" name="priority" defaultValue={task.priority}>
            <option value="p1">P1 — act now</option>
            <option value="p2">P2 — act today</option>
            <option value="p3">P3 — act this week</option>
            <option value="fysa">FYSA</option>
          </SelectField>
          <TextField
            label="Due date"
            name="dueOn"
            type="date"
            defaultValue={toDateInputValue(task.dueOn)}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="small" disabled={pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
          <Button type="button" variant="ghost" size="small" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>

      <div className="border-border bg-wash grid gap-3 rounded-[8px] border p-3.5">
        <AssignTaskControl
          taskId={task.id}
          ownerUserId={task.ownerUserId}
          users={assignableUsers}
        />
        <DeleteTaskFormButton taskId={task.id} onDone={onDone} />
      </div>
    </div>
  );
}
