'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { createDb, withTenant } from '@/lib/db';
import { emailThread } from '@/lib/db/schema';
import { env } from '@/lib/env';

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

const threadIdSchema = z.string().uuid();

export async function markThreadHandled(threadId: string) {
  const validatedId = threadIdSchema.parse(threadId);
  const tenant = await requireTenant();
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const [updated] = await tx
      .update(emailThread)
      .set({ handledAt: new Date(), handledBy: tenant.userId })
      .where(
        and(
          eq(emailThread.id, validatedId),
          eq(emailThread.accountId, tenant.accountId),
        ),
      )
      .returning();

    if (!updated) throw new Error('Thread not found');

    revalidatePath('/productivity/email');
    revalidatePath('/dashboard');
    return updated;
  });
}

export async function reopenThread(threadId: string) {
  const validatedId = threadIdSchema.parse(threadId);
  const tenant = await requireTenant();
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const [updated] = await tx
      .update(emailThread)
      .set({ handledAt: null, handledBy: null })
      .where(
        and(
          eq(emailThread.id, validatedId),
          eq(emailThread.accountId, tenant.accountId),
        ),
      )
      .returning();

    if (!updated) throw new Error('Thread not found');

    revalidatePath('/productivity/email');
    revalidatePath('/dashboard');
    return updated;
  });
}

const snoozeSchema = z.object({
  threadId: z.string().uuid(),
  until: z.coerce.date(),
});

export async function snoozeThread(threadId: string, until: Date) {
  const validated = snoozeSchema.parse({ threadId, until });
  const tenant = await requireTenant();
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const [updated] = await tx
      .update(emailThread)
      .set({ snoozedUntil: validated.until })
      .where(
        and(
          eq(emailThread.id, validated.threadId),
          eq(emailThread.accountId, tenant.accountId),
        ),
      )
      .returning();

    if (!updated) throw new Error('Thread not found');

    revalidatePath('/productivity/email');
    return updated;
  });
}

export async function unsnoozeThread(threadId: string) {
  const validatedId = threadIdSchema.parse(threadId);
  const tenant = await requireTenant();
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const [updated] = await tx
      .update(emailThread)
      .set({ snoozedUntil: null })
      .where(
        and(
          eq(emailThread.id, validatedId),
          eq(emailThread.accountId, tenant.accountId),
        ),
      )
      .returning();

    if (!updated) throw new Error('Thread not found');

    revalidatePath('/productivity/email');
    return updated;
  });
}

export interface ThreadMetrics {
  all: number;
  p1: number;
  p2: number;
  p3: number;
  fysa: number;
  handled: number;
  snoozed: number;
}

export async function getThreadMetrics(): Promise<ThreadMetrics> {
  const tenant = await requireTenant();
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const acctCond = eq(emailThread.accountId, tenant.accountId);

    const [metrics] = await tx
      .select({
        all: sql<number>`count(*) filter (where ${acctCond})`.mapWith(Number),
        p1: sql<number>`count(*) filter (where ${acctCond} and ${eq(emailThread.priority, 'P1')})`.mapWith(Number),
        p2: sql<number>`count(*) filter (where ${acctCond} and ${eq(emailThread.priority, 'P2')})`.mapWith(Number),
        p3: sql<number>`count(*) filter (where ${acctCond} and ${eq(emailThread.priority, 'P3')})`.mapWith(Number),
        fysa: sql<number>`count(*) filter (where ${acctCond} and ${eq(emailThread.priority, 'FYSA')})`.mapWith(Number),
        handled: sql<number>`count(*) filter (where ${acctCond} and ${isNotNull(emailThread.handledAt)})`.mapWith(Number),
        snoozed: sql<number>`count(*) filter (where ${acctCond} and ${isNotNull(emailThread.snoozedUntil)} and ${isNull(emailThread.handledAt)})`.mapWith(Number),
      })
      .from(emailThread);

    return metrics;
  });
}
