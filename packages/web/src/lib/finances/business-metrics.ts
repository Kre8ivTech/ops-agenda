export const BUSINESS_PERIODS = [30, 90, 365] as const;

export type BusinessPeriod = (typeof BUSINESS_PERIODS)[number];

export interface BusinessTransactionMetricInput {
  amount: string;
  category: string | null;
  direction: 'in' | 'out';
  dueOn: Date | null;
}

export interface BusinessTrendPoint {
  label: string;
  revenue: number;
  expenses: number;
}

export interface BusinessExpenseCategory {
  name: string;
  amount: number;
  share: number;
}

export interface BusinessFinanceSummary {
  revenue: number;
  expenses: number;
  net: number;
  margin: number;
  categories: BusinessExpenseCategory[];
  trend: BusinessTrendPoint[];
}

export function parseBusinessPeriod(value: string | string[] | undefined): BusinessPeriod {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number(candidate);
  return BUSINESS_PERIODS.includes(parsed as BusinessPeriod) ? (parsed as BusinessPeriod) : 90;
}

function parseCents(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function bucketLabel(start: Date, days: BusinessPeriod): string {
  return start.toLocaleDateString(
    'en-US',
    days === 365
      ? { month: 'short', timeZone: 'UTC' }
      : { month: 'short', day: 'numeric', timeZone: 'UTC' },
  );
}

export function summarizeBusinessFinances(
  transactions: BusinessTransactionMetricInput[],
  options: { days: BusinessPeriod; now?: Date },
): BusinessFinanceSummary {
  const now = options.now ?? new Date();
  const bucketCount = options.days === 365 ? 12 : 6;
  const rangeMs = options.days * 86_400_000;
  const rangeStart = new Date(now.getTime() - rangeMs);
  const bucketMs = rangeMs / bucketCount;
  const trend = Array.from({ length: bucketCount }, (_, index) => {
    const start = new Date(rangeStart.getTime() + index * bucketMs);
    return { label: bucketLabel(start, options.days), revenue: 0, expenses: 0 };
  });
  const categoryTotals = new Map<string, number>();

  let revenue = 0;
  let expenses = 0;

  for (const transaction of transactions) {
    const amount = parseCents(transaction.amount);
    if (transaction.direction === 'in') {
      revenue += amount;
    } else {
      expenses += amount;
      const category = transaction.category?.trim() || 'Uncategorized';
      categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + amount);
    }

    if (!transaction.dueOn) continue;
    const offset = transaction.dueOn.getTime() - rangeStart.getTime();
    if (offset < 0 || offset > rangeMs) continue;
    const bucketIndex = Math.min(Math.floor(offset / bucketMs), bucketCount - 1);
    if (transaction.direction === 'in') trend[bucketIndex].revenue += amount;
    else trend[bucketIndex].expenses += amount;
  }

  const categories = [...categoryTotals.entries()]
    .map(([name, amount]) => ({
      name,
      amount,
      share: expenses > 0 ? amount / expenses : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const net = revenue - expenses;
  return {
    revenue,
    expenses,
    net,
    margin: revenue > 0 ? net / revenue : 0,
    categories,
    trend,
  };
}
