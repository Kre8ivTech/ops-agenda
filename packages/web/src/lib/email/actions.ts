'use server';

import { revalidatePath } from 'next/cache';
import { and, desc, eq, isNotNull, or, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { createDb, withTenant } from '@/lib/db';
import { emailMessage } from '@/lib/db/schema';
import { env } from '@/lib/env';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

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

export type EmailFilter = 'all' | 'action_required' | 'follow_up' | 'handled';

export interface EmailRow {
  id: string;
  fromAddress: string;
  fromName: string | null;
  subject: string;
  receivedAt: Date;
  isRead: boolean;
  hasAttachments: boolean;
  signal: string;
  signalConfidence: string | null;
  signalReason: string | null;
  rankScore: string | null;
  suggestedTaskTitle: string | null;
  detectedDeadline: Date | null;
  handledAt: Date | null;
  webLink: string | null;
}

export interface EmailListResult {
  rows: EmailRow[];
  total: number;
  counts: {
    all: number;
    actionRequired: number;
    followUp: number;
    handled: number;
  };
}

export async function listEmails(options?: {
  filter?: EmailFilter;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<EmailListResult> {
  const tenant = await requireTenant();
  const db = getDb();
  const filter = options?.filter ?? 'all';
  const search = options?.search?.trim();
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, options?.pageSize ?? DEFAULT_PAGE_SIZE));

  return withTenant(db, tenant, async (tx) => {
    const baseCond = search
      ? and(
          eq(emailMessage.accountId, tenant.accountId),
          sql`(${emailMessage.subject} ILIKE ${'%' + search + '%'} OR ${emailMessage.fromAddress} ILIKE ${'%' + search + '%'} OR ${emailMessage.fromName} ILIKE ${'%' + search + '%'})`,
        )
      : eq(emailMessage.accountId, tenant.accountId);

    // Conditions for each filter chip
    const actionRequiredCond = or(
      eq(emailMessage.signal, 'action_required'),
      eq(emailMessage.signal, 'follow_up'),
    );
    const followUpCond = eq(emailMessage.signal, 'follow_up');
    const handledCond = isNotNull(emailMessage.handledAt);

    // Aggregate counts in a single query
    const [counts] = await tx
      .select({
        all: sql<number>`count(*) filter (where ${baseCond})`.mapWith(Number),
        actionRequired:
          sql<number>`count(*) filter (where ${baseCond} and ${actionRequiredCond})`.mapWith(Number),
        followUp:
          sql<number>`count(*) filter (where ${baseCond} and ${followUpCond})`.mapWith(Number),
        handled:
          sql<number>`count(*) filter (where ${baseCond} and ${handledCond})`.mapWith(Number),
      })
      .from(emailMessage);

    // Determine filter condition for the rows query
    const filterCond =
      filter === 'action_required'
        ? and(baseCond, actionRequiredCond)
        : filter === 'follow_up'
          ? and(baseCond, followUpCond)
          : filter === 'handled'
            ? and(baseCond, handledCond)
            : baseCond;

    const rows = await tx
      .select({
        id: emailMessage.id,
        fromAddress: emailMessage.fromAddress,
        fromName: emailMessage.fromName,
        subject: emailMessage.subject,
        receivedAt: emailMessage.receivedAt,
        isRead: emailMessage.isRead,
        hasAttachments: emailMessage.hasAttachments,
        signal: emailMessage.signal,
        signalConfidence: emailMessage.signalConfidence,
        signalReason: emailMessage.signalReason,
        rankScore: emailMessage.rankScore,
        suggestedTaskTitle: emailMessage.suggestedTaskTitle,
        detectedDeadline: emailMessage.detectedDeadline,
        handledAt: emailMessage.handledAt,
        webLink: emailMessage.webLink,
      })
      .from(emailMessage)
      .where(filterCond)
      .orderBy(emailMessage.rankScore, desc(emailMessage.receivedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const total =
      filter === 'action_required'
        ? counts.actionRequired
        : filter === 'follow_up'
          ? counts.followUp
          : filter === 'handled'
            ? counts.handled
            : counts.all;

    return { rows, total, counts };
  });
}

export async function markEmailHandled(input: { emailId: string }) {
  const tenant = await requireTenant();
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const [updated] = await tx
      .update(emailMessage)
      .set({ handledAt: new Date(), handledBy: tenant.userId })
      .where(
        and(
          eq(emailMessage.id, input.emailId),
          eq(emailMessage.accountId, tenant.accountId),
        ),
      )
      .returning();

    if (!updated) throw new Error('Email not found');

    revalidatePath('/productivity/email');
    revalidatePath('/dashboard');
    return updated;
  });
}

export async function reopenEmail(input: { emailId: string }) {
  const tenant = await requireTenant();
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const [updated] = await tx
      .update(emailMessage)
      .set({ handledAt: null, handledBy: null })
      .where(
        and(
          eq(emailMessage.id, input.emailId),
          eq(emailMessage.accountId, tenant.accountId),
        ),
      )
      .returning();

    if (!updated) throw new Error('Email not found');

    revalidatePath('/productivity/email');
    revalidatePath('/dashboard');
    return updated;
  });
}

export interface EmailMetrics {
  total: number;
  unread: number;
  actionRequired: number;
  followUp: number;
  handled: number;
}

export async function getEmailMetrics(): Promise<EmailMetrics> {
  const tenant = await requireTenant();
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const acctCond = eq(emailMessage.accountId, tenant.accountId);

    const [metrics] = await tx
      .select({
        total: sql<number>`count(*) filter (where ${acctCond})`.mapWith(Number),
        unread:
          sql<number>`count(*) filter (where ${acctCond} and ${eq(emailMessage.isRead, false)})`.mapWith(Number),
        actionRequired:
          sql<number>`count(*) filter (where ${acctCond} and ${eq(emailMessage.signal, 'action_required')})`.mapWith(Number),
        followUp:
          sql<number>`count(*) filter (where ${acctCond} and ${eq(emailMessage.signal, 'follow_up')})`.mapWith(Number),
        handled:
          sql<number>`count(*) filter (where ${acctCond} and ${isNotNull(emailMessage.handledAt)})`.mapWith(Number),
      })
      .from(emailMessage);

    return metrics;
  });
}
