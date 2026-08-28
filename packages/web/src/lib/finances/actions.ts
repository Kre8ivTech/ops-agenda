'use server';

import { and, asc, desc, eq, gte, inArray, isNull, lte, ne, or, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';
import { createDb, withTenant } from '@/lib/db';
import { entity, financialAccount, financialTransaction } from '@/lib/db/schema';
import { ENTITY_SELECTION_COOKIE } from '@/lib/entities/queries';
import { env } from '@/lib/env';
import type { BusinessPeriod } from '@/lib/finances/business-metrics';

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
  direction: 'in' | 'out';
  status: 'contracted' | 'committed' | 'projected' | 'deferred';
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

export interface BusinessEntityRow {
  id: string;
  name: string;
  kind: 'llc' | 'corp' | 'sole_prop' | 'nonprofit';
}

export interface BusinessAccountRow {
  id: string;
  name: string;
  institution: string | null;
  balance: string;
  change30d: string | null;
  state: string;
  kind: string;
}

export interface BusinessTransactionRow extends TransactionRow {
  accountName: string | null;
}

export interface BusinessFinanceData {
  businesses: BusinessEntityRow[];
  selectedBusiness: BusinessEntityRow | null;
  accounts: BusinessAccountRow[];
  transactions: BusinessTransactionRow[];
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
          sql<number>`coalesce(sum(case when ${financialAccount.balance}::bigint > 0 then ${financialAccount.balance}::bigint else 0 end), 0)`.mapWith(
            Number,
          ),
        needsAttention:
          sql<number>`count(*) filter (where ${eq(financialAccount.state, 'below_threshold')})`.mapWith(
            Number,
          ),
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
        totalOutflow: sql<number>`coalesce(sum(${financialTransaction.amount}::bigint), 0)`.mapWith(
          Number,
        ),
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
    const runwayMonths =
      avgMonthlyOutflow > 0 ? Math.round((cashOnHand / avgMonthlyOutflow) * 10) / 10 : 0;

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

/** Read-only business finances, scoped by the shared entity switcher cookie. */
export async function getBusinessFinanceData(options: {
  days: BusinessPeriod;
}): Promise<BusinessFinanceData> {
  const tenant = await requireTenant();
  const db = getDb();
  const cookieStore = await cookies();
  const requestedEntityId = cookieStore.get(ENTITY_SELECTION_COOKIE)?.value;
  const days = [30, 90, 365].includes(options.days) ? options.days : 90;

  return withTenant(db, tenant, async (tx) => {
    const businessRows = await tx
      .select({ id: entity.id, name: entity.name, kind: entity.kind })
      .from(entity)
      .where(
        and(
          eq(entity.accountId, tenant.accountId),
          ne(entity.kind, 'personal'),
          isNull(entity.deletedAt),
        ),
      )
      .orderBy(asc(entity.name));
    const businesses = businessRows.flatMap((business): BusinessEntityRow[] =>
      business.kind === 'personal'
        ? []
        : [{ id: business.id, name: business.name, kind: business.kind }],
    );

    if (businesses.length === 0) {
      return { businesses: [], selectedBusiness: null, accounts: [], transactions: [] };
    }

    const selectedBusiness =
      businesses.find((business) => business.id === requestedEntityId) ?? null;
    const scopedBusinesses = selectedBusiness ? [selectedBusiness] : businesses;
    const businessIds = scopedBusinesses.map((business) => business.id);
    const businessNames = scopedBusinesses.map((business) => business.name);
    const accountScope = or(
      inArray(financialAccount.entityId, businessIds),
      inArray(financialAccount.entityName, businessNames),
    );

    const accounts = await tx
      .select({
        id: financialAccount.id,
        name: financialAccount.name,
        institution: financialAccount.institution,
        balance: financialAccount.balance,
        change30d: financialAccount.change30d,
        state: financialAccount.state,
        kind: financialAccount.kind,
      })
      .from(financialAccount)
      .where(
        and(
          eq(financialAccount.accountId, tenant.accountId),
          isNull(financialAccount.deletedAt),
          accountScope,
        ),
      )
      .orderBy(desc(sql`${financialAccount.balance}::bigint`));

    const now = new Date();
    const rangeStart = new Date(now.getTime() - days * 86_400_000);
    const transactionScope = or(
      inArray(financialAccount.entityId, businessIds),
      inArray(financialAccount.entityName, businessNames),
      inArray(financialTransaction.entityName, businessNames),
    );

    const transactions = await tx
      .select({
        id: financialTransaction.id,
        description: financialTransaction.description,
        amount: financialTransaction.amount,
        direction: financialTransaction.direction,
        status: financialTransaction.status,
        dueOn: financialTransaction.dueOn,
        recurrence: financialTransaction.recurrence,
        entityName: sql<
          string | null
        >`coalesce(${financialTransaction.entityName}, ${financialAccount.entityName})`,
        category: financialTransaction.category,
        isDeferred: financialTransaction.isDeferred,
        accountName: financialAccount.name,
      })
      .from(financialTransaction)
      .leftJoin(
        financialAccount,
        and(
          eq(financialTransaction.financialAccountId, financialAccount.id),
          eq(financialAccount.accountId, tenant.accountId),
        ),
      )
      .where(
        and(
          eq(financialTransaction.accountId, tenant.accountId),
          isNull(financialTransaction.deletedAt),
          gte(financialTransaction.dueOn, rangeStart),
          lte(financialTransaction.dueOn, now),
          transactionScope,
        ),
      )
      .orderBy(desc(financialTransaction.dueOn));

    return { businesses, selectedBusiness, accounts, transactions };
  });
}
