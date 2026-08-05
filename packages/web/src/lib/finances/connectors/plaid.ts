// Plaid Link integration
// Primary: Loads credentials from Admin → Integrations (integration_credential table)
// Fallback: PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV environment variables
// Flow: createLinkToken -> user completes Link -> exchangePublicToken -> sync accounts/transactions

import { eq, and } from 'drizzle-orm';
import { createDb } from '@/lib/db';
import { integrationCredential } from '@/lib/db/schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlaidAccount {
  account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  balances: {
    available: number | null;
    current: number | null;
    limit: number | null;
    iso_currency_code: string | null;
  };
  mask: string | null;
}

export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  date: string;
  name: string;
  merchant_name: string | null;
  amount: number;
  iso_currency_code: string | null;
  category: string[] | null;
  pending: boolean;
}

interface PlaidConfig {
  clientId: string;
  secret: string;
  environment: string;
}

// ---------------------------------------------------------------------------
// Credential Loading — from integration_credential table (encrypted)
// ---------------------------------------------------------------------------

async function getDecryptionKey(): Promise<CryptoKey> {
  const raw = process.env.SESSION_SECRET;
  if (!raw || raw.length < 32) throw new Error('SESSION_SECRET not configured');
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(raw.slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  );
}

async function loadConfigFromDb(): Promise<PlaidConfig | null> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;

  try {
    const db = createDb(dbUrl);
    const [cred] = await db
      .select()
      .from(integrationCredential)
      .where(and(eq(integrationCredential.provider, 'plaid'), eq(integrationCredential.enabled, true)));

    if (!cred) return null;

    // Decrypt the credential payload
    const key = await getDecryptionKey();
    const iv = Buffer.from(cred.iv, 'base64');
    const ct = Buffer.from(cred.encryptedPayload, 'base64');
    const tag = Buffer.from(cred.authTag, 'base64');
    const combined = new Uint8Array(ct.length + tag.length);
    combined.set(ct, 0);
    combined.set(tag, ct.length);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined);
    const parsed = JSON.parse(new TextDecoder().decode(decrypted));

    return {
      clientId: parsed.client_id ?? parsed.clientId ?? '',
      secret: parsed.secret ?? parsed.client_secret ?? '',
      environment: parsed.environment ?? 'sandbox',
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let cachedConfig: PlaidConfig | null = null;

async function getConfig(): Promise<PlaidConfig> {
  // Try DB first (Admin → Integrations)
  if (!cachedConfig) {
    cachedConfig = await loadConfigFromDb();
  }

  if (cachedConfig && cachedConfig.clientId && cachedConfig.secret) {
    return cachedConfig;
  }

  // Fallback to env vars
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const environment = process.env.PLAID_ENV ?? 'sandbox';

  if (clientId && secret) {
    cachedConfig = { clientId, secret, environment };
    return cachedConfig;
  }

  throw new Error('Plaid not configured. Add credentials in Admin → Integrations or set PLAID_CLIENT_ID/PLAID_SECRET env vars.');
}

function getBaseUrl(environment: string): string {
  if (environment === 'production') return 'https://production.plaid.com';
  if (environment === 'development') return 'https://development.plaid.com';
  return 'https://sandbox.plaid.com';
}

async function plaidRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const config = await getConfig();
  const baseUrl = getBaseUrl(config.environment);

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'PLAID-CLIENT-ID': config.clientId,
      'PLAID-SECRET': config.secret,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = (await response.json()) as { error_message?: string; error_code?: string };
    throw new Error(
      `Plaid API error (${response.status}): ${error.error_message ?? error.error_code ?? 'Unknown error'}`,
    );
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates a Plaid Link token for the given user.
 * The client uses this token to initialize Plaid Link UI.
 */
export async function createLinkToken(userId: string): Promise<string> {
  const result = await plaidRequest<{ link_token: string }>('/link/token/create', {
    user: { client_user_id: userId },
    client_name: 'Ops Agenda',
    products: ['transactions'],
    country_codes: ['US'],
    language: 'en',
  });

  return result.link_token;
}

/**
 * Exchanges a public token (received after user completes Link) for an access token.
 */
export async function exchangePublicToken(
  publicToken: string,
): Promise<{ accessToken: string; itemId: string }> {
  const result = await plaidRequest<{ access_token: string; item_id: string }>(
    '/item/public_token/exchange',
    { public_token: publicToken },
  );

  return { accessToken: result.access_token, itemId: result.item_id };
}

/**
 * Fetches all accounts associated with the given access token.
 */
export async function syncAccounts(accessToken: string): Promise<PlaidAccount[]> {
  const result = await plaidRequest<{ accounts: PlaidAccount[] }>('/accounts/get', {
    access_token: accessToken,
  });

  return result.accounts;
}

/**
 * Fetches transactions for a date range using the /transactions/get endpoint.
 */
export async function syncTransactions(
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<PlaidTransaction[]> {
  const allTransactions: PlaidTransaction[] = [];
  let totalTransactions = 0;
  let offset = 0;

  // Plaid returns paginated results; loop until we have all transactions.
  do {
    const result = await plaidRequest<{
      transactions: PlaidTransaction[];
      total_transactions: number;
    }>('/transactions/get', {
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      options: { offset, count: 500 },
    });

    allTransactions.push(...result.transactions);
    totalTransactions = result.total_transactions;
    offset = allTransactions.length;
  } while (allTransactions.length < totalTransactions);

  return allTransactions;
}
