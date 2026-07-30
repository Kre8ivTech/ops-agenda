'use server';

import { revalidatePath } from 'next/cache';
import { eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { buildAuditEvent } from '@/lib/audit';
import { auditEvent, task, type TaskSelect } from '@/lib/db/schema';
import { createDb, withTenant } from '@/lib/db';
import { env } from '@/lib/env';

const db = createDb(env.DATABASE_URL ?? '');

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
  // For the spine proof-of-concept we trust the session-provided tenant context.
  tenantSchema.parse(tenant);
  return true;
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
  const rows = await withTenant(db, tenant, async (tx) => {
    return tx.query.task.findMany({
      where: (row) => isNull(row.deletedAt),
    });
  });
  return [...rows].sort(sortForDashboard);
}

export async function createTask(
  tenant: { accountId: string; userId: string },
  input: z.input<typeof createTaskSchema>,
) {
  await authorize(tenant, input);
  const data = createTaskSchema.parse(input);

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

    revalidateTaskSurfaces();
    return created;
  });
}

export async function updateTask(
  tenant: { accountId: string; userId: string },
  input: z.input<typeof updateTaskSchema>,
) {
  await authorize(tenant, input);
  const data = updateTaskSchema.parse(input);

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

export async function markTaskHandled(
  tenant: { accountId: string; userId: string },
  input: z.infer<typeof taskIdSchema>,
) {
  await authorize(tenant, input);
  const { id } = taskIdSchema.parse(input);

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

export async function reopenTask(
  tenant: { accountId: string; userId: string },
  input: z.infer<typeof taskIdSchema>,
) {
  await authorize(tenant, input);
  const { id } = taskIdSchema.parse(input);

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

export async function deleteTask(
  tenant: { accountId: string; userId: string },
  input: z.infer<typeof deleteTaskSchema>,
) {
  await authorize(tenant, input);
  const { id } = deleteTaskSchema.parse(input);

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
