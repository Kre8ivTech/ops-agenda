'use server';

import { revalidatePath } from 'next/cache';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { createDb, withTenant } from '@/lib/db';
import { contact } from '@/lib/db/schema';
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

export interface ContactRow {
  id: string;
  name: string;
  organisation: string | null;
  email: string | null;
  lastTouchAt: Date | null;
  openThreads: string | null;
  openThreadContext: string | null;
  state: string;
  isKeyRelationship: boolean;
}

export interface ContactMetrics {
  total: number;
  awaitingReply: number;
  goneQuiet: number;
  keyRelationships: number;
}

export type ContactFilter = 'all' | 'needs_attention' | 'settled';

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function listContacts(options?: {
  filter?: ContactFilter;
  search?: string;
}): Promise<{
  rows: ContactRow[];
  counts: { all: number; needsAttention: number; settled: number };
}> {
  const tenant = await requireTenant();
  const db = getDb();
  const filter = options?.filter ?? 'all';
  const search = options?.search?.trim();

  return withTenant(db, tenant, async (tx) => {
    const baseCond = search
      ? and(
          eq(contact.accountId, tenant.accountId),
          or(
            sql`${contact.name} ILIKE ${'%' + search + '%'}`,
            sql`${contact.organisation} ILIKE ${'%' + search + '%'}`,
            sql`${contact.email} ILIKE ${'%' + search + '%'}`,
          ),
        )
      : eq(contact.accountId, tenant.accountId);

    const needsAttentionCond = or(
      eq(contact.state, 'awaiting_you'),
      eq(contact.state, 'gone_quiet'),
    );

    const settledCond = or(
      eq(contact.state, 'current'),
      eq(contact.state, 'archived'),
    );

    // Aggregate counts in a single query
    const [counts] = await tx
      .select({
        all: sql<number>`count(*) filter (where ${baseCond})`.mapWith(Number),
        needsAttention:
          sql<number>`count(*) filter (where ${baseCond} and (${needsAttentionCond}))`.mapWith(
            Number,
          ),
        settled:
          sql<number>`count(*) filter (where ${baseCond} and (${settledCond}))`.mapWith(Number),
      })
      .from(contact);

    // Determine filter condition for the rows query
    const filterCond =
      filter === 'needs_attention'
        ? and(baseCond, needsAttentionCond)
        : filter === 'settled'
          ? and(baseCond, settledCond)
          : baseCond;

    const rows = await tx
      .select({
        id: contact.id,
        name: contact.name,
        organisation: contact.organisation,
        email: contact.email,
        lastTouchAt: contact.lastTouchAt,
        openThreads: contact.openThreads,
        openThreadContext: contact.openThreadContext,
        state: contact.state,
        isKeyRelationship: contact.isKeyRelationship,
      })
      .from(contact)
      .where(filterCond)
      .orderBy(desc(sql`${contact.lastTouchAt} NULLS LAST`));

    return { rows, counts };
  });
}

export async function getContactMetrics(): Promise<ContactMetrics> {
  const tenant = await requireTenant();
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const acctCond = eq(contact.accountId, tenant.accountId);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [metrics] = await tx
      .select({
        total: sql<number>`count(*) filter (where ${acctCond})`.mapWith(Number),
        awaitingReply:
          sql<number>`count(*) filter (where ${acctCond} and ${eq(contact.state, 'awaiting_you')})`.mapWith(
            Number,
          ),
        goneQuiet:
          sql<number>`count(*) filter (where ${acctCond} and ${contact.lastTouchAt} < ${sixtyDaysAgo})`.mapWith(
            Number,
          ),
        keyRelationships:
          sql<number>`count(*) filter (where ${acctCond} and ${eq(contact.isKeyRelationship, true)})`.mapWith(
            Number,
          ),
      })
      .from(contact);

    return metrics;
  });
}

const addContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  organisation: z.string().max(255).optional(),
  email: z.string().email().max(320).optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  isKeyRelationship: z.boolean().optional().default(false),
  notes: z.string().optional(),
});

export async function addContact(input: {
  name: string;
  organisation?: string;
  email?: string;
  phone?: string;
  isKeyRelationship?: boolean;
  notes?: string;
}): Promise<void> {
  const tenant = await requireTenant();
  const db = getDb();

  const parsed = addContactSchema.parse(input);

  await withTenant(db, tenant, async (tx) => {
    await tx.insert(contact).values({
      accountId: tenant.accountId,
      name: parsed.name,
      organisation: parsed.organisation || null,
      email: parsed.email || null,
      phone: parsed.phone || null,
      isKeyRelationship: parsed.isKeyRelationship,
      notes: parsed.notes || null,
      state: 'current',
      createdBy: tenant.userId,
      updatedBy: tenant.userId,
    });
  });

  revalidatePath('/productivity/contacts');
}
