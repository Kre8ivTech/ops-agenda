'use server';

import { revalidatePath } from 'next/cache';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { buildAuditEvent } from '@/lib/audit';
import {
  mapTestFailure,
  probeIntegrationCredential,
  type IntegrationTestOutcome,
} from '@/lib/admin/integration-probes';
import { summarizeIntegrations, type IntegrationSummary } from '@/lib/admin/overview';
import { requirePlatformAdmin } from '@/lib/auth/platform-admin';
import { createDb, withPlatformAdmin } from '@/lib/db';
import { auditEvent, integrationCredential } from '@/lib/db/schema';
import { env } from '@/lib/env';
import {
  decryptCredentialSecret,
  encryptCredentialSecret,
  type IntegrationProvider,
} from '@/lib/integrations/credentials';

function getDb() {
  return createDb(env.DATABASE_URL);
}

const PROVIDER_ENUM = z.enum([
  'stripe',
  'aws_bedrock',
  'office365',
  'google_workspace',
  'plaid',
  'openai',
  'anthropic',
  'sendgrid',
  'twilio',
  'custom',
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IntegrationCredentialRow {
  id: string;
  provider: string;
  label: string;
  enabled: boolean;
  metadata: unknown;
  lastTestedAt: Date | null;
  lastTestResult: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
}

function publicCredentialView(row: {
  id: string;
  provider: string;
  label: string;
  enabled: boolean;
  metadata: unknown;
  lastTestedAt: Date | null;
  lastTestResult: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
}): IntegrationCredentialRow {
  return {
    id: row.id,
    provider: row.provider,
    label: row.label,
    enabled: row.enabled,
    metadata: scrubMetadataForUi(row.metadata),
    lastTestedAt: row.lastTestedAt,
    lastTestResult: row.lastTestResult,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
  };
}

/** Drop any accidental secret-shaped keys from metadata before UI render. */
function scrubMetadataForUi(metadata: unknown): unknown {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return metadata;
  const blocked = new Set([
    'secret',
    'api_key',
    'client_secret',
    'auth_token',
    'encrypted_payload',
    'ciphertext',
  ]);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(metadata as Record<string, unknown>)) {
    if (blocked.has(k.toLowerCase())) continue;
    out[k] = v;
  }
  return out;
}

function safeAuditSnapshot(row: {
  provider: string;
  label: string;
  enabled: boolean;
  metadata: unknown;
  lastTestResult?: string | null;
}): Record<string, unknown> {
  return {
    provider: row.provider,
    label: row.label,
    enabled: row.enabled,
    metadata: scrubMetadataForUi(row.metadata),
    lastTestResult: row.lastTestResult ?? null,
    secretRotated: false,
  };
}

async function writePlatformAudit(input: {
  cognitoSub: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}) {
  const db = getDb();
  await withPlatformAdmin(db, input.cognitoSub, async (tx) => {
    await tx.insert(auditEvent).values(
      buildAuditEvent(
        {
          accountId: null,
          userId: '',
          actorPlatformAdminId: input.adminId,
        },
        {
          action: input.action,
          targetType: 'integration_credential',
          targetId: input.targetId,
          before: input.before,
          after: input.after,
          justification: `Platform admin ${input.adminEmail}`,
        },
      ),
    );
  });
}

// ---------------------------------------------------------------------------
// CRUD Actions
// ---------------------------------------------------------------------------

/** List all integration credentials (without exposing the encrypted payload). */
export async function listIntegrationCredentials(): Promise<IntegrationCredentialRow[]> {
  await requirePlatformAdmin();
  const db = getDb();
  const rows = await db
    .select({
      id: integrationCredential.id,
      provider: integrationCredential.provider,
      label: integrationCredential.label,
      enabled: integrationCredential.enabled,
      metadata: integrationCredential.metadata,
      lastTestedAt: integrationCredential.lastTestedAt,
      lastTestResult: integrationCredential.lastTestResult,
      createdAt: integrationCredential.createdAt,
      updatedAt: integrationCredential.updatedAt,
      createdBy: integrationCredential.createdBy,
    })
    .from(integrationCredential)
    .orderBy(desc(integrationCredential.createdAt));
  return rows.map(publicCredentialView);
}

/** Compact summary for Overview / header widgets. */
export async function getIntegrationsSummary(): Promise<IntegrationSummary> {
  const rows = await listIntegrationCredentials();
  return summarizeIntegrations(rows);
}

const createCredentialSchema = z.object({
  provider: PROVIDER_ENUM,
  label: z.string().min(1).max(255),
  /** The raw secret value(s) — JSON string that gets encrypted. */
  secret: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

/** Create a new integration credential (encrypts the secret at rest). */
export async function createIntegrationCredential(input: z.input<typeof createCredentialSchema>) {
  const admin = await requirePlatformAdmin();
  const { provider, label, secret, metadata } = createCredentialSchema.parse(input);
  const db = getDb();

  const { ciphertext, iv, authTag } = await encryptCredentialSecret(secret);

  const [created] = await db
    .insert(integrationCredential)
    .values({
      provider,
      label,
      encryptedPayload: ciphertext,
      iv,
      authTag,
      metadata: metadata ?? null,
      createdBy: admin.id,
    })
    .returning();

  await writePlatformAudit({
    cognitoSub: admin.cognitoSub,
    adminId: admin.id,
    adminEmail: admin.email,
    action: 'integration.create',
    targetId: created.id,
    after: safeAuditSnapshot(created),
  });

  revalidatePath('/admin/integrations');
  revalidatePath('/admin');
  return { id: created.id, provider: created.provider, label: created.label };
}

const updateCredentialSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(255).optional(),
  /** If provided, re-encrypts the secret (prefer rotateIntegrationCredential). */
  secret: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/** Update an integration credential (optionally rotates the secret). */
export async function updateIntegrationCredential(input: z.input<typeof updateCredentialSchema>) {
  const admin = await requirePlatformAdmin();
  const { id, label, secret, enabled, metadata } = updateCredentialSchema.parse(input);
  const db = getDb();

  const [existing] = await db
    .select()
    .from(integrationCredential)
    .where(eq(integrationCredential.id, id));
  if (!existing) throw new Error('Credential not found');

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (label !== undefined) updates.label = label;
  if (enabled !== undefined) updates.enabled = enabled;
  if (metadata !== undefined) updates.metadata = metadata;

  let action:
    'integration.update' | 'integration.rotate' | 'integration.enable' | 'integration.disable' =
    'integration.update';
  if (secret) {
    const { ciphertext, iv, authTag } = await encryptCredentialSecret(secret);
    updates.encryptedPayload = ciphertext;
    updates.iv = iv;
    updates.authTag = authTag;
    action = 'integration.rotate';
  } else if (enabled !== undefined && label === undefined && metadata === undefined) {
    action = enabled ? 'integration.enable' : 'integration.disable';
  }

  const [updated] = await db
    .update(integrationCredential)
    .set(updates)
    .where(eq(integrationCredential.id, id))
    .returning();

  await writePlatformAudit({
    cognitoSub: admin.cognitoSub,
    adminId: admin.id,
    adminEmail: admin.email,
    action,
    targetId: id,
    before: safeAuditSnapshot(existing),
    after: {
      ...safeAuditSnapshot(updated),
      secretRotated: Boolean(secret),
    },
  });

  revalidatePath('/admin/integrations');
  revalidatePath('/admin');
}

const rotateCredentialSchema = z.object({
  id: z.string().uuid(),
  secret: z.string().min(1),
});

/** Dedicated secret rotation helper (audits as integration.rotate). */
export async function rotateIntegrationCredential(input: z.input<typeof rotateCredentialSchema>) {
  const { id, secret } = rotateCredentialSchema.parse(input);
  await updateIntegrationCredential({ id, secret });
}

const deleteCredentialSchema = z.object({
  id: z.string().uuid(),
});

/** Permanently delete an integration credential. */
export async function deleteIntegrationCredential(input: z.input<typeof deleteCredentialSchema>) {
  const admin = await requirePlatformAdmin();
  const { id } = deleteCredentialSchema.parse(input);
  const db = getDb();

  const [existing] = await db
    .select()
    .from(integrationCredential)
    .where(eq(integrationCredential.id, id));
  if (!existing) throw new Error('Credential not found');

  await db.delete(integrationCredential).where(eq(integrationCredential.id, id));

  await writePlatformAudit({
    cognitoSub: admin.cognitoSub,
    adminId: admin.id,
    adminEmail: admin.email,
    action: 'integration.delete',
    targetId: id,
    before: safeAuditSnapshot(existing),
  });

  revalidatePath('/admin/integrations');
  revalidatePath('/admin');
}

/**
 * Live-test a credential: decrypt, then run a provider probe.
 * Persists lastTestResult / lastTestedAt and returns a structured outcome.
 */
export async function testIntegrationCredential(input: {
  id: string;
}): Promise<IntegrationTestOutcome> {
  const admin = await requirePlatformAdmin();
  const db = getDb();

  const [cred] = await db
    .select()
    .from(integrationCredential)
    .where(eq(integrationCredential.id, input.id));

  if (!cred) throw new Error('Credential not found');

  let outcome: IntegrationTestOutcome;
  try {
    const plaintext = await decryptCredentialSecret(cred.encryptedPayload, cred.iv, cred.authTag);
    let secret: Record<string, unknown>;
    try {
      const parsed = JSON.parse(plaintext) as unknown;
      secret =
        parsed && typeof parsed === 'object' && !Array.isArray(parsed)
          ? (parsed as Record<string, unknown>)
          : { value: plaintext };
    } catch {
      secret = { value: plaintext };
    }
    outcome = await probeIntegrationCredential(cred.provider, secret);
  } catch (err) {
    outcome = mapTestFailure(err);
  }

  const nextMetadata =
    cred.metadata && typeof cred.metadata === 'object' && !Array.isArray(cred.metadata)
      ? { ...(cred.metadata as Record<string, unknown>) }
      : {};
  if (outcome.detail) {
    nextMetadata.lastTestDetail = outcome.detail;
  } else {
    delete nextMetadata.lastTestDetail;
  }

  await db
    .update(integrationCredential)
    .set({
      lastTestedAt: outcome.checkedAt,
      lastTestResult: outcome.result,
      metadata: nextMetadata,
      updatedAt: new Date(),
    })
    .where(eq(integrationCredential.id, input.id));

  await writePlatformAudit({
    cognitoSub: admin.cognitoSub,
    adminId: admin.id,
    adminEmail: admin.email,
    action: 'integration.test',
    targetId: input.id,
    after: {
      provider: cred.provider,
      label: cred.label,
      result: outcome.result,
      ok: outcome.ok,
      detail: outcome.detail ?? null,
      checkedAt: outcome.checkedAt.toISOString(),
    },
  });

  revalidatePath('/admin/integrations');
  revalidatePath('/admin');
  return outcome;
}

export type { IntegrationProvider, IntegrationTestOutcome };
