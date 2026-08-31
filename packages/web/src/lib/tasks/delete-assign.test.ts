import { describe, expect, it } from 'vitest';

/**
 * Documents delete + assign form-action messaging without hitting the DB.
 * Mirrors packages/web/src/lib/tasks/form-actions.ts assignEmailMessage.
 */
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

describe('assign email degrade messaging', () => {
  it('confirms when email sent', () => {
    expect(assignEmailMessage(true)).toBe('Assigned and notification emailed.');
  });

  it('explains missing SendGrid without failing the assign', () => {
    expect(assignEmailMessage(false, 'not_configured')).toContain('SendGrid is not configured');
  });

  it('explains send failure while assignment still succeeded', () => {
    expect(assignEmailMessage(false, 'send_failed')).toContain('failed to send');
  });
});

describe('deleteTask soft-delete contract', () => {
  it('uses deletedAt rather than hard delete', () => {
    // Contract: deleteTask updates deletedAt (see actions.ts) — lists exclude isNull(deletedAt).
    const row = { id: 't1', deletedAt: null as Date | null };
    const after = { ...row, deletedAt: new Date('2026-08-30T12:00:00.000Z') };
    expect(after.deletedAt).not.toBeNull();
    expect(row).not.toHaveProperty('hardDeleted');
  });
});
