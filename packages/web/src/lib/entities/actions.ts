'use server';

import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';

import { buildAuditEvent } from '@/lib/audit';
import { getSession } from '@/lib/auth';
import { createDb, withTenant } from '@/lib/db';
import { auditEvent, connection, entity } from '@/lib/db/schema';
import { ENTITY_SELECTION_COOKIE } from '@/lib/entities/queries';
import { env } from '@/lib/env';

const companyKindSchema = z.enum(['llc', 'corp', 'sole_prop', 'nonprofit']);
const createCompanySchema = z.object({
  name: z.string().trim().min(1).max(255),
  kind: companyKindSchema,
});
const assignmentSchema = z.object({
  connectionId: z.string().uuid(),
  entityId: z.string().uuid(),
});
const selectionSchema = z.union([z.literal('all'), z.string().uuid()]);

async function requireTenant() {
  const session = await getSession();
  if (!session?.accountId || !session?.userId) {
    throw new Error('You must be signed in with a workspace');
  }
  return { accountId: session.accountId, userId: session.userId };
}

export async function createCompany(input: z.input<typeof createCompanySchema>) {
  const tenant = await requireTenant();
  const data = createCompanySchema.parse(input);
  const db = createDb(env.DATABASE_URL);

  const created = await withTenant(db, tenant, async (tx) => {
    const [newEntity] = await tx
      .insert(entity)
      .values({
        accountId: tenant.accountId,
        createdBy: tenant.userId,
        name: data.name,
        kind: data.kind,
      })
      .returning({ id: entity.id, name: entity.name, kind: entity.kind });

    await tx.insert(auditEvent).values(
      buildAuditEvent(tenant, {
        action: 'entity.create',
        targetType: 'entity',
        targetId: newEntity.id,
        after: { name: newEntity.name, kind: newEntity.kind },
      }),
    );

    return newEntity;
  });

  revalidatePath('/settings/connections');
  return created;
}

export async function assignConnectionEntity(input: z.input<typeof assignmentSchema>) {
  const tenant = await requireTenant();
  const data = assignmentSchema.parse(input);
  const db = createDb(env.DATABASE_URL);

  await withTenant(db, tenant, async (tx) => {
    const [targetConnection] = await tx
      .select({
        id: connection.id,
        provider: connection.provider,
        externalAccountRef: connection.externalAccountRef,
        previousEntityId: connection.entityId,
      })
      .from(connection)
      .where(
        and(
          eq(connection.id, data.connectionId),
          eq(connection.accountId, tenant.accountId),
          isNull(connection.deletedAt),
        ),
      );
    if (!targetConnection) throw new Error('Connection not found');

    const [targetEntity] = await tx
      .select({ id: entity.id })
      .from(entity)
      .where(
        and(
          eq(entity.id, data.entityId),
          eq(entity.accountId, tenant.accountId),
          isNull(entity.deletedAt),
        ),
      );
    if (!targetEntity) throw new Error('Entity not found');

    const siblingFilter = targetConnection.externalAccountRef
      ? and(
          eq(connection.accountId, tenant.accountId),
          eq(connection.provider, targetConnection.provider),
          eq(connection.externalAccountRef, targetConnection.externalAccountRef),
          isNull(connection.deletedAt),
        )
      : and(
          eq(connection.id, targetConnection.id),
          eq(connection.accountId, tenant.accountId),
          isNull(connection.deletedAt),
        );

    const updated = await tx
      .update(connection)
      .set({
        entityId: targetEntity.id,
        updatedBy: tenant.userId,
        updatedAt: new Date(),
      })
      .where(siblingFilter)
      .returning({ id: connection.id });

    await tx.insert(auditEvent).values(
      buildAuditEvent(tenant, {
        action: 'connection.entity.assign',
        targetType: 'connection',
        targetId: targetConnection.id,
        before: { entityId: targetConnection.previousEntityId },
        after: { entityId: targetEntity.id, linkedConnections: updated.length },
      }),
    );
  });

  revalidatePath('/settings/connections');
  revalidatePath('/productivity/email');
}

export async function setSelectedEntity(input: string) {
  const tenant = await requireTenant();
  const selected = selectionSchema.parse(input);

  if (selected !== 'all') {
    const db = createDb(env.DATABASE_URL);
    const [allowed] = await withTenant(db, tenant, async (tx) =>
      tx
        .select({ id: entity.id })
        .from(entity)
        .where(
          and(
            eq(entity.id, selected),
            eq(entity.accountId, tenant.accountId),
            isNull(entity.deletedAt),
          ),
        ),
    );
    if (!allowed) throw new Error('Entity not found');
  }

  const cookieStore = await cookies();
  cookieStore.set(ENTITY_SELECTION_COOKIE, selected, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath('/', 'layout');
}
