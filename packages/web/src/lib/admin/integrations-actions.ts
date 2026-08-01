'use server';

import { revalidatePath } from 'next/cache';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { requirePlatformAdmin } from '@/lib/auth/platform-admin';
import { createDb } from '@/lib/db';
import { integrationCredential } from '@/lib/db/schema';
import { env } from '@/lib/env';

function getDb() {
  return createDb(env.DATABASE_URL);
}

// ---------------------------------------------------------------------------
// Encryption helpers (AES-256-GCM via Web Crypto)
// ---------------------------------------------------------------------------

const ENCRYPTION_KEY_ENV = 'SESSION_SECRET'; // reuse the 48-char secret as key material

async function getEncryptionKey(): Promise<CryptoKey> {
  const raw = process.env[ENCRYPTION_KEY_ENV];
  if (!raw || raw.length < 32) throw new Error('Encryption key not configured');
  const keyMaterial = new TextEncoder().encode(raw.slice(0, 32));
  return crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

async function encrypt(plaintext: string): Promise<{ ciphertext: string; iv: string; authTag: string }> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const buf = new Uint8Array(encrypted);
  // AES-GCM appends 16-byte auth tag to the ciphertext
  const ciphertext = buf.slice(0, buf.length - 16);
  const authTag = buf.slice(buf.length - 16);
  return {
    ciphertext: Buffer.from(ciphertext).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
    authTag: Buffer.from(authTag).toString('base64'),
  };
}

async function decrypt(ciphertext: string, ivB64: string, authTagB64: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = Buffer.from(ivB64, 'base64');
  const ct = Buffer.from(ciphertext, 'base64');
  const tag = Buffer.from(authTagB64, 'base64');
  // Reconstruct the format AES-GCM expects (ciphertext + authTag)
  const combined = new Uint8Array(ct.length + tag.length);
  combined.set(ct, 0);
  combined.set(tag, ct.length);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined);
  return new TextDecoder().decode(decrypted);
}

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
    })
    .from(integrationCredential)
    .orderBy(desc(integrationCredential.createdAt));
  return rows;
}

const createCredentialSchema = z.object({
  provider: z.enum([
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
  ]),
  label: z.string().min(1).max(255),
  /** The raw secret value(s) — JSON string that gets encrypted. */
  secret: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

/** Create a new integration credential (encrypts the secret at rest). */
export async function createIntegrationCredential(input: z.input<typeof createCredentialSchema>) {
  await requirePlatformAdmin();
  const { provider, label, secret, metadata } = createCredentialSchema.parse(input);
  const db = getDb();

  const { ciphertext, iv, authTag } = await encrypt(secret);

  const [created] = await db
    .insert(integrationCredential)
    .values({
      provider,
      label,
      encryptedPayload: ciphertext,
      iv,
      authTag,
      metadata: metadata ?? null,
    })
    .returning();

  revalidatePath('/admin/integrations');
  return { id: created.id, provider: created.provider, label: created.label };
}

const updateCredentialSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(255).optional(),
  /** If provided, re-encrypts the secret. */
  secret: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/** Update an integration credential (optionally rotates the secret). */
export async function updateIntegrationCredential(input: z.input<typeof updateCredentialSchema>) {
  await requirePlatformAdmin();
  const { id, label, secret, enabled, metadata } = updateCredentialSchema.parse(input);
  const db = getDb();

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (label !== undefined) updates.label = label;
  if (enabled !== undefined) updates.enabled = enabled;
  if (metadata !== undefined) updates.metadata = metadata;

  if (secret) {
    const { ciphertext, iv, authTag } = await encrypt(secret);
    updates.encryptedPayload = ciphertext;
    updates.iv = iv;
    updates.authTag = authTag;
  }

  await db
    .update(integrationCredential)
    .set(updates)
    .where(eq(integrationCredential.id, id));

  revalidatePath('/admin/integrations');
}

const deleteCredentialSchema = z.object({
  id: z.string().uuid(),
});

/** Permanently delete an integration credential. */
export async function deleteIntegrationCredential(input: z.input<typeof deleteCredentialSchema>) {
  await requirePlatformAdmin();
  const { id } = deleteCredentialSchema.parse(input);
  const db = getDb();
  await db.delete(integrationCredential).where(eq(integrationCredential.id, id));
  revalidatePath('/admin/integrations');
}

/** Test/validate a credential (placeholder — real validation depends on the provider SDK). */
export async function testIntegrationCredential(input: { id: string }) {
  await requirePlatformAdmin();
  const db = getDb();

  const [cred] = await db
    .select()
    .from(integrationCredential)
    .where(eq(integrationCredential.id, input.id));

  if (!cred) throw new Error('Credential not found');

  // Attempt to decrypt to verify integrity
  try {
    await decrypt(cred.encryptedPayload, cred.iv, cred.authTag);
    await db
      .update(integrationCredential)
      .set({ lastTestedAt: new Date(), lastTestResult: 'ok', updatedAt: new Date() })
      .where(eq(integrationCredential.id, input.id));
  } catch {
    await db
      .update(integrationCredential)
      .set({ lastTestedAt: new Date(), lastTestResult: 'decrypt_failed', updatedAt: new Date() })
      .where(eq(integrationCredential.id, input.id));
  }

  revalidatePath('/admin/integrations');
}
