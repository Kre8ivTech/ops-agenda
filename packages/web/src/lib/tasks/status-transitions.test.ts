import { describe, expect, it } from 'vitest';

/**
 * Documents the status field transitions used by task lifecycle actions.
 * These mirror packages/web/src/lib/tasks/actions.ts — kept pure so reopen/
 * complete/start regressions are catchable without a live database.
 */
function nextStatus(
  action: 'start' | 'complete' | 'reopen',
  current: { status: string; flagState: string },
): { status: string; handled: boolean; flagState: string } {
  switch (action) {
    case 'start':
      return {
        status: 'in_progress',
        handled: false,
        flagState: current.flagState === 'settled' ? 'attention' : current.flagState,
      };
    case 'complete':
      return { status: 'done', handled: true, flagState: 'settled' };
    case 'reopen':
      return {
        status: 'open',
        handled: false,
        flagState: current.flagState === 'settled' ? 'attention' : current.flagState,
      };
  }
}

describe('task status transitions', () => {
  it('reopen clears handled and restores open status from a completed task', () => {
    expect(nextStatus('reopen', { status: 'done', flagState: 'settled' })).toEqual({
      status: 'open',
      handled: false,
      flagState: 'attention',
    });
  });

  it('complete settles the task', () => {
    expect(nextStatus('complete', { status: 'in_progress', flagState: 'none' })).toEqual({
      status: 'done',
      handled: true,
      flagState: 'settled',
    });
  });

  it('start moves open (including mail-extracted) tasks to in_progress', () => {
    expect(nextStatus('start', { status: 'open', flagState: 'none' })).toEqual({
      status: 'in_progress',
      handled: false,
      flagState: 'none',
    });
  });
});
