'use server';

import { revalidatePath } from 'next/cache';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { createDb, withTenant } from '@/lib/db';
import { timeEntry } from '@/lib/db/schema';
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

export interface TimeEntryRow {
  id: string;
  client: string;
  entityName: string | null;
  hours: string;
  billableAmount: string | null;
  rate: string | null;
  state: string;
  description: string | null;
  workedOn: Date;
}

export interface TimeMetrics {
  /** Sum of hours this week. */
  trackedThisWeek: number;
  /** Sum of hours where state != 'non_billable'. */
  billableHours: number;
  /** Sum of hours where state = 'unbilled'. */
  unbilledHours: number;
  /** Total billable amount / total billable hours (or 0 if no billable hours). */
  rateRealised: number;
}

export type TimeFilter = 'all' | 'needs_attention' | 'settled';

// ---------------------------------------------------------------------------
// listTimeEntries
// ---------------------------------------------------------------------------

export async function listTimeEntries(options?: {
  filter?: TimeFilter;
  search?: string;
}): Promise<{
  rows: TimeEntryRow[];
  counts: { all: number; needsAttention: number; settled: number };
}> {
  const tenant = await requireTenant();
  const db = getDb();
  const filter = options?.filter ?? 'all';
  const search = options?.search?.trim();

  return withTenant(db, tenant, async (tx) => {
    const baseCond = search
      ? and(
          eq(timeEntry.accountId, tenant.accountId),
          sql`(${timeEntry.client} ILIKE ${'%' + search + '%'} OR ${timeEntry.entityName} ILIKE ${'%' + search + '%'} OR ${timeEntry.description} ILIKE ${'%' + search + '%'})`,
        )
      : eq(timeEntry.accountId, tenant.accountId);

    // Filter conditions
    const needsAttentionCond = eq(timeEntry.state, 'unbilled');
    const settledCond = sql`(${timeEntry.state} = 'invoiced' OR ${timeEntry.state} = 'written_off')`;

    // Aggregate counts in a single query
    const [counts] = await tx
      .select({
        all: sql<number>`count(*) filter (where ${baseCond})`.mapWith(Number),
        needsAttention:
          sql<number>`count(*) filter (where ${baseCond} and ${needsAttentionCond})`.mapWith(Number),
        settled:
          sql<number>`count(*) filter (where ${baseCond} and ${settledCond})`.mapWith(Number),
      })
      .from(timeEntry);

    // Determine active filter condition
    const filterCond =
      filter === 'needs_attention'
        ? and(baseCond, needsAttentionCond)
        : filter === 'settled'
          ? and(baseCond, settledCond)
          : baseCond;

    const rows = await tx
      .select({
        id: timeEntry.id,
        client: timeEntry.client,
        entityName: timeEntry.entityName,
        hours: timeEntry.hours,
        billableAmount: timeEntry.billableAmount,
        rate: timeEntry.rate,
        state: timeEntry.state,
        description: timeEntry.description,
        workedOn: timeEntry.workedOn,
      })
      .from(timeEntry)
      .where(filterCond)
      .orderBy(desc(timeEntry.workedOn));

    return { rows, counts };
  });
}

// ---------------------------------------------------------------------------
// getTimeMetrics
// ---------------------------------------------------------------------------

export async function getTimeMetrics(): Promise<TimeMetrics> {
  const tenant = await requireTenant();
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    // Calculate the start (Monday) and end (Sunday) of the current week
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() + mondayOffset);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const acctCond = eq(timeEntry.accountId, tenant.accountId);
    const weekCond = sql`${timeEntry.workedOn} >= ${monday.toISOString()} AND ${timeEntry.workedOn} <= ${sunday.toISOString()}`;

    const [metrics] = await tx
      .select({
        trackedThisWeek:
          sql<number>`coalesce(sum(${timeEntry.hours}::numeric) filter (where ${acctCond} and ${weekCond}), 0)`.mapWith(Number),
        billableHours:
          sql<number>`coalesce(sum(${timeEntry.hours}::numeric) filter (where ${acctCond} and ${weekCond} and ${timeEntry.state} != 'non_billable'), 0)`.mapWith(Number),
        unbilledHours:
          sql<number>`coalesce(sum(${timeEntry.hours}::numeric) filter (where ${acctCond} and ${weekCond} and ${timeEntry.state} = 'unbilled'), 0)`.mapWith(Number),
        totalBillableAmount:
          sql<number>`coalesce(sum(${timeEntry.billableAmount}::numeric) filter (where ${acctCond} and ${weekCond} and ${timeEntry.state} != 'non_billable'), 0)`.mapWith(Number),
      })
      .from(timeEntry);

    const rateRealised =
      metrics.billableHours > 0
        ? metrics.totalBillableAmount / metrics.billableHours
        : 0;

    return {
      trackedThisWeek: metrics.trackedThisWeek,
      billableHours: metrics.billableHours,
      unbilledHours: metrics.unbilledHours,
      rateRealised: Math.round(rateRealised * 100) / 100,
    };
  });
}

// ---------------------------------------------------------------------------
// logTimeEntry
// ---------------------------------------------------------------------------

const logTimeEntrySchema = z.object({
  client: z.string().min(1, 'Client is required'),
  entityName: z.string().optional(),
  hours: z.number().positive('Hours must be positive'),
  rate: z.number().min(0).optional(),
  state: z.enum(['unbilled', 'invoiced', 'non_billable', 'written_off']).optional(),
  description: z.string().optional(),
  workedOn: z.string().min(1, 'Worked-on date is required'),
});

export async function logTimeEntry(input: {
  client: string;
  entityName?: string;
  hours: number;
  rate?: number;
  state?: string;
  description?: string;
  workedOn: string;
}): Promise<void> {
  const tenant = await requireTenant();
  const db = getDb();

  const parsed = logTimeEntrySchema.parse(input);
  const billableAmount =
    parsed.rate != null ? String(parsed.hours * parsed.rate) : null;

  await withTenant(db, tenant, async (tx) => {
    await tx.insert(timeEntry).values({
      accountId: tenant.accountId,
      client: parsed.client,
      entityName: parsed.entityName ?? null,
      hours: String(parsed.hours),
      billableAmount,
      rate: parsed.rate != null ? String(parsed.rate) : null,
      state: parsed.state as 'unbilled' | 'invoiced' | 'non_billable' | 'written_off' | undefined,
      description: parsed.description ?? null,
      workedOn: new Date(parsed.workedOn),
      createdBy: tenant.userId,
      updatedBy: tenant.userId,
    });
  });

  revalidatePath('/productivity/time');
}
