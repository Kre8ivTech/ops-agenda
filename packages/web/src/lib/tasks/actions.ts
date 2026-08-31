'use server';

import { revalidatePath } from 'next/cache';
import { and, asc, desc, eq, ilike, inArray, isNotNull, isNull, lte, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { buildAuditEvent } from '@/lib/audit';
import { getSession } from '@/lib/auth';
import {
  auditEvent,
  emailExtraction,
  emailThread,
  task,
  user,
  type TaskSelect,
} from '@/lib/db/schema';
import { createDb, withTenant } from '@/lib/db';
import { env } from '@/lib/env';
import { classifyAndUpdateTask } from '@/lib/ai/classify';
import { sendTransactionalEmail } from '@/lib/email/sendgrid';
import { buildAssignmentEmail } from '@/lib/tasks/assignment-email';
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
  sourceConnectionId: z.string().uuid().optional(),
  sourceExternalId: z.string().max(255).optional(),
});

const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().uuid(),
});

const deleteTaskSchema = z.object({
  id: z.string().uuid(),
});

const assignTaskSchema = z.object({
  id: z.string().uuid(),
  /** Null / empty clears the assignee. */
  ownerUserId: z.string().uuid().nullable(),
});

const taskIdSchema = z.object({
  id: z.string().uuid(),
});

export interface AssignableUser {
  id: string;
  name: string | null;
  email: string;
}

export interface AssignTaskResult {
  task: TaskSelect;
  emailSent: boolean;
  emailSkippedReason?:
    'cleared' | 'unchanged' | 'no_email' | 'not_configured' | 'missing_from' | 'send_failed';
}

function appOrigin(): string {
  return env.APP_URL ?? env.NEXT_PUBLIC_APP_URL;
}

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
  revalidatePath('/productivity/email');
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
        sourceConnectionId: data.sourceConnectionId,
        sourceExternalId: data.sourceExternalId,
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

export async function startTask(input: z.infer<typeof taskIdSchema>) {
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
        status: 'in_progress',
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
          action: 'task.start',
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
        status: 'done',
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
        status: 'open',
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

/** Approve all mail-extracted tasks still sitting in inbox (status open). */
export async function approveExtractedTasks() {
  const tenant = await requireTenantSession();
  await authorize(tenant, {});
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const pending = await tx
      .select()
      .from(task)
      .where(
        and(
          isNull(task.deletedAt),
          isNull(task.handledAt),
          isNotNull(task.sourceConnectionId),
          eq(task.status, 'open'),
        ),
      );

    for (const row of pending) {
      await tx
        .update(task)
        .set({
          status: 'in_progress',
          updatedAt: new Date(),
        })
        .where(eq(task.id, row.id));

      await tx.insert(auditEvent).values(
        buildAuditEvent(
          { accountId: tenant.accountId, userId: tenant.userId },
          {
            action: 'task.approve_extracted',
            targetType: 'task',
            targetId: row.id,
            before: row,
            after: { ...row, status: 'in_progress' },
          },
        ),
      );
    }

    revalidateTaskSurfaces();
    return { approved: pending.length };
  });
}

/** Soft-delete mail-extracted inbox tasks the user does not want on the board. */
export async function dismissExtractedTasks() {
  const tenant = await requireTenantSession();
  await authorize(tenant, {});
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const pending = await tx
      .select()
      .from(task)
      .where(
        and(
          isNull(task.deletedAt),
          isNull(task.handledAt),
          isNotNull(task.sourceConnectionId),
          eq(task.status, 'open'),
        ),
      );

    const now = new Date();
    for (const row of pending) {
      await tx.update(task).set({ deletedAt: now, updatedAt: now }).where(eq(task.id, row.id));

      await tx.insert(auditEvent).values(
        buildAuditEvent(
          { accountId: tenant.accountId, userId: tenant.userId },
          {
            action: 'task.dismiss_extracted',
            targetType: 'task',
            targetId: row.id,
            before: row,
          },
        ),
      );
    }

    revalidateTaskSurfaces();
    return { dismissed: pending.length };
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

/** Match an assignee email to an active account user (case-insensitive). */
export async function resolveAssignableUserByEmail(
  email: string,
): Promise<AssignableUser | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const users = await listAssignableUsers();
  return users.find((u) => u.email.toLowerCase() === normalized) ?? null;
}

/** Active users in the current tenant — for the assignee picker. */
export async function listAssignableUsers(): Promise<AssignableUser[]> {
  const tenant = await requireTenantSession();
  await authorize(tenant, {});
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const rows = await tx
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
      })
      .from(user)
      .where(and(eq(user.accountId, tenant.accountId), eq(user.status, 'active')))
      .orderBy(asc(user.name), asc(user.email));

    return rows;
  });
}

/**
 * Assign (or clear) a task owner. On a new assignee, attempt a SendGrid
 * notification — assignment always persists even if email fails.
 */
export async function assignTask(
  input: z.input<typeof assignTaskSchema>,
): Promise<AssignTaskResult> {
  const tenant = await requireTenantSession();
  await authorize(tenant, input);
  const data = assignTaskSchema.parse(input);
  const db = getDb();

  const session = await getSession();
  const assignerName = session?.name?.trim() || session?.email || 'A teammate';

  const result = await withTenant(db, tenant, async (tx) => {
    const [existing] = await tx.select().from(task).where(eq(task.id, data.id));
    if (!existing) throw new Error('Task not found');

    let assignee: AssignableUser | null = null;
    if (data.ownerUserId) {
      const [found] = await tx
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
        })
        .from(user)
        .where(
          and(
            eq(user.id, data.ownerUserId),
            eq(user.accountId, tenant.accountId),
            eq(user.status, 'active'),
          ),
        );
      if (!found) throw new Error('Assignee not found in this account');
      assignee = found;
    }

    const [updated] = await tx
      .update(task)
      .set({
        ownerUserId: data.ownerUserId,
        updatedAt: new Date(),
      })
      .where(eq(task.id, data.id))
      .returning();

    await tx.insert(auditEvent).values(
      buildAuditEvent(
        { accountId: tenant.accountId, userId: tenant.userId },
        {
          action: 'task.assign',
          targetType: 'task',
          targetId: updated.id,
          before: { ownerUserId: existing.ownerUserId },
          after: { ownerUserId: updated.ownerUserId },
        },
      ),
    );

    return { existing, updated, assignee };
  });

  revalidateTaskSurfaces();

  if (!result.assignee) {
    return { task: result.updated, emailSent: false, emailSkippedReason: 'cleared' };
  }

  if (result.existing.ownerUserId === result.assignee.id) {
    return { task: result.updated, emailSent: false, emailSkippedReason: 'unchanged' };
  }

  if (!result.assignee.email?.trim()) {
    return { task: result.updated, emailSent: false, emailSkippedReason: 'no_email' };
  }

  const content = buildAssignmentEmail({
    taskTitle: result.updated.title,
    dueOn: result.updated.dueOn,
    assignerName,
    tasksUrl: `${appOrigin()}/productivity/tasks`,
  });

  const mail = await sendTransactionalEmail({
    to: result.assignee.email,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });

  if (mail.ok) {
    return { task: result.updated, emailSent: true };
  }

  return {
    task: result.updated,
    emailSent: false,
    emailSkippedReason: mail.reason,
  };
}

const extractionIdSchema = z.object({
  extractionId: z.string().uuid(),
});

/**
 * Promote a pending email extraction into a task so it appears on the Tasks board.
 * Links sourceConnectionId / sourceExternalId for "From mail" badges.
 */
export async function acceptEmailExtraction(input: z.infer<typeof extractionIdSchema>) {
  const tenant = await requireTenantSession();
  await authorize(tenant, input);
  const { extractionId } = extractionIdSchema.parse(input);
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const [extraction] = await tx
      .select()
      .from(emailExtraction)
      .where(eq(emailExtraction.id, extractionId));

    if (!extraction) throw new Error('Extraction not found');
    if (extraction.status === 'accepted' && extraction.linkedTaskId) {
      const [existingTask] = await tx
        .select()
        .from(task)
        .where(eq(task.id, extraction.linkedTaskId));
      return existingTask;
    }
    if (extraction.status === 'dismissed') {
      throw new Error('Extraction was dismissed');
    }

    const [thread] = await tx
      .select()
      .from(emailThread)
      .where(eq(emailThread.id, extraction.threadId));

    const [created] = await tx
      .insert(task)
      .values({
        accountId: tenant.accountId,
        title: extraction.title,
        description: extraction.reasoning ?? undefined,
        priority: extraction.kind === 'due_out' ? 'p2' : 'p3',
        dueOn: extraction.deadline ?? undefined,
        status: 'open',
        flagState: 'none',
        sourceConnectionId: thread?.connectionId ?? undefined,
        sourceExternalId: extraction.id,
      })
      .returning();

    await tx
      .update(emailExtraction)
      .set({
        status: 'accepted',
        linkedTaskId: created.id,
      })
      .where(eq(emailExtraction.id, extractionId));

    await tx.insert(auditEvent).values(
      buildAuditEvent(
        { accountId: tenant.accountId, userId: tenant.userId },
        {
          action: 'task.create_from_extraction',
          targetType: 'task',
          targetId: created.id,
          after: {
            extractionId,
            threadId: extraction.threadId,
            title: created.title,
          },
        },
      ),
    );

    revalidateTaskSurfaces();
    return created;
  });
}

export async function dismissEmailExtraction(input: z.infer<typeof extractionIdSchema>) {
  const tenant = await requireTenantSession();
  await authorize(tenant, input);
  const { extractionId } = extractionIdSchema.parse(input);
  const db = getDb();

  return withTenant(db, tenant, async (tx) => {
    const [extraction] = await tx
      .select()
      .from(emailExtraction)
      .where(eq(emailExtraction.id, extractionId));

    if (!extraction) throw new Error('Extraction not found');

    const [updated] = await tx
      .update(emailExtraction)
      .set({ status: 'dismissed' })
      .where(eq(emailExtraction.id, extractionId))
      .returning();

    await tx.insert(auditEvent).values(
      buildAuditEvent(
        { accountId: tenant.accountId, userId: tenant.userId },
        {
          action: 'email_extraction.dismiss',
          targetType: 'email_extraction',
          targetId: extractionId,
          before: extraction,
          after: updated,
        },
      ),
    );

    revalidateTaskSurfaces();
    return updated;
  });
}

export async function refreshDashboard() {
  revalidatePath('/dashboard');
}
