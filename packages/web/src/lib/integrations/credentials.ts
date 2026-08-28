/**
 * Platform integration credential loading and encryption helpers.
 * Used by Admin → Integrations, connectors, AI client, and Plaid.
 */

import { and, eq } from 'drizzle-orm';
import { decryptAesGcm, encryptAesGcm } from '@/lib/crypto/aes-gcm';
import { createDb } from '@/lib/db';
import { integrationCredential, type IntegrationCredentialSelect } from '@/lib/db/schema';
import { env } from '@/lib/env';

export type IntegrationProvider =
  | 'stripe'
  | 'aws_bedrock'
  | 'office365'
  | 'google_workspace'
  | 'plaid'
  | 'openai'
  | 'anthropic'
  | 'sendgrid'
  | 'twilio'
  | 'custom';

export interface LoadedIntegrationCredential {
  id: string;
  provider: IntegrationProvider;
  label: string;
  /** Parsed JSON secret payload (never log this). */
  secret: Record<string, unknown>;
  metadata: unknown;
  enabled: boolean;
  row: IntegrationCredentialSelect;
}

function getDb() {
  return createDb(env.DATABASE_URL);
}

export async function encryptCredentialSecret(plaintext: string) {
  return encryptAesGcm(plaintext);
}

export async function decryptCredentialSecret(
  ciphertext: string,
  iv: string,
  authTag: string,
): Promise<string> {
  return decryptAesGcm(ciphertext, iv, authTag);
}

function parseSecretPayload(plaintext: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(plaintext) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Non-JSON secrets (rare) are exposed under a generic key for callers.
  }
  return { value: plaintext };
}

async function toLoaded(row: IntegrationCredentialSelect): Promise<LoadedIntegrationCredential> {
  const plaintext = await decryptCredentialSecret(row.encryptedPayload, row.iv, row.authTag);
  return {
    id: row.id,
    provider: row.provider as IntegrationProvider,
    label: row.label,
    secret: parseSecretPayload(plaintext),
    metadata: row.metadata,
    enabled: row.enabled,
    row,
  };
}

/** Load the first enabled credential for a provider, or null if none / decrypt fails. */
export async function loadEnabledCredential(
  provider: IntegrationProvider,
): Promise<LoadedIntegrationCredential | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(integrationCredential)
    .where(
      and(eq(integrationCredential.provider, provider), eq(integrationCredential.enabled, true)),
    );

  if (!row) return null;

  try {
    return await toLoaded(row);
  } catch {
    return null;
  }
}

/** Load an enabled credential by id (AI models reference credentials by UUID). */
export async function loadEnabledCredentialById(
  id: string,
): Promise<LoadedIntegrationCredential | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(integrationCredential)
    .where(and(eq(integrationCredential.id, id), eq(integrationCredential.enabled, true)));

  if (!row) return null;

  try {
    return await toLoaded(row);
  } catch {
    return null;
  }
}

/** Safe string field lookup from a secret payload. */
export function secretString(
  secret: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = secret[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}
