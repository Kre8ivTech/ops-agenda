import { describe, expect, it } from 'vitest';

import {
  buildNarrative,
  capacityStatus,
  greetingName,
  isUnhandled,
  plannedPercent,
  selectDueOuts,
  selectTopPriorities,
  whyLine,
  type DashboardTask,
} from '@/lib/dashboard/brief';

function task(partial: Partial<DashboardTask> & Pick<DashboardTask, 'id' | 'title'>): DashboardTask {
  return {
    description: null,
    priority: 'p3',
    status: 'open',
    flagState: 'none',
    flagReasonCode: null,
    flagReasonText: null,
    dueOn: null,
    handledAt: null,
    createdAt: new Date('2026-07-30T08:00:00'),
    ...partial,
  };
}

const noon = new Date('2026-07-30T12:00:00');

describe('selectTopPriorities', () => {
  it('prefers at-risk and p1 over plain open tasks', () => {
    const tasks = [
      task({ id: '1', title: 'Later', priority: 'p3' }),
      task({ id: '2', title: 'Risk', priority: 'p2', flagState: 'at_risk' }),
      task({ id: '3', title: 'P1', priority: 'p1' }),
      task({ id: '4', title: 'Handled', priority: 'p1', handledAt: noon }),
    ];
    const top = selectTopPriorities(tasks, 3);
    expect(top.map((t) => t.id)).toEqual(['3', '2', '1']);
  });

  it('excludes handled and settled', () => {
    const tasks = [
      task({ id: '1', title: 'Done', handledAt: noon }),
      task({ id: '2', title: 'Settled', flagState: 'settled' }),
      task({ id: '3', title: 'Open', priority: 'p2' }),
    ];
    expect(selectTopPriorities(tasks, 3).map((t) => t.id)).toEqual(['3']);
  });
});

describe('selectDueOuts', () => {
  it('returns unhandled tasks with due dates soonest first', () => {
    const tasks = [
      task({ id: '1', title: 'Fri', dueOn: new Date('2026-08-01') }),
      task({ id: '2', title: 'Today', dueOn: new Date('2026-07-30T16:00:00') }),
      task({ id: '3', title: 'No due' }),
      task({ id: '4', title: 'Done', dueOn: new Date('2026-07-29'), handledAt: noon }),
    ];
    expect(selectDueOuts(tasks, 6).map((t) => t.id)).toEqual(['2', '1']);
  });
});

describe('whyLine / narrative / metrics', () => {
  it('uses flagReasonText when present', () => {
    expect(
      whyLine(task({ id: '1', title: 'X', flagReasonText: 'Vendor waiting on owner' }), noon),
    ).toBe('Vendor waiting on owner');
  });

  it('falls back to due today', () => {
    expect(
      whyLine(task({ id: '1', title: 'X', dueOn: new Date('2026-07-30T15:00:00') }), noon),
    ).toBe('Due today');
  });

  it('builds an empty narrative with no open tasks', () => {
    const { headline } = buildNarrative([], noon);
    expect(headline).toMatch(/nothing open/i);
  });

  it('mentions at-risk count in the body', () => {
    const { body } = buildNarrative(
      [
        task({ id: '1', title: 'Procurement', priority: 'p1', flagState: 'at_risk' }),
        task({ id: '2', title: 'Readout', priority: 'p2', flagState: 'attention' }),
      ],
      noon,
    );
    expect(body).toMatch(/at risk/i);
    expect(body).toMatch(/Procurement/);
  });

  it('computes planned percent from handled today vs open top', () => {
    const tasks = [
      task({ id: '1', title: 'A', priority: 'p1', handledAt: noon }),
      task({ id: '2', title: 'B', priority: 'p1' }),
      task({ id: '3', title: 'C', priority: 'p2' }),
    ];
    // 1 handled today + 2 open top = 33%
    expect(plannedPercent(tasks, noon)).toBe(33);
  });

  it('marks capacity Tight with multiple P1s', () => {
    const status = capacityStatus(
      [
        task({ id: '1', title: 'A', priority: 'p1' }),
        task({ id: '2', title: 'B', priority: 'p1' }),
      ],
      noon,
    );
    expect(status.level).toBe('Tight');
  });
});

describe('greetingName / isUnhandled', () => {
  it('uses first name from session name', () => {
    expect(greetingName({ name: 'Dana Whitfield' })).toBe('Dana');
  });

  it('falls back to email local part', () => {
    expect(greetingName({ email: 'dana.whitfield@northgate.co' })).toBe('Dana');
  });

  it('treats settled as handled for unhandled check', () => {
    expect(isUnhandled(task({ id: '1', title: 'X', flagState: 'settled' }))).toBe(false);
  });
});
