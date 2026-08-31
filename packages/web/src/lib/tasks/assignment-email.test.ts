import { describe, expect, it } from 'vitest';

import { buildAssignmentEmail, softDeletePatch } from './assignment-email';

describe('buildAssignmentEmail', () => {
  it('includes title, due date, assigner, and tasks link', () => {
    const content = buildAssignmentEmail({
      taskTitle: 'File quarterly report',
      dueOn: new Date('2026-09-01T12:00:00.000Z'),
      assignerName: 'Alex Rivera',
      tasksUrl: 'https://app.example.com/productivity/tasks',
    });

    expect(content.subject).toBe('Task assigned: File quarterly report');
    expect(content.text).toContain('Alex Rivera assigned you a task');
    expect(content.text).toContain('Title: File quarterly report');
    expect(content.text).toContain('Open tasks: https://app.example.com/productivity/tasks');
    expect(content.html).toContain('File quarterly report');
    expect(content.html).toContain('https://app.example.com/productivity/tasks');
  });

  it('shows No due date when dueOn is null', () => {
    const content = buildAssignmentEmail({
      taskTitle: 'Call vendor',
      dueOn: null,
      assignerName: 'Sam',
      tasksUrl: 'https://app.example.com/productivity/tasks',
    });
    expect(content.text).toContain('Due: No due date');
  });

  it('escapes HTML in title and assigner name', () => {
    const content = buildAssignmentEmail({
      taskTitle: '<script>x</script>',
      dueOn: null,
      assignerName: 'A & B',
      tasksUrl: 'https://app.example.com/productivity/tasks',
    });
    expect(content.html).not.toContain('<script>');
    expect(content.html).toContain('&lt;script&gt;');
    expect(content.html).toContain('A &amp; B');
  });
});

describe('softDeletePatch', () => {
  it('sets deletedAt and updatedAt to the same instant', () => {
    const now = new Date('2026-08-30T15:00:00.000Z');
    expect(softDeletePatch(now)).toEqual({ deletedAt: now, updatedAt: now });
  });
});
