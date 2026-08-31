'use server';

import { z } from 'zod';
import { assignTask, createTask, deleteTask, updateTask } from '@/lib/tasks/actions';

export type TaskActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function fieldErrorsFromZod(error: z.ZodError): Record<string, string[]> {
  const flat = error.flatten().fieldErrors;
  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(flat)) {
    if (value?.length) out[key] = value;
  }
  return out;
}

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

const createTaskFormSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(500),
  description: z.string().max(5000).optional(),
  priority: z.enum(['p1', 'p2', 'p3', 'fysa']),
  dueOn: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export async function createTaskAction(
  _prev: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const parsed = createTaskFormSchema.safeParse({
    title: formString(formData, 'title'),
    description: formString(formData, 'description') || undefined,
    priority: formString(formData, 'priority') || 'p3',
    dueOn: formString(formData, 'dueOn') || undefined,
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  try {
    // z.coerce.date() accepts a date string at runtime, but its inferred
    // input type is `Date` — cast through `unknown` for the string we hold.
    await createTask({ ...parsed.data, dueOn: parsed.data.dueOn as unknown as Date | undefined });
  } catch {
    return { ok: false, message: 'Could not create the task. Try again.' };
  }

  return { ok: true };
}

const updateTaskFormSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required.').max(500),
  description: z.string().max(5000).optional(),
  priority: z.enum(['p1', 'p2', 'p3', 'fysa']),
  dueOn: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export async function updateTaskAction(
  _prev: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const parsed = updateTaskFormSchema.safeParse({
    id: formString(formData, 'id'),
    title: formString(formData, 'title'),
    description: formString(formData, 'description') || undefined,
    priority: formString(formData, 'priority') || 'p3',
    dueOn: formString(formData, 'dueOn') || undefined,
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  try {
    await updateTask({ ...parsed.data, dueOn: parsed.data.dueOn as unknown as Date | undefined });
  } catch {
    return { ok: false, message: 'Could not save the task. Try again.' };
  }

  return { ok: true };
}

const deleteTaskFormSchema = z.object({
  id: z.string().uuid(),
});

export async function deleteTaskAction(
  _prev: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const parsed = deleteTaskFormSchema.safeParse({
    id: formString(formData, 'id'),
  });

  if (!parsed.success) {
    return { ok: false, message: 'Invalid task.' };
  }

  try {
    await deleteTask(parsed.data);
  } catch {
    return { ok: false, message: 'Could not delete the task. Try again.' };
  }

  return { ok: true };
}

const assignTaskFormSchema = z.object({
  id: z.string().uuid(),
  ownerUserId: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
});

function assignEmailMessage(emailSent: boolean, reason?: string): string | undefined {
  if (emailSent) return 'Assigned and notification emailed.';
  switch (reason) {
    case 'cleared':
      return 'Assignee cleared.';
    case 'unchanged':
      return 'Assignee unchanged.';
    case 'not_configured':
      return 'Assigned. Email not sent — SendGrid is not configured.';
    case 'missing_from':
      return 'Assigned. Email not sent — SendGrid from_email is missing.';
    case 'send_failed':
      return 'Assigned. Email notification failed to send.';
    case 'no_email':
      return 'Assigned. Email not sent — assignee has no email.';
    default:
      return 'Assigned.';
  }
}

export async function assignTaskAction(
  _prev: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const parsed = assignTaskFormSchema.safeParse({
    id: formString(formData, 'id'),
    ownerUserId: formString(formData, 'ownerUserId') || undefined,
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  try {
    const result = await assignTask({
      id: parsed.data.id,
      ownerUserId: parsed.data.ownerUserId,
    });
    return {
      ok: true,
      message: assignEmailMessage(result.emailSent, result.emailSkippedReason),
    };
  } catch {
    return { ok: false, message: 'Could not assign the task. Try again.' };
  }
}
