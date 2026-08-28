'use server';

import { revalidatePath } from 'next/cache';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { buildAuditEvent } from '@/lib/audit';
import { requirePlatformAdmin } from '@/lib/auth/platform-admin';
import { createDb, withPlatformAdmin, withTenant } from '@/lib/db';
import { account, auditEvent, connection, moduleState, platformAdmin, user } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { getAiUsageSummary } from '@/lib/admin/ai-actions';
import { listIntegrationCredentials } from '@/lib/admin/integrations-actions';
import { buildAdminOverview, type AdminOverviewData } from '@/lib/admin/overview';

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

/** Aggregated platform state for the /admin overview dashboard. */
export async function getAdminOverview(): Promise<AdminOverviewData> {
  await requirePlatformAdmin();

  const [accounts, users, connections, modules, integrations, auditEvents, ai, health] =
    await Promise.all([
      listAllAccounts(),
      listAllUsers(),
      listAllConnections(),
      listAllModuleStates(),
      listIntegrationCredentials(),
      listRecentAuditEvents(10),
      getAiUsageSummary(),
      getSystemHealth(),
    ]);

  return buildAdminOverview({
    accounts: accounts.map((row) => ({ id: row.id, name: row.name, status: row.status })),
    users: users.map((row) => ({ status: row.status })),
    connections,
    modules: modules.map((row) => ({ module: row.module, enabled: row.enabled })),
    integrations,
    auditEvents,
    ai: {
      totalRequests: ai.totalRequests,
      successRate: ai.successRate,
      avgLatencyMs: ai.avgLatencyMs,
    },
    database: { ok: health.database.ok, latencyMs: health.database.latencyMs },
  });
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

// ---------------------------------------------------------------------------
// Account CRUD
// ---------------------------------------------------------------------------

const createAccountSchema = z.object({
  name: z.string().min(1).max(255),
  plan: z.enum(['trial', 'starter', 'pro', 'enterprise']).default('trial'),
});

/** Create a new tenant account. */
export async function createAccount(input: z.input<typeof createAccountSchema>) {
  const admin = await requirePlatformAdmin();
  const { name, plan } = createAccountSchema.parse(input);
  const db = getDb();

  const [operator] = await db
    .select()
    .from(platformAdmin)
    .where(eq(platformAdmin.cognitoSub, admin.cognitoSub));

  const [newAccount] = await db
    .insert(account)
    .values({ name, plan })
    .returning();

  await withTenant(db, { accountId: newAccount.id, userId: '' }, async (tx) => {
    await tx.insert(auditEvent).values(
      buildAuditEvent(
        { accountId: newAccount.id, userId: '', actorPlatformAdminId: operator?.id },
        {
          action: 'account.create',
          targetType: 'account',
          targetId: newAccount.id,
          after: { name, plan },
          justification: `Platform admin ${admin.email}`,
        },
      ),
    );
  });

  revalidatePath('/admin/accounts');
  return newAccount;
}

const updateAccountSchema = z.object({
  accountId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  plan: z.enum(['trial', 'starter', 'pro', 'enterprise']).optional(),
});

/** Update an existing account's name or plan. */
export async function updateAccount(input: z.input<typeof updateAccountSchema>) {
  const admin = await requirePlatformAdmin();
  const { accountId, name, plan } = updateAccountSchema.parse(input);
  const db = getDb();

  const [operator] = await db
    .select()
    .from(platformAdmin)
    .where(eq(platformAdmin.cognitoSub, admin.cognitoSub));

  await withTenant(db, { accountId, userId: '' }, async (tx) => {
    const [existing] = await tx.select().from(account).where(eq(account.id, accountId));
    if (!existing) throw new Error('Account not found');

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (plan !== undefined) updates.plan = plan;

    const [updated] = await tx
      .update(account)
      .set(updates)
      .where(eq(account.id, accountId))
      .returning();

    await tx.insert(auditEvent).values(
      buildAuditEvent(
        { accountId, userId: '', actorPlatformAdminId: operator?.id },
        {
          action: 'account.update',
          targetType: 'account',
          targetId: accountId,
          before: { name: existing.name, plan: existing.plan },
          after: { name: updated.name, plan: updated.plan },
          justification: `Platform admin ${admin.email}`,
        },
      ),
    );
  });

  revalidatePath('/admin/accounts');
  revalidatePath(`/admin/accounts/${accountId}`);
}

const deleteAccountSchema = z.object({
  accountId: z.string().uuid(),
});

/** Permanently delete an account and all its data. This is irreversible. */
export async function deleteAccount(input: z.input<typeof deleteAccountSchema>) {
  await requirePlatformAdmin();
  const { accountId } = deleteAccountSchema.parse(input);
  const db = getDb();

  await withTenant(db, { accountId, userId: '' }, async (tx) => {
    const [existing] = await tx.select().from(account).where(eq(account.id, accountId));
    if (!existing) throw new Error('Account not found');

    // Delete in dependency order
    await tx.delete(auditEvent).where(eq(auditEvent.accountId, accountId));
    await tx.delete(moduleState).where(eq(moduleState.accountId, accountId));
    await tx.delete(connection).where(eq(connection.accountId, accountId));
    await tx.delete(user).where(eq(user.accountId, accountId));
  });

  // Delete account outside tenant context (RLS policy is on the account row itself)
  await db.delete(account).where(eq(account.id, accountId));

  revalidatePath('/admin/accounts');
}

// ---------------------------------------------------------------------------
// User management within an account
// ---------------------------------------------------------------------------

const addUserSchema = z.object({
  accountId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(255),
  role: z.enum(['admin', 'member']).default('member'),
});

/** Add a new user to an existing account. */
export async function addUserToAccount(input: z.input<typeof addUserSchema>) {
  const admin = await requirePlatformAdmin();
  const { accountId, email, name, role } = addUserSchema.parse(input);
  const db = getDb();

  const [operator] = await db
    .select()
    .from(platformAdmin)
    .where(eq(platformAdmin.cognitoSub, admin.cognitoSub));

  const newUser = await withTenant(db, { accountId, userId: '' }, async (tx) => {
    const [acc] = await tx.select().from(account).where(eq(account.id, accountId));
    if (!acc) throw new Error('Account not found');

    const [created] = await tx
      .insert(user)
      .values({ accountId, email: email.toLowerCase(), name, role })
      .returning();

    await tx.insert(auditEvent).values(
      buildAuditEvent(
        { accountId, userId: '', actorPlatformAdminId: operator?.id },
        {
          action: 'user.add',
          targetType: 'user',
          targetId: created.id,
          after: { email: created.email, name: created.name, role: created.role },
          justification: `Platform admin ${admin.email}`,
        },
      ),
    );

    return created;
  });

  revalidatePath(`/admin/accounts/${accountId}`);
  revalidatePath('/admin/users');
  return newUser;
}

const removeUserSchema = z.object({
  accountId: z.string().uuid(),
  userId: z.string().uuid(),
});

/** Remove a user from an account permanently. */
export async function removeUserFromAccount(input: z.input<typeof removeUserSchema>) {
  const admin = await requirePlatformAdmin();
  const { accountId, userId } = removeUserSchema.parse(input);
  const db = getDb();

  const [operator] = await db
    .select()
    .from(platformAdmin)
    .where(eq(platformAdmin.cognitoSub, admin.cognitoSub));

  await withTenant(db, { accountId, userId: '' }, async (tx) => {
    const [existing] = await tx.select().from(user).where(eq(user.id, userId));
    if (!existing) throw new Error('User not found');

    await tx.delete(user).where(eq(user.id, userId));

    await tx.insert(auditEvent).values(
      buildAuditEvent(
        { accountId, userId: '', actorPlatformAdminId: operator?.id },
        {
          action: 'user.remove',
          targetType: 'user',
          targetId: userId,
          before: { email: existing.email, name: existing.name, role: existing.role },
          justification: `Platform admin ${admin.email}`,
        },
      ),
    );
  });

  revalidatePath(`/admin/accounts/${accountId}`);
  revalidatePath('/admin/users');
}

// ---------------------------------------------------------------------------
// Account status
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Connections (cross-tenant view)
// ---------------------------------------------------------------------------

export interface AdminConnectionRow {
  id: string;
  accountId: string;
  accountName: string;
  provider: string;
  kind: string;
  status: string;
  lastSyncAt: Date | null;
  lastErrorCode: string | null;
  createdAt: Date;
}

/** All connections across every account. */
export async function listAllConnections(): Promise<AdminConnectionRow[]> {
  const admin = await requirePlatformAdmin();
  const db = getDb();

  return withPlatformAdmin(db, admin.cognitoSub, async (tx) => {
    const rows = await tx
      .select({
        id: connection.id,
        accountId: connection.accountId,
        accountName: account.name,
        provider: connection.provider,
        kind: connection.kind,
        status: connection.status,
        lastSyncAt: connection.lastSyncAt,
        lastErrorCode: connection.lastErrorCode,
        createdAt: connection.createdAt,
      })
      .from(connection)
      .innerJoin(account, eq(account.id, connection.accountId))
      .orderBy(desc(connection.createdAt));
    return rows;
  });
}

// ---------------------------------------------------------------------------
// Platform Admins management
// ---------------------------------------------------------------------------

export interface AdminPlatformAdminRow {
  id: string;
  cognitoSub: string;
  email: string;
  name: string | null;
  createdAt: Date;
  revokedAt: Date | null;
}

/** All platform admins (including revoked, for history). */
export async function listPlatformAdmins(): Promise<AdminPlatformAdminRow[]> {
  await requirePlatformAdmin();
  const db = getDb();
  const rows = await db.select().from(platformAdmin).orderBy(desc(platformAdmin.createdAt));
  return rows;
}

const revokePlatformAdminSchema = z.object({
  platformAdminId: z.string().uuid(),
});

/** Revoke a platform admin's access. */
export async function revokePlatformAdminAccess(
  input: z.input<typeof revokePlatformAdminSchema>,
) {
  const admin = await requirePlatformAdmin();
  const { platformAdminId } = revokePlatformAdminSchema.parse(input);
  const db = getDb();

  const [target] = await db
    .select()
    .from(platformAdmin)
    .where(eq(platformAdmin.id, platformAdminId));

  if (!target) throw new Error('Platform admin not found');
  if (target.cognitoSub === admin.cognitoSub) {
    throw new Error('Cannot revoke your own access');
  }

  await db
    .update(platformAdmin)
    .set({ revokedAt: new Date() })
    .where(eq(platformAdmin.id, platformAdminId));

  revalidatePath('/admin/platform-admins');
}

// ---------------------------------------------------------------------------
// Account Detail
// ---------------------------------------------------------------------------

export interface AdminAccountDetail {
  id: string;
  name: string;
  plan: string;
  status: string;
  createdAt: Date;
  users: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    status: string;
    lastSeenAt: Date | null;
  }[];
  modules: { module: string; enabled: boolean }[];
  connections: {
    id: string;
    provider: string;
    kind: string;
    status: string;
    lastSyncAt: Date | null;
  }[];
  recentAudit: {
    id: string;
    action: string;
    targetType: string;
    at: Date;
  }[];
}

/** Full detail for a single account (drill-down from /admin/accounts). */
export async function getAccountDetail(accountId: string): Promise<AdminAccountDetail | null> {
  const admin = await requirePlatformAdmin();
  const db = getDb();

  return withPlatformAdmin(db, admin.cognitoSub, async (tx) => {
    const [acc] = await tx.select().from(account).where(eq(account.id, accountId));
    if (!acc) return null;

    const users = await tx
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        lastSeenAt: user.lastSeenAt,
      })
      .from(user)
      .where(eq(user.accountId, accountId));

    const modules = await tx
      .select({ module: moduleState.module, enabled: moduleState.enabled })
      .from(moduleState)
      .where(eq(moduleState.accountId, accountId));

    const connections = await tx
      .select({
        id: connection.id,
        provider: connection.provider,
        kind: connection.kind,
        status: connection.status,
        lastSyncAt: connection.lastSyncAt,
      })
      .from(connection)
      .where(eq(connection.accountId, accountId));

    const recentAudit = await tx
      .select({
        id: auditEvent.id,
        action: auditEvent.action,
        targetType: auditEvent.targetType,
        at: auditEvent.at,
      })
      .from(auditEvent)
      .where(eq(auditEvent.accountId, accountId))
      .orderBy(desc(auditEvent.at))
      .limit(20);

    return {
      id: acc.id,
      name: acc.name,
      plan: acc.plan,
      status: acc.status,
      createdAt: acc.createdAt,
      users,
      modules,
      connections,
      recentAudit,
    };
  });
}

// ---------------------------------------------------------------------------
// System Health (lightweight runtime checks)
// ---------------------------------------------------------------------------

export interface SystemHealthStatus {
  database: { ok: boolean; latencyMs: number | null; error?: string };
  uptime: number;
  nodeVersion: string;
  nextVersion: string;
  env: string;
  region: string;
  accountCount: number;
  userCount: number;
  connectionCount: number;
}

/** Runtime health metrics for the /admin/system page. */
export async function getSystemHealth(): Promise<SystemHealthStatus> {
  await requirePlatformAdmin();
  const db = getDb();

  let dbOk = false;
  let dbLatency: number | null = null;
  let dbError: string | undefined;

  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatency = Date.now() - start;
    dbOk = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : 'Unknown error';
  }

  let accountCount = 0;
  let userCount = 0;
  let connectionCount = 0;

  if (dbOk) {
    const [accResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(account);
    accountCount = accResult?.count ?? 0;

    const [userResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(user);
    userCount = userResult?.count ?? 0;

    const [connResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(connection);
    connectionCount = connResult?.count ?? 0;
  }

  return {
    database: { ok: dbOk, latencyMs: dbLatency, error: dbError },
    uptime: process.uptime(),
    nodeVersion: process.version,
    nextVersion: '16.2.12',
    env: process.env.NODE_ENV ?? 'unknown',
    region: process.env.AWS_REGION ?? 'unknown',
    accountCount,
    userCount,
    connectionCount,
  };
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
