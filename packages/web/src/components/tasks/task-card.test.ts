import { describe, expect, it } from 'vitest';

import type { TaskSelect } from '@/lib/db/schema';
import { classifyTask, kanbanActionForColumn } from './task-card';

function makeTask(overrides: Partial<TaskSelect> = {}): TaskSelect {
  const now = new Date('2026-08-30T12:00:00.000Z');
  return {
    id: '11111111-1111-4111-8111-111111111111',
    accountId: '22222222-2222-4222-8222-222222222222',
    entityId: null,
    title: 'Test task',
    status: 'open',
    priority: 'p3',
    dueOn: null,
    ownerUserId: null,
    flagState: 'none',
    flagReasonCode: null,
    flagReasonText: null,
    handledAt: null,
    handledBy: null,
    sourceConnectionId: null,
    sourceExternalId: null,
    description: null,
    createdAt: now,
    updatedAt: now,
    createdBy: null,
    updatedBy: null,
    deletedAt: null,
    ...overrides,
  } as TaskSelect;
}

describe('kanbanActionForColumn', () => {
  it('maps done to reopen so the board button calls reopenTask', () => {
    expect(kanbanActionForColumn('done')).toBe('reopen');
  });

  it('maps in_progress to complete', () => {
    expect(kanbanActionForColumn('in_progress')).toBe('complete');
  });

  it('maps inbox and today to start (Approve / Start)', () => {
    expect(kanbanActionForColumn('inbox')).toBe('start');
    expect(kanbanActionForColumn('today')).toBe('start');
  });
});

describe('classifyTask', () => {
  it('puts handled and settled tasks in done', () => {
    expect(classifyTask(makeTask({ handledAt: new Date() }))).toBe('done');
    expect(classifyTask(makeTask({ flagState: 'settled' }))).toBe('done');
  });

  it('puts in_progress status and attention flags in in_progress', () => {
    expect(classifyTask(makeTask({ status: 'in_progress' }))).toBe('in_progress');
    expect(classifyTask(makeTask({ flagState: 'attention' }))).toBe('in_progress');
    expect(classifyTask(makeTask({ flagState: 'at_risk' }))).toBe('in_progress');
  });

  it('puts due-today open tasks in today', () => {
    const dueOn = new Date();
    dueOn.setHours(15, 0, 0, 0);
    expect(classifyTask(makeTask({ dueOn }))).toBe('today');
  });

  it('puts open undated tasks in inbox', () => {
    expect(classifyTask(makeTask())).toBe('inbox');
  });

  it('keeps mail-extracted open tasks in inbox until approved/started', () => {
    expect(
      classifyTask(
        makeTask({
          sourceConnectionId: '33333333-3333-4333-8333-333333333333',
          status: 'open',
        }),
      ),
    ).toBe('inbox');
  });
});
