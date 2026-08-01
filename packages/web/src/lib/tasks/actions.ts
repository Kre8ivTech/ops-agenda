'use server';

import { revalidatePath } from 'next/cache';
import { and, asc, desc, eq, ilike, inArray, isNotNull, isNull, lte, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { buildAuditEvent } from '@/lib/audit';
import { getSession } from '@/lib/auth';
import { auditEvent, task, type TaskSelect } from '@/lib/db/schema';
import { createDb, withTenant } from '@/lib/db';
import { env } from '@/lib/env';
import { classifyAndUpdateTask } from '@/lib/ai/classify';
import type { SortDirection, TaskFilter, TaskSort } from '@/lib/tasks/filters';

const tenantSchema = z.object({
  accountId: z.string().uuid(),
  userId: z.string().uuid(),
});

const flagStateSchema = z.enum(['none', 'attention', 'at_risk', 'settled']);

const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  entityId: z.string().uuid().optional(),
  priority: z.enum(['p1', 'p2', 'p3', 'fysa']).default('p3'),
  dueOn: z.coerce.date().optional(),
  flagState: flagStateSchema.optional(),
  flagReasonCode: z.string().max(100).optional(),
  flagReasonText: z.string().max(2000).optional(),
});

const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().uuid(),
});

const deleteTaskSchema = z.object({
  id: z.string().uuid(),
});

const taskIdSchema = z.object({
  id: z.string().uuid(),
});

const PRIORITY_RANK: Record<string, number> = { p1: 0, p2: 1, p3: 2, fysa: 3 };

async function authorize(tenant: { accountId: string; userId: string }, _payload: unknown) {
  // Phase 1: module entitlement and entity grant checks would go here.
  // For the spine proof-of-concept we trust the server-side tenant context.
  tenantSchema.parse(tenant);
  return true;
}

function getDb() {
  return createDb(env.DATABASE_URL);
}

async function requireTenantSession() {
  const session = await getSession();
  if (!session?.accountId || !session.userId) {
    throw new Error('Your session is not linked to a tenant account');
  }
  return tenantSchema.parse({
    accountId: session.accountId,
    userId: session.userId,
  });
}

function revalidateTaskSurfaces() {
  revalidatePath('/productivity/tasks');
  revalidatePath('/dashboard');
}

function sortForDashboard(a: TaskSelect, b: TaskSelect): number {
  const aHandled = a.handledAt ? 1 : 0;
  const bHandled = b.handledAt ? 1 : 0;
  if (aHandled !== bHandled) return aHandled - bHandled;

  const pr = (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
  if (pr !== 0) return pr;

  const aDue = a.dueOn?.getTime() ?? Number.POSITIVE_INFINITY;
  const bDue = b.dueOn?.getTime() ?? Number.POSITIVE_INFINITY;
  if (aDue !== bDue) return aDue - bDue;

  return a.createdAt.getTime() - b.createdAt.getTime();
}

export async function listTasks(tenant: { accountId: string; userId: string }) {
  await authorize(tenant, {});
  const db = getDb();
  return withTenant(db, tenant, async (tx) => {
    return tx.query.task.findMany({
      where: (row) => isNull(row.deletedAt),
      orderBy: (row) => [row.createdAt],
    });
  });
}

/** Unhandled first, then priority, then due date — for the dashboard brief. */
export async function listDashboardTasks(tenant: { accountId: string; userId: string }) {
  await authorize(tenant, {});
  const db = getDb();
  const rows = await withTenant(db, tenant, async (tx) => {
    return tx.query.task.findMany({
      where: (row) => isNull(row.deletedAt),
    });
  });
  return [...rows].sort(sortForDashboard);
}

export interface TaskQuery {
  filter?: TaskFilter;
  search?: string;
  sort?: TaskSort;
  direction?: SortDirection;
  page?: number;
  pageSize?: number;
}

export interface TaskQueryResult {
  rows: TaskSelect[];
  total: number;
  counts: { all: number; needsAttention: number; settled: number };
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function orderByFor(sort: TaskSort, direction: SortDirection) {
  const dir = direction === 'desc' ? desc : asc;
  switch (sort) {
    case 'title':
      return dir(task.title);
    case 'due_on':
      return dir(task.dueOn);
    case 'created_at':
      return dir(task.createdAt);
    case 'priority':
    default:
      return dir(
        sql`case ${task.priority} when 'p1' then 0 when 'p2' then 1 when 'p3' then 2 else 3 end`,
      );
  }
}

/**
 * Server-side filter/search/sort/pagination for the Tasks record table
 * (`08-portal-requirements.md` ST-03/ST-04). Chip counts come from a single
 * aggregate query rather than one query per chip.
 */
export async function queryTasks(
  tenant: { accountId: string; userId: string },
  query: TaskQuery = {},
): Promise<TaskQueryResult> {
  await authorize(tenant, query);
  const db = getDb();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE));
  const search = query.search?.trim();

  return withTenant(db, tenant, async (tx) => {
    const notDeleted = isNull(task.deletedAt);
    const scoped = search ? and(notDeleted, ilike(task.title, `%${search}%`)) : notDeleted;

    const needsAttentionCond = and(
      isNull(task.handledAt),
      or(
        inArray(task.flagState, ['attention', 'at_risk']),
        and(isNotNull(task.dueOn), lte(task.dueOn, new Date())),
      ),
    );
    const settledCond = or(isNotNull(task.handledAt), eq(task.flagState, 'settled'));

    const [counts] = await tx
      .select({
        all: sql<number>`count(*) filter (where ${scoped})`.mapWith(Number),
        needsAttention:
          sql<number>`count(*) filter (where ${scoped} and ${needsAttentionCond})`.mapWith(Number),
        settled: sql<number>`count(*) filter (where ${scoped} and ${settledCond})`.mapWith(Number),
      })
      .from(task);

    const filter = query.filter ?? 'all';
    const whereCond =
      filter === 'needs_attention'
        ? and(scoped, needsAttentionCond)
        : filter === 'settled'
          ? and(scoped, settledCond)
          : scoped;

    const rows = await tx
      .select()
      .from(task)
      .where(whereCond)
      .orderBy(orderByFor(query.sort ?? 'priority', query.direction ?? 'asc'))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const total =
      filter === 'needs_attention'
        ? counts.needsAttention
        : filter === 'settled'
          ? counts.settled
          : counts.all;

    return { rows, total, counts, page, pageSize };
  });
}

export async function createTask(input: z.input<typeof createTaskSchema>) {
  const tenant = await requireTenantSession();
  await authorize(tenant, input);
  const data = createTaskSchema.parse(input);
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const [created] = await tx
      .insert(task)
      .values({
        accountId: tenant.accountId,
        title: data.title,
        description: data.description,
        entityId: data.entityId,
        priority: data.priority,
        dueOn: data.dueOn,
        flagState: data.flagState ?? 'none',
        flagReasonCode: data.flagReasonCode,
        flagReasonText: data.flagReasonText,
      })
      .returning();

    await tx.insert(auditEvent).values(
      buildAuditEvent(
        { accountId: tenant.accountId, userId: tenant.userId },
        {
          action: 'task.create',
          targetType: 'task',
          targetId: created.id,
          after: { ...data, accountId: tenant.accountId },
        },
      ),
    );

    // Non-blocking AI classification — fire-and-forget so task creation is instant.
    // Only triggers if priority is the default (p3), meaning user didn't explicitly set it.
    if (created.priority === 'p3') {
      classifyAndUpdateTask(tenant, created.id).catch(() => {
        // Swallow — AI classification must never break task creation
      });
    }

    revalidateTaskSurfaces();
    return created;
  });
}

export async function updateTask(input: z.input<typeof updateTaskSchema>) {
  const tenant = await requireTenantSession();
  await authorize(tenant, input);
  const data = updateTaskSchema.parse(input);
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const [existing] = await tx.select().from(task).where(eq(task.id, data.id));
    if (!existing) throw new Error('Task not found');

    const [updated] = await tx
      .update(task)
      .set({
        title: data.title,
        description: data.description,
        entityId: data.entityId,
        priority: data.priority,
        dueOn: data.dueOn,
        flagState: data.flagState,
        flagReasonCode: data.flagReasonCode,
        flagReasonText: data.flagReasonText,
        updatedAt: new Date(),
      })
      .where(eq(task.id, data.id))
      .returning();

    await tx.insert(auditEvent).values(
      buildAuditEvent(
        { accountId: tenant.accountId, userId: tenant.userId },
        {
          action: 'task.update',
          targetType: 'task',
          targetId: updated.id,
          before: existing,
          after: updated,
        },
      ),
    );

    revalidateTaskSurfaces();
    return updated;
  });
}

export async function markTaskHandled(input: z.infer<typeof taskIdSchema>) {
  const tenant = await requireTenantSession();
  await authorize(tenant, input);
  const { id } = taskIdSchema.parse(input);
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const [existing] = await tx.select().from(task).where(eq(task.id, id));
    if (!existing) throw new Error('Task not found');

    const [updated] = await tx
      .update(task)
      .set({
        handledAt: new Date(),
        handledBy: tenant.userId,
        flagState: 'settled',
        updatedAt: new Date(),
      })
      .where(eq(task.id, id))
      .returning();

    await tx.insert(auditEvent).values(
      buildAuditEvent(
        { accountId: tenant.accountId, userId: tenant.userId },
        {
          action: 'task.mark_handled',
          targetType: 'task',
          targetId: updated.id,
          before: existing,
          after: updated,
        },
      ),
    );

    revalidateTaskSurfaces();
    return updated;
  });
}

export async function reopenTask(input: z.infer<typeof taskIdSchema>) {
  const tenant = await requireTenantSession();
  await authorize(tenant, input);
  const { id } = taskIdSchema.parse(input);
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const [existing] = await tx.select().from(task).where(eq(task.id, id));
    if (!existing) throw new Error('Task not found');

    const [updated] = await tx
      .update(task)
      .set({
        handledAt: null,
        handledBy: null,
        flagState: existing.flagState === 'settled' ? 'attention' : existing.flagState,
        updatedAt: new Date(),
      })
      .where(eq(task.id, id))
      .returning();

    await tx.insert(auditEvent).values(
      buildAuditEvent(
        { accountId: tenant.accountId, userId: tenant.userId },
        {
          action: 'task.reopen',
          targetType: 'task',
          targetId: updated.id,
          before: existing,
          after: updated,
        },
      ),
    );

    revalidateTaskSurfaces();
    return updated;
  });
}

export async function deleteTask(input: z.infer<typeof deleteTaskSchema>) {
  const tenant = await requireTenantSession();
  await authorize(tenant, input);
  const { id } = deleteTaskSchema.parse(input);
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const [existing] = await tx.select().from(task).where(eq(task.id, id));
    if (!existing) throw new Error('Task not found');

    const [deleted] = await tx
      .update(task)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(task.id, id))
      .returning();

    await tx.insert(auditEvent).values(
      buildAuditEvent(
        { accountId: tenant.accountId, userId: tenant.userId },
        {
          action: 'task.delete',
          targetType: 'task',
          targetId: deleted.id,
          before: existing,
        },
      ),
    );

    revalidateTaskSurfaces();
    return deleted;
  });
}

export async function refreshDashboard() {
  revalidatePath('/dashboard');
}
