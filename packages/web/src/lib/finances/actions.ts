'use server';

import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { createDb, withTenant } from '@/lib/db';
import { financialAccount, financialTransaction } from '@/lib/db/schema';
import { env } from '@/lib/env';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireTenant() {
  const session = await getSession();
  if (!session?.accountId || !session.userId) {
    throw new Error('Your session is not linked to a tenant account');
  }
  return { accountId: session.accountId, userId: session.userId };
}

function getDb() {
  return createDb(env.DATABASE_URL);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AccountRow {
  id: string;
  name: string;
  institution: string | null;
  entityName: string | null;
  balance: string;
  change30d: string | null;
  state: string;
  kind: string;
}

export interface TransactionRow {
  id: string;
  description: string;
  amount: string;
  direction: string;
  status: string;
  dueOn: Date | null;
  recurrence: string | null;
  entityName: string | null;
  category: string | null;
  isDeferred: boolean;
}

export interface FinanceMetrics {
  /** Sum of all account balances (positive accounts) */
  cashOnHand: number;
  /** cashOnHand minus committed outflows next 30 days */
  safeToSpend: number;
  /** cashOnHand / average monthly outflow */
  runwayMonths: number;
  /** Accounts below threshold */
  needsAttention: number;
}

export interface CashFlowSummary {
  totalIn: number;
  totalOut: number;
  net: number;
  comingIn: TransactionRow[];
  goingOut: TransactionRow[];
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function listAccounts(): Promise<AccountRow[]> {
  const tenant = await requireTenant();
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const rows = await tx
      .select({
        id: financialAccount.id,
        name: financialAccount.name,
        institution: financialAccount.institution,
        entityName: financialAccount.entityName,
        balance: financialAccount.balance,
        change30d: financialAccount.change30d,
        state: financialAccount.state,
        kind: financialAccount.kind,
      })
      .from(financialAccount)
      .where(eq(financialAccount.accountId, tenant.accountId))
      .orderBy(desc(financialAccount.balance));

    return rows;
  });
}

export async function getFinanceMetrics(): Promise<FinanceMetrics> {
  const tenant = await requireTenant();
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const acctCond = eq(financialAccount.accountId, tenant.accountId);

    // Sum of all positive balances and count of below_threshold
    const [accountMetrics] = await tx
      .select({
        cashOnHand:
          sql<number>`coalesce(sum(case when ${financialAccount.balance}::bigint > 0 then ${financialAccount.balance}::bigint else 0 end), 0)`.mapWith(Number),
        needsAttention:
          sql<number>`count(*) filter (where ${eq(financialAccount.state, 'below_threshold')})`.mapWith(Number),
      })
      .from(financialAccount)
      .where(acctCond);

    const cashOnHand = accountMetrics.cashOnHand;
    const needsAttention = accountMetrics.needsAttention;

    // Committed outflows in the next 30 days
    const now = new Date();
    const thirtyDaysOut = new Date(now.getTime() + 30 * 86400000);

    const [outflowResult] = await tx
      .select({
        committedOutflow:
          sql<number>`coalesce(sum(${financialTransaction.amount}::bigint), 0)`.mapWith(Number),
      })
      .from(financialTransaction)
      .where(
        and(
          eq(financialTransaction.accountId, tenant.accountId),
          eq(financialTransaction.direction, 'out'),
          gte(financialTransaction.dueOn, now),
          lte(financialTransaction.dueOn, thirtyDaysOut),
        ),
      );

    const committedOutflow = outflowResult.committedOutflow;
    const safeToSpend = cashOnHand - committedOutflow;

    // Average monthly outflow (all historical outflows averaged over 6 months)
    const sixMonthsAgo = new Date(now.getTime() - 180 * 86400000);
    const [avgResult] = await tx
      .select({
        totalOutflow:
          sql<number>`coalesce(sum(${financialTransaction.amount}::bigint), 0)`.mapWith(Number),
      })
      .from(financialTransaction)
      .where(
        and(
          eq(financialTransaction.accountId, tenant.accountId),
          eq(financialTransaction.direction, 'out'),
          gte(financialTransaction.dueOn, sixMonthsAgo),
          lte(financialTransaction.dueOn, now),
        ),
      );

    const avgMonthlyOutflow = avgResult.totalOutflow / 6;
    const runwayMonths = avgMonthlyOutflow > 0 ? Math.round((cashOnHand / avgMonthlyOutflow) * 10) / 10 : 0;

    return { cashOnHand, safeToSpend, runwayMonths, needsAttention };
  });
}

export async function getCashFlow(options?: { days?: number }): Promise<CashFlowSummary> {
  const tenant = await requireTenant();
  const db = getDb();
  const days = options?.days ?? 30;

  return withTenant(db, tenant, async (tx) => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 86400000);

    const rows = await tx
      .select({
        id: financialTransaction.id,
        description: financialTransaction.description,
        amount: financialTransaction.amount,
        direction: financialTransaction.direction,
        status: financialTransaction.status,
        dueOn: financialTransaction.dueOn,
        recurrence: financialTransaction.recurrence,
        entityName: financialTransaction.entityName,
        category: financialTransaction.category,
        isDeferred: financialTransaction.isDeferred,
      })
      .from(financialTransaction)
      .where(
        and(
          eq(financialTransaction.accountId, tenant.accountId),
          gte(financialTransaction.dueOn, now),
          lte(financialTransaction.dueOn, futureDate),
        ),
      )
      .orderBy(financialTransaction.dueOn);

    const comingIn: TransactionRow[] = [];
    const goingOut: TransactionRow[] = [];
    let totalIn = 0;
    let totalOut = 0;

    for (const row of rows) {
      if (row.direction === 'in') {
        comingIn.push(row);
        totalIn += parseInt(row.amount, 10);
      } else {
        goingOut.push(row);
        totalOut += parseInt(row.amount, 10);
      }
    }

    return { totalIn, totalOut, net: totalIn - totalOut, comingIn, goingOut };
  });
}

export async function listTransactions(options?: {
  direction?: 'in' | 'out';
  days?: number;
}): Promise<TransactionRow[]> {
  const tenant = await requireTenant();
  const db = getDb();
  const days = options?.days ?? 30;

  return withTenant(db, tenant, async (tx) => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 86400000);

    const conditions = [
      eq(financialTransaction.accountId, tenant.accountId),
      gte(financialTransaction.dueOn, now),
      lte(financialTransaction.dueOn, futureDate),
    ];

    if (options?.direction) {
      conditions.push(eq(financialTransaction.direction, options.direction));
    }

    const rows = await tx
      .select({
        id: financialTransaction.id,
        description: financialTransaction.description,
        amount: financialTransaction.amount,
        direction: financialTransaction.direction,
        status: financialTransaction.status,
        dueOn: financialTransaction.dueOn,
        recurrence: financialTransaction.recurrence,
        entityName: financialTransaction.entityName,
        category: financialTransaction.category,
        isDeferred: financialTransaction.isDeferred,
      })
      .from(financialTransaction)
      .where(and(...conditions))
      .orderBy(financialTransaction.dueOn);

    return rows;
  });
}
