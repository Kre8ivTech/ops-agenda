'use client';

import { useRef, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { TextareaField } from '@/components/ui/textarea';
import { createTaskAction, type TaskActionState } from '@/lib/tasks/form-actions';

const initialState: TaskActionState = { ok: false };

export function CreateTaskForm() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<TaskActionState>(initialState);
  const [pending, startTransition] = useTransition();
  const errors = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createTaskAction(state, formData);
      setState(result);
      if (result.ok) {
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <Button type="button" variant="secondary" size="medium" onClick={() => setOpen(true)}>
        New task
      </Button>
    );
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="border-border grid gap-3.5 rounded-[8px] border bg-white p-4"
    >
      {state.message ? (
        <p className="bg-risk-wash text-risk m-0 rounded-[8px] px-3 py-2.5 text-[0.85rem]">
          {state.message}
        </p>
      ) : null}
      <TextField label="Title" name="title" required autoFocus error={errors.title?.[0]} />
      <TextareaField label="Description" name="description" rows={3} />
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Priority" name="priority" defaultValue="p3">
          <option value="p1">P1 — act now</option>
          <option value="p2">P2 — act today</option>
          <option value="p3">P3 — act this week</option>
          <option value="fysa">FYSA</option>
        </SelectField>
        <TextField label="Due date" name="dueOn" type="date" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="medium" disabled={pending}>
          {pending ? 'Adding…' : 'Add task'}
        </Button>
        <Button type="button" variant="ghost" size="medium" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
