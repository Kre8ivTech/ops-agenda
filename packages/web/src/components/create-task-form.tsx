'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { TextareaField } from '@/components/ui/textarea';
import type { EntityOption } from '@/lib/entities/queries';
import type { AssignableUser } from '@/lib/tasks/actions';
import { createTaskAction, type TaskActionState } from '@/lib/tasks/form-actions';

const initialState: TaskActionState = { ok: false };

export function CreateTaskForm({
  assignableUsers = [],
  entities = [],
  defaultEntityId,
}: {
  assignableUsers?: AssignableUser[];
  entities?: EntityOption[];
  defaultEntityId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<TaskActionState>(initialState);
  const [pending, startTransition] = useTransition();
  const errors = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const assigneeListId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      const titleInput = formRef.current?.elements.namedItem('title');
      if (titleInput instanceof HTMLElement) titleInput.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function closeDialog() {
    setOpen(false);
    setState(initialState);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createTaskAction(state, formData);
      setState(result);
      if (result.ok) {
        formRef.current?.reset();
        if (result.message) {
          return;
        }
        setOpen(false);
      }
    });
  }

  const showEntityField = entities.length > 0;
  const entityDefault =
    defaultEntityId && entities.some((entity) => entity.id === defaultEntityId)
      ? defaultEntityId
      : '';

  return (
    <>
      <Button type="button" variant="secondary" size="medium" onClick={() => setOpen(true)}>
        New task
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="create-task-title"
        className="border-border text-ink backdrop:bg-ink/45 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[560px] overflow-y-auto rounded-[14px] border bg-white p-0 shadow-[0_24px_80px_rgba(22,32,27,0.24)] backdrop:backdrop-blur-[2px]"
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}
      >
        <div className="border-border flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2
              id="create-task-title"
              className="m-0 text-[1.15rem] font-extrabold tracking-[-0.02em]"
            >
              New task
            </h2>
            <p className="text-text-secondary m-0 mt-1 text-[0.84rem]">
              Add the next action to your agenda.
            </p>
          </div>
          <Button type="button" variant="ghost" size="small" onClick={closeDialog}>
            Close
          </Button>
        </div>

        <form ref={formRef} action={handleSubmit} className="grid gap-4 p-5">
          {state.message ? (
            <p
              role={state.ok ? 'status' : 'alert'}
              className={`m-0 rounded-[8px] px-3 py-2.5 text-[0.85rem] ${
                state.ok ? 'bg-info-wash text-ink' : 'bg-risk-wash text-risk'
              }`}
            >
              {state.message}
            </p>
          ) : null}
          <TextField label="Title" name="title" required autoFocus error={errors.title?.[0]} />
          <TextareaField label="Description" name="description" rows={4} />
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Priority" name="priority" defaultValue="p3">
              <option value="p1">P1 — act now</option>
              <option value="p2">P2 — act today</option>
              <option value="p3">P3 — act this week</option>
              <option value="fysa">FYSA</option>
            </SelectField>
            <TextField label="Due date" name="dueOn" type="date" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <TextField
                label="Assignee email"
                name="assigneeEmail"
                type="email"
                autoComplete="off"
                list={assignableUsers.length > 0 ? assigneeListId : undefined}
                placeholder="name@company.com"
                error={errors.assigneeEmail?.[0]}
              />
              {assignableUsers.length > 0 ? (
                <datalist id={assigneeListId}>
                  {assignableUsers.map((user) => (
                    <option key={user.id} value={user.email} />
                  ))}
                </datalist>
              ) : null}
              <p className="text-text-secondary m-0 text-[0.76rem]">
                Must match an active account member to assign and notify.
              </p>
            </div>
            {showEntityField ? (
              <SelectField
                label="Company"
                name="entityId"
                defaultValue={entityDefault}
                error={errors.entityId?.[0]}
              >
                <option value="">No company</option>
                {entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))}
              </SelectField>
            ) : null}
          </div>
          <div className="border-border mt-1 flex justify-end gap-2 border-t pt-4">
            {state.ok && state.message ? (
              <Button type="button" variant="secondary" size="medium" onClick={closeDialog}>
                Done
              </Button>
            ) : (
              <>
                <Button type="button" variant="ghost" size="medium" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" size="medium" disabled={pending}>
                  {pending ? 'Adding…' : 'Add task'}
                </Button>
              </>
            )}
          </div>
        </form>
      </dialog>
    </>
  );
}
