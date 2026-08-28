import { describe, expect, it } from 'vitest';

import { parseBusinessPeriod, summarizeBusinessFinances } from './business-metrics';

const now = new Date('2026-08-27T12:00:00Z');

describe('parseBusinessPeriod', () => {
  it('accepts supported rolling periods', () => {
    expect(parseBusinessPeriod('30')).toBe(30);
    expect(parseBusinessPeriod('365')).toBe(365);
  });

  it('defaults unsupported input to 90 days', () => {
    expect(parseBusinessPeriod('7')).toBe(90);
    expect(parseBusinessPeriod(undefined)).toBe(90);
  });
});

describe('summarizeBusinessFinances', () => {
  const transactions = [
    {
      amount: '125000',
      category: 'Client revenue',
      direction: 'in' as const,
      dueOn: new Date('2026-08-20T12:00:00Z'),
    },
    {
      amount: '35000',
      category: 'Payroll',
      direction: 'out' as const,
      dueOn: new Date('2026-08-18T12:00:00Z'),
    },
    {
      amount: '15000',
      category: 'Software',
      direction: 'out' as const,
      dueOn: new Date('2026-08-04T12:00:00Z'),
    },
    {
      amount: '5000',
      category: 'Payroll',
      direction: 'out' as const,
      dueOn: new Date('2026-07-31T12:00:00Z'),
    },
  ];

  it('calculates revenue, expenses, net income, and margin', () => {
    const summary = summarizeBusinessFinances(transactions, { days: 90, now });

    expect(summary.revenue).toBe(125000);
    expect(summary.expenses).toBe(55000);
    expect(summary.net).toBe(70000);
    expect(summary.margin).toBeCloseTo(0.56);
  });

  it('groups expense categories from largest to smallest', () => {
    const summary = summarizeBusinessFinances(transactions, { days: 90, now });

    expect(summary.categories).toEqual([
      { name: 'Payroll', amount: 40000, share: 40000 / 55000 },
      { name: 'Software', amount: 15000, share: 15000 / 55000 },
    ]);
  });

  it('places every transaction in the trend series without changing totals', () => {
    const summary = summarizeBusinessFinances(transactions, { days: 90, now });

    expect(summary.trend).toHaveLength(6);
    expect(summary.trend.reduce((total, point) => total + point.revenue, 0)).toBe(125000);
    expect(summary.trend.reduce((total, point) => total + point.expenses, 0)).toBe(55000);
  });

  it('handles missing categories and invalid amounts safely', () => {
    const summary = summarizeBusinessFinances(
      [
        { amount: 'not-a-number', category: null, direction: 'in', dueOn: now },
        { amount: '2500', category: null, direction: 'out', dueOn: now },
      ],
      { days: 30, now },
    );

    expect(summary.revenue).toBe(0);
    expect(summary.categories[0]).toEqual({ name: 'Uncategorized', amount: 2500, share: 1 });
  });
});
