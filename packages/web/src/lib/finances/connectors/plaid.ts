// Plaid Link integration
// Requires: PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV (sandbox/production)
// Flow: createLinkToken -> user completes Link -> exchangePublicToken -> sync accounts/transactions

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  const env = process.env.PLAID_ENV ?? 'sandbox';
  if (env === 'production') {
    return 'https://production.plaid.com';
  }
  return 'https://sandbox.plaid.com';
}

function getCredentials(): { clientId: string; secret: string } {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  if (!clientId || !secret) {
    throw new Error(
      'Missing Plaid credentials: PLAID_CLIENT_ID and PLAID_SECRET must be set',
    );
  }
  return { clientId, secret };
}

async function plaidRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const { clientId, secret } = getCredentials();
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'PLAID-CLIENT-ID': clientId,
      'PLAID-SECRET': secret,
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
