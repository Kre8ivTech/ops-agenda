import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createTask, assignTask, resolveAssignableUserByEmail } = vi.hoisted(() => ({
  createTask: vi.fn(),
  assignTask: vi.fn(),
  resolveAssignableUserByEmail: vi.fn(),
}));

vi.mock('@/lib/tasks/actions', () => ({
  createTask,
  assignTask,
  resolveAssignableUserByEmail,
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

import { createTaskAction } from '@/lib/tasks/form-actions';

function formData(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

describe('createTaskAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createTask.mockResolvedValue({ id: 'task-1', title: 'Follow up' });
    assignTask.mockResolvedValue({ emailSent: true });
    resolveAssignableUserByEmail.mockResolvedValue(null);
  });

  it('creates a task without assignee or entity', async () => {
    const result = await createTaskAction(
      { ok: false },
      formData({
        title: 'Follow up',
        priority: 'p3',
      }),
    );

    expect(result).toEqual({ ok: true });
    expect(createTask).toHaveBeenCalledWith({
      title: 'Follow up',
      description: undefined,
      priority: 'p3',
      entityId: undefined,
      dueOn: undefined,
    });
    expect(assignTask).not.toHaveBeenCalled();
  });

  it('creates with entity and assigns when email matches an account user', async () => {
    resolveAssignableUserByEmail.mockResolvedValue({
      id: 'user-1',
      name: 'Alex',
      email: 'alex@example.com',
    });

    const result = await createTaskAction(
      { ok: false },
      formData({
        title: 'Review contract',
        priority: 'p2',
        entityId: '11111111-1111-4111-8111-111111111111',
        assigneeEmail: 'alex@example.com',
      }),
    );

    expect(result).toEqual({
      ok: true,
      message: 'Task created. Assigned and notification emailed.',
    });
    expect(createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Review contract',
        entityId: '11111111-1111-4111-8111-111111111111',
      }),
    );
    expect(assignTask).toHaveBeenCalledWith({
      id: 'task-1',
      ownerUserId: 'user-1',
    });
  });

  it('returns a field error when assignee email is not an account member', async () => {
    const result = await createTaskAction(
      { ok: false },
      formData({
        title: 'Review contract',
        priority: 'p2',
        assigneeEmail: 'outside@example.com',
      }),
    );

    expect(result).toEqual({
      ok: false,
      fieldErrors: {
        assigneeEmail: ['No active account member matches this email.'],
      },
    });
    expect(createTask).not.toHaveBeenCalled();
    expect(assignTask).not.toHaveBeenCalled();
  });

  it('creates and assigns with SendGrid degrade messaging', async () => {
    resolveAssignableUserByEmail.mockResolvedValue({
      id: 'user-1',
      name: 'Alex',
      email: 'alex@example.com',
    });
    assignTask.mockResolvedValue({ emailSent: false, emailSkippedReason: 'not_configured' });

    const result = await createTaskAction(
      { ok: false },
      formData({
        title: 'Review contract',
        priority: 'p2',
        assigneeEmail: 'alex@example.com',
      }),
    );

    expect(result).toEqual({
      ok: true,
      message: 'Task created. Assigned. Email not sent — SendGrid is not configured.',
    });
  });
});
