'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { createDb, withTenant } from '@/lib/db';
import { connection, financialAccount } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { encryptTokens } from '@/lib/connectors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDb() {
  return createDb(env.DATABASE_URL);
}

async function requireTenant() {
  const session = await getSession();
  if (!session?.accountId || !session?.userId) throw new Error('Not signed in');
  return { accountId: session.accountId, userId: session.userId };
}

// ---------------------------------------------------------------------------
// Plaid Link flow
// ---------------------------------------------------------------------------

export async function createPlaidLinkToken(): Promise<{ linkToken: string } | { error: string }> {
  try {
    const tenant = await requireTenant();

    const clientId = process.env.PLAID_CLIENT_ID;
    const secret = process.env.PLAID_SECRET;
    if (!clientId || !secret) {
      return { error: 'PLAID_CLIENT_ID and PLAID_SECRET environment variables are required' };
    }

    const plaidEnv = process.env.PLAID_ENV ?? 'sandbox';
    const plaidBase = plaidEnv === 'production'
      ? 'https://production.plaid.com'
      : plaidEnv === 'development'
        ? 'https://development.plaid.com'
        : 'https://sandbox.plaid.com';

    const res = await fetch(`${plaidBase}/link/token/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        secret,
        user: { client_user_id: tenant.userId },
        client_name: 'Ops Agenda',
        products: ['transactions'],
        country_codes: ['US'],
        language: 'en',
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { error: `Plaid error ${res.status}: ${body.slice(0, 100)}` };
    }

    const data: { link_token: string } = await res.json();
    return { linkToken: data.link_token };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create link token' };
  }
}

export async function completePlaidLink(input: {
  publicToken: string;
  institutionName: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const tenant = await requireTenant();
    const db = getDb();

    const clientId = process.env.PLAID_CLIENT_ID;
    const secret = process.env.PLAID_SECRET;
    if (!clientId || !secret) {
      return { success: false, error: 'PLAID_CLIENT_ID and PLAID_SECRET not configured' };
    }

    const plaidEnv = process.env.PLAID_ENV ?? 'sandbox';
    const plaidBase = plaidEnv === 'production'
      ? 'https://production.plaid.com'
      : plaidEnv === 'development'
        ? 'https://development.plaid.com'
        : 'https://sandbox.plaid.com';

    // Exchange public token for access token
    const exchangeRes = await fetch(`${plaidBase}/item/public_token/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        secret,
        public_token: input.publicToken,
      }),
    });

    if (!exchangeRes.ok) {
      const body = await exchangeRes.text();
      return { success: false, error: `Plaid exchange failed: ${body.slice(0, 100)}` };
    }

    const exchangeData: { access_token: string; item_id: string } = await exchangeRes.json();

    // Encrypt and store the access token
    const tokenPayload = JSON.stringify({ access_token: exchangeData.access_token });
    const { encrypted, iv, authTag } = await encryptTokens(tokenPayload);

    await withTenant(db, tenant, async (tx) => {
      await tx.insert(connection).values({
        accountId: tenant.accountId,
        createdBy: tenant.userId,
        provider: 'plaid',
        kind: 'bank',
        externalAccountRef: input.institutionName,
        status: 'healthy',
        accessTokenEnc: encrypted,
        tokenIv: iv,
        tokenAuthTag: authTag,
      });
    });

    revalidatePath('/finances/overview');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to complete Plaid link' };
  }
}

// ---------------------------------------------------------------------------
// Monarch Money flow
// ---------------------------------------------------------------------------

export async function connectMonarch(input: {
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const tenant = await requireTenant();
    const db = getDb();

    // Authenticate with Monarch Money
    const loginRes = await fetch('https://api.monarchmoney.com/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
      }),
    });

    if (!loginRes.ok) {
      const body = await loginRes.text();
      return { success: false, error: `Monarch login failed: ${body.slice(0, 100)}` };
    }

    const loginData: { token: string } = await loginRes.json();
    if (!loginData.token) {
      return { success: false, error: 'No session token returned from Monarch' };
    }

    // Encrypt and store the session token
    const tokenPayload = JSON.stringify({ session_token: loginData.token });
    const { encrypted, iv, authTag } = await encryptTokens(tokenPayload);

    await withTenant(db, tenant, async (tx) => {
      await tx.insert(connection).values({
        accountId: tenant.accountId,
        createdBy: tenant.userId,
        provider: 'monarch',
        kind: 'bank',
        externalAccountRef: input.email,
        status: 'healthy',
        accessTokenEnc: encrypted,
        tokenIv: iv,
        tokenAuthTag: authTag,
      });
    });

    revalidatePath('/finances/overview');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to connect Monarch' };
  }
}

// ---------------------------------------------------------------------------
// Manual account creation
// ---------------------------------------------------------------------------

export async function createManualAccount(input: {
  name: string;
  institution?: string;
  kind: string;
  balance: number;
  entityName?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const tenant = await requireTenant();
    const db = getDb();

    const balanceCents = String(Math.round(input.balance * 100));

    await withTenant(db, tenant, async (tx) => {
      await tx.insert(financialAccount).values({
        accountId: tenant.accountId,
        createdBy: tenant.userId,
        name: input.name,
        institution: input.institution ?? null,
        kind: input.kind,
        balance: balanceCents,
        entityName: input.entityName ?? null,
        state: 'healthy',
        currency: 'USD',
      });
    });

    revalidatePath('/finances/overview');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to create account' };
  }
}
