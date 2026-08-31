/**
 * Pure helpers for task-assignment notification content.
 * Kept framework-free so unit tests do not need DB or SendGrid.
 */

export interface AssignmentEmailInput {
  taskTitle: string;
  dueOn: Date | null;
  assignerName: string;
  tasksUrl: string;
}

export interface AssignmentEmailContent {
  subject: string;
  text: string;
  html: string;
}

function formatDue(dueOn: Date | null): string {
  if (!dueOn) return 'No due date';
  return dueOn.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Build subject + body for a task assignment notification. */
export function buildAssignmentEmail(input: AssignmentEmailInput): AssignmentEmailContent {
  const due = formatDue(input.dueOn);
  const subject = `Task assigned: ${input.taskTitle}`;
  const text = [
    `${input.assignerName} assigned you a task in Ops Agenda.`,
    '',
    `Title: ${input.taskTitle}`,
    `Due: ${due}`,
    '',
    `Open tasks: ${input.tasksUrl}`,
  ].join('\n');

  const html = [
    `<p><strong>${escapeHtml(input.assignerName)}</strong> assigned you a task in Ops Agenda.</p>`,
    `<p><strong>Title:</strong> ${escapeHtml(input.taskTitle)}<br/>`,
    `<strong>Due:</strong> ${escapeHtml(due)}</p>`,
    `<p><a href="${escapeHtml(input.tasksUrl)}">Open tasks</a></p>`,
  ].join('');

  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Soft-delete semantics used by deleteTask — documented for regression tests. */
export function softDeletePatch(now: Date): { deletedAt: Date; updatedAt: Date } {
  return { deletedAt: now, updatedAt: now };
}
