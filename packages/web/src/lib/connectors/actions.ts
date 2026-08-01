'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { createDb, withTenant } from '@/lib/db';
import { connection } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { encryptTokens } from '@/lib/connectors';
import { ImapConnector, type ImapConfig } from '@/lib/connectors/imap';

function getDb() {
  return createDb(env.DATABASE_URL);
}

async function requireTenant() {
  const session = await getSession();
  if (!session?.accountId || !session?.userId) {
    throw new Error('You must be signed in with a workspace');
  }
  return { accountId: session.accountId, userId: session.userId };
}

// ---------------------------------------------------------------------------
// List connections
// ---------------------------------------------------------------------------

export interface ConnectionRow {
  id: string;
  provider: string;
  kind: string;
  externalAccountRef: string | null;
  status: string;
  lastSyncAt: Date | null;
  lastErrorCode: string | null;
  tokenExpiresAt: Date | null;
  createdAt: Date;
}

export async function listConnections(): Promise<ConnectionRow[]> {
  const tenant = await requireTenant();
  const db = getDb();
  return withTenant(db, tenant, async (tx) => {
    return tx
      .select({
        id: connection.id,
        provider: connection.provider,
        kind: connection.kind,
        externalAccountRef: connection.externalAccountRef,
        status: connection.status,
        lastSyncAt: connection.lastSyncAt,
        lastErrorCode: connection.lastErrorCode,
        tokenExpiresAt: connection.tokenExpiresAt,
        createdAt: connection.createdAt,
      })
      .from(connection)
      .where(isNull(connection.deletedAt));
  });
}

// ---------------------------------------------------------------------------
// Delete connection
// ---------------------------------------------------------------------------

const deleteSchema = z.object({ connectionId: z.string().uuid() });

export async function deleteConnection(input: z.input<typeof deleteSchema>) {
  const tenant = await requireTenant();
  const { connectionId } = deleteSchema.parse(input);
  const db = getDb();

  await withTenant(db, tenant, async (tx) => {
    await tx
      .update(connection)
      .set({ deletedAt: new Date(), status: 'revoked' })
      .where(eq(connection.id, connectionId));
  });

  revalidatePath('/settings/connections');
}

// ---------------------------------------------------------------------------
// Create IMAP connection
// ---------------------------------------------------------------------------

const imapSchema = z.object({
  email: z.string().email(),
  host: z.string().min(1),
  port: z.coerce.number().int().min(1).max(65535),
  security: z.enum(['ssl', 'starttls', 'none']),
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function createImapConnection(input: z.input<typeof imapSchema>) {
  const tenant = await requireTenant();
  const data = imapSchema.parse(input);
  const db = getDb();

  // Test connectivity first
  const testResult = await ImapConnector.testConnection({
    host: data.host,
    port: data.port,
    security: data.security,
    username: data.username,
    password: data.password,
  });

  if (!testResult.ok) {
    throw new Error(`Connection test failed: ${testResult.error}`);
  }

  // Encrypt the password
  const { encrypted, iv, authTag } = await encryptTokens(
    JSON.stringify({ username: data.username, password: data.password }),
  );

  await withTenant(db, tenant, async (tx) => {
    await tx.insert(connection).values({
      accountId: tenant.accountId,
      createdBy: tenant.userId,
      provider: 'imap',
      kind: 'mail',
      externalAccountRef: data.email,
      status: 'healthy',
      accessTokenEnc: encrypted,
      tokenIv: iv,
      tokenAuthTag: authTag,
      imapHost: data.host,
      imapPort: String(data.port),
      imapSecurity: data.security,
    });
  });

  revalidatePath('/settings/connections');
}

// ---------------------------------------------------------------------------
// Test connection
// ---------------------------------------------------------------------------

export async function testConnection(input: { connectionId: string }): Promise<{ ok: boolean; error?: string }> {
  const tenant = await requireTenant();
  const db = getDb();

  const [conn] = await withTenant(db, tenant, async (tx) => {
    return tx.select().from(connection).where(eq(connection.id, input.connectionId));
  });

  if (!conn) return { ok: false, error: 'Connection not found' };

  if (conn.provider === 'imap' && conn.imapHost) {
    const result = await ImapConnector.testConnection({
      host: conn.imapHost,
      port: parseInt(conn.imapPort ?? '993'),
      security: (conn.imapSecurity ?? 'ssl') as ImapConfig['security'],
      username: '',
      password: '',
    });

    const newStatus = result.ok ? 'healthy' : 'degraded';
    await withTenant(db, tenant, async (tx) => {
      await tx
        .update(connection)
        .set({
          status: newStatus,
          lastErrorCode: result.error ?? null,
          updatedAt: new Date(),
        })
        .where(eq(connection.id, input.connectionId));
    });

    revalidatePath('/settings/connections');
    return result;
  }

  // For OAuth providers, check if token is still valid
  if (conn.tokenExpiresAt && conn.tokenExpiresAt > new Date()) {
    await withTenant(db, tenant, async (tx) => {
      await tx
        .update(connection)
        .set({ status: 'healthy', lastErrorCode: null, updatedAt: new Date() })
        .where(eq(connection.id, input.connectionId));
    });
    revalidatePath('/settings/connections');
    return { ok: true };
  }

  // Token expired — mark as degraded
  await withTenant(db, tenant, async (tx) => {
    await tx
      .update(connection)
      .set({ status: 'degraded', lastErrorCode: 'token_expired', updatedAt: new Date() })
      .where(eq(connection.id, input.connectionId));
  });

  revalidatePath('/settings/connections');
  return { ok: false, error: 'Token expired — reconnect required' };
}
