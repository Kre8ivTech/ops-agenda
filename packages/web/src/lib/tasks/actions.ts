'use server';

import { revalidatePath } from 'next/cache';
import { eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { buildAuditEvent } from '@/lib/audit';
import { auditEvent, task } from '@/lib/db/schema';
import { createDb, withTenant } from '@/lib/db';
import { env } from '@/lib/env';

const db = createDb(env.DATABASE_URL ?? '');

const tenantSchema = z.object({
  accountId: z.string().uuid(),
  userId: z.string().uuid(),
});

const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  entityId: z.string().uuid().optional(),
  priority: z.enum(['p1', 'p2', 'p3', 'fysa']).default('p3'),
  dueOn: z.coerce.date().optional(),
});

const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().uuid(),
});

const deleteTaskSchema = z.object({
  id: z.string().uuid(),
});

async function authorize(tenant: { accountId: string; userId: string }, _payload: unknown) {
  // Phase 1: module entitlement and entity grant checks would go here.
  // For the spine proof-of-concept we trust the session-provided tenant context.
  tenantSchema.parse(tenant);
  return true;
}

export async function listTasks(tenant: { accountId: string; userId: string }) {
  await authorize(tenant, {});
  return withTenant(db, tenant, async (tx) => {
    return tx.query.task.findMany({
      where: (task) => isNull(task.deletedAt),
      orderBy: (task) => [task.createdAt],
    });
  });
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

    revalidatePath('/productivity/tasks');
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

    revalidatePath('/productivity/tasks');
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

    revalidatePath('/productivity/tasks');
    return deleted;
  });
}
