import { describe, expect, it } from 'vitest';
import {
  isTaskNeedsAttention,
  isTaskSettled,
  matchesTaskFilter,
  parsePage,
  parseSortDirection,
  parseTaskFilter,
  parseTaskSort,
  taskFlagBorderClass,
  taskFlagLabel,
} from './filters';

const now = new Date('2026-07-30T12:00:00Z');

type FlagState = 'none' | 'attention' | 'at_risk' | 'settled';

function task(
  overrides: Partial<{ handledAt: Date | null; flagState: FlagState; dueOn: Date | null }>,
) {
  return {
    handledAt: null,
    flagState: 'none' as FlagState,
    dueOn: null,
    ...overrides,
  };
}

describe('isTaskSettled', () => {
  it('is settled once handled', () => {
    expect(isTaskSettled(task({ handledAt: now }))).toBe(true);
  });

  it('is settled when flagged settled even without handledAt', () => {
    expect(isTaskSettled(task({ flagState: 'settled' }))).toBe(true);
  });

  it('is not settled otherwise', () => {
    expect(isTaskSettled(task({}))).toBe(false);
  });
});

describe('isTaskNeedsAttention', () => {
  it('is true for an unhandled at_risk task', () => {
    expect(isTaskNeedsAttention(task({ flagState: 'at_risk' }), now)).toBe(true);
  });

  it('is true for an unhandled attention task', () => {
    expect(isTaskNeedsAttention(task({ flagState: 'attention' }), now)).toBe(true);
  });

  it('is true for an unhandled overdue task with no explicit flag', () => {
    const dueOn = new Date('2026-07-29T12:00:00Z');
    expect(isTaskNeedsAttention(task({ dueOn }), now)).toBe(true);
  });

  it('is false once handled, even if flagged at_risk', () => {
    expect(isTaskNeedsAttention(task({ handledAt: now, flagState: 'at_risk' }), now)).toBe(false);
  });

  it('is false for a task due in the future with no flag', () => {
    const dueOn = new Date('2026-08-01T12:00:00Z');
    expect(isTaskNeedsAttention(task({ dueOn }), now)).toBe(false);
  });
});

describe('matchesTaskFilter', () => {
  it('"all" matches everything', () => {
    expect(matchesTaskFilter(task({ handledAt: now }), 'all', now)).toBe(true);
    expect(matchesTaskFilter(task({}), 'all', now)).toBe(true);
  });

  it('"needs_attention" excludes settled tasks', () => {
    expect(
      matchesTaskFilter(task({ flagState: 'at_risk', handledAt: now }), 'needs_attention', now),
    ).toBe(false);
  });

  it('"settled" only matches handled or settled tasks', () => {
    expect(matchesTaskFilter(task({}), 'settled', now)).toBe(false);
    expect(matchesTaskFilter(task({ handledAt: now }), 'settled', now)).toBe(true);
  });
});

describe('taskFlagBorderClass', () => {
  it('uses the risk colour for at_risk', () => {
    expect(taskFlagBorderClass(task({ flagState: 'at_risk' }))).toBe('border-l-risk');
  });

  it('uses the info colour for attention', () => {
    expect(taskFlagBorderClass(task({ flagState: 'attention' }))).toBe('border-l-info');
  });

  it('is transparent once handled — never a colour once settled', () => {
    expect(taskFlagBorderClass(task({ flagState: 'at_risk', handledAt: now }))).toBe(
      'border-l-transparent',
    );
  });

  it('is transparent for a plain, unflagged task', () => {
    expect(taskFlagBorderClass(task({}))).toBe('border-l-transparent');
  });
});

describe('taskFlagLabel', () => {
  it('returns null once settled', () => {
    expect(taskFlagLabel(task({ handledAt: now }))).toBeNull();
  });

  it('labels at_risk and attention', () => {
    expect(taskFlagLabel(task({ flagState: 'at_risk' }))).toBe('At risk');
    expect(taskFlagLabel(task({ flagState: 'attention' }))).toBe('Needs attention');
  });
});

describe('query param parsing', () => {
  it('parseTaskFilter falls back to "all" for unknown values', () => {
    expect(parseTaskFilter('needs_attention')).toBe('needs_attention');
    expect(parseTaskFilter('bogus')).toBe('all');
    expect(parseTaskFilter(undefined)).toBe('all');
    expect(parseTaskFilter(['settled', 'all'])).toBe('settled');
  });

  it('parseTaskSort falls back to "priority" for unknown values', () => {
    expect(parseTaskSort('due_on')).toBe('due_on');
    expect(parseTaskSort('bogus')).toBe('priority');
  });

  it('parseSortDirection only accepts "desc" explicitly', () => {
    expect(parseSortDirection('desc')).toBe('desc');
    expect(parseSortDirection('asc')).toBe('asc');
    expect(parseSortDirection(undefined)).toBe('asc');
  });

  it('parsePage defaults to 1 and rejects non-positive values', () => {
    expect(parsePage('3')).toBe(3);
    expect(parsePage('0')).toBe(1);
    expect(parsePage('-4')).toBe(1);
    expect(parsePage('not-a-number')).toBe(1);
    expect(parsePage(undefined)).toBe(1);
  });
});
