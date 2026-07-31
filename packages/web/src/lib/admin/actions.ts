'use server';

import { revalidatePath } from 'next/cache';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { buildAuditEvent } from '@/lib/audit';
import { requirePlatformAdmin } from '@/lib/auth/platform-admin';
import { createDb, withPlatformAdmin, withTenant } from '@/lib/db';
import { account, auditEvent, moduleState, platformAdmin, user } from '@/lib/db/schema';
import { env } from '@/lib/env';

function getDb() {
  return createDb(env.DATABASE_URL);
}

export interface AdminAccountRow {
  id: string;
  name: string;
  plan: string;
  status: string;
  createdAt: Date;
  userCount: number;
}

/** All tenant accounts, for the /admin/accounts overview. */
export async function listAllAccounts(): Promise<AdminAccountRow[]> {
  const admin = await requirePlatformAdmin();
  const db = getDb();

  return withPlatformAdmin(db, admin.cognitoSub, async (tx) => {
    const accounts = await tx.select().from(account).orderBy(desc(account.createdAt));
    const users = await tx.select({ accountId: user.accountId }).from(user);
    const countsByAccount = new Map<string, number>();
    for (const row of users) {
      countsByAccount.set(row.accountId, (countsByAccount.get(row.accountId) ?? 0) + 1);
    }
    return accounts.map((row) => ({
      id: row.id,
      name: row.name,
      plan: row.plan,
      status: row.status,
      createdAt: row.createdAt,
      userCount: countsByAccount.get(row.id) ?? 0,
    }));
  });
}

export interface AdminUserRow {
  id: string;
  accountId: string;
  accountName: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  lastSeenAt: Date | null;
}

/** All users across every account, for the /admin/users overview. */
export async function listAllUsers(): Promise<AdminUserRow[]> {
  const admin = await requirePlatformAdmin();
  const db = getDb();

  return withPlatformAdmin(db, admin.cognitoSub, async (tx) => {
    const rows = await tx
      .select({
        id: user.id,
        accountId: user.accountId,
        accountName: account.name,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        lastSeenAt: user.lastSeenAt,
      })
      .from(user)
      .innerJoin(account, eq(account.id, user.accountId))
      .orderBy(desc(user.createdAt));
    return rows;
  });
}

export interface AdminModuleRow {
  accountId: string;
  accountName: string;
  module: string;
  enabled: boolean;
}

/** Module enablement across every account, for the /admin/modules screen. */
export async function listAllModuleStates(): Promise<AdminModuleRow[]> {
  const admin = await requirePlatformAdmin();
  const db = getDb();

  return withPlatformAdmin(db, admin.cognitoSub, async (tx) => {
    const rows = await tx
      .select({
        accountId: moduleState.accountId,
        accountName: account.name,
        module: moduleState.module,
        enabled: moduleState.enabled,
      })
      .from(moduleState)
      .innerJoin(account, eq(account.id, moduleState.accountId))
      .orderBy(account.name);
    return rows;
  });
}

export interface AdminAuditRow {
  id: string;
  accountId: string;
  accountName: string;
  action: string;
  targetType: string;
  targetId: string;
  at: Date;
  actorUserId: string | null;
  actorPlatformAdminId: string | null;
}

/** Most recent audit events across every account, for the /admin/audit screen. */
export async function listRecentAuditEvents(limit = 100): Promise<AdminAuditRow[]> {
  const admin = await requirePlatformAdmin();
  const db = getDb();
  const cappedLimit = Math.min(500, Math.max(1, limit));

  return withPlatformAdmin(db, admin.cognitoSub, async (tx) => {
    const rows = await tx
      .select({
        id: auditEvent.id,
        accountId: auditEvent.accountId,
        accountName: account.name,
        action: auditEvent.action,
        targetType: auditEvent.targetType,
        targetId: auditEvent.targetId,
        at: auditEvent.at,
        actorUserId: auditEvent.actorUserId,
        actorPlatformAdminId: auditEvent.actorPlatformAdminId,
      })
      .from(auditEvent)
      .innerJoin(account, eq(account.id, auditEvent.accountId))
      .orderBy(desc(auditEvent.at))
      .limit(cappedLimit);
    return rows;
  });
}

const accountStatusSchema = z.object({
  accountId: z.string().uuid(),
  status: z.enum(['active', 'suspended']),
});

/** Suspend or reactivate a tenant account. Writes go through the account's own
 * tenant context, so the existing per-account RLS policy applies unchanged. */
export async function setAccountStatus(input: z.input<typeof accountStatusSchema>) {
  const admin = await requirePlatformAdmin();
  const { accountId, status } = accountStatusSchema.parse(input);
  const db = getDb();

  const [operator] = await db
    .select()
    .from(platformAdmin)
    .where(eq(platformAdmin.cognitoSub, admin.cognitoSub));

  await withTenant(db, { accountId, userId: '' }, async (tx) => {
    const [existing] = await tx.select().from(account).where(eq(account.id, accountId));
    if (!existing) throw new Error('Account not found');

    const [updated] = await tx
      .update(account)
      .set({ status, updatedAt: new Date() })
      .where(eq(account.id, accountId))
      .returning();

    await tx.insert(auditEvent).values(
      buildAuditEvent(
        { accountId, userId: '', actorPlatformAdminId: operator?.id },
        {
          action: status === 'suspended' ? 'account.suspend' : 'account.reactivate',
          targetType: 'account',
          targetId: accountId,
          before: { status: existing.status },
          after: { status: updated.status },
          justification: `Platform admin ${admin.email}`,
        },
      ),
    );
  });

  revalidatePath('/admin/accounts');
}

const userStatusSchema = z.object({
  accountId: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.enum(['active', 'suspended']),
});

/** Deactivate or reactivate a user within their own account. */
export async function setUserStatus(input: z.input<typeof userStatusSchema>) {
  const admin = await requirePlatformAdmin();
  const { accountId, userId, status } = userStatusSchema.parse(input);
  const db = getDb();

  const [operator] = await db
    .select()
    .from(platformAdmin)
    .where(eq(platformAdmin.cognitoSub, admin.cognitoSub));

  await withTenant(db, { accountId, userId: '' }, async (tx) => {
    const [existing] = await tx.select().from(user).where(eq(user.id, userId));
    if (!existing) throw new Error('User not found');

    const [updated] = await tx
      .update(user)
      .set({ status, updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning();

    await tx.insert(auditEvent).values(
      buildAuditEvent(
        { accountId, userId: '', actorPlatformAdminId: operator?.id },
        {
          action: status === 'suspended' ? 'user.suspend' : 'user.reactivate',
          targetType: 'user',
          targetId: userId,
          before: { status: existing.status },
          after: { status: updated.status },
          justification: `Platform admin ${admin.email}`,
        },
      ),
    );
  });

  revalidatePath('/admin/users');
}

const moduleToggleSchema = z.object({
  accountId: z.string().uuid(),
  module: z.enum([
    'plan',
    'productivity',
    'finances',
    'business',
    'health',
    'life',
    'research',
    'social',
  ]),
  enabled: z.boolean(),
});

/** Enable or disable a module for a single account. */
export async function setModuleEnabled(input: z.input<typeof moduleToggleSchema>) {
  const admin = await requirePlatformAdmin();
  const { accountId, module, enabled } = moduleToggleSchema.parse(input);
  const db = getDb();

  const [operator] = await db
    .select()
    .from(platformAdmin)
    .where(eq(platformAdmin.cognitoSub, admin.cognitoSub));

  await withTenant(db, { accountId, userId: '' }, async (tx) => {
    const [existing] = await tx
      .select()
      .from(moduleState)
      .where(and(eq(moduleState.accountId, accountId), eq(moduleState.module, module)));

    const now = new Date();
    let updated;
    if (existing) {
      [updated] = await tx
        .update(moduleState)
        .set({
          enabled,
          enabledAt: enabled ? now : existing.enabledAt,
          disabledAt: enabled ? null : now,
          updatedAt: now,
        })
        .where(eq(moduleState.id, existing.id))
        .returning();
    } else {
      [updated] = await tx
        .insert(moduleState)
        .values({ accountId, module, enabled, enabledAt: enabled ? now : undefined })
        .returning();
    }

    await tx.insert(auditEvent).values(
      buildAuditEvent(
        { accountId, userId: '', actorPlatformAdminId: operator?.id },
        {
          action: enabled ? 'module.enable' : 'module.disable',
          targetType: 'module_state',
          targetId: updated.id,
          before: existing ? { enabled: existing.enabled } : undefined,
          after: { enabled: updated.enabled },
          justification: `Platform admin ${admin.email}`,
        },
      ),
    );
  });

  revalidatePath('/admin/modules');
}
