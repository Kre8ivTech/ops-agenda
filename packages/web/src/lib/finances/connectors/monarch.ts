// Monarch Money integration
// Uses GraphQL API at https://api.monarchmoney.com/graphql with session token auth.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MonarchAccount {
  id: string;
  displayName: string;
  institution: string;
  currentBalance: number;
  type: string;
  subtype: string;
}

export interface MonarchTransaction {
  id: string;
  date: string;
  amount: number;
  merchant: string;
  category: string;
  account: string;
  notes: string;
}

export interface MonarchCashflow {
  income: number;
  expense: number;
  savings: number;
  savingsRate: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONARCH_API_URL = 'https://api.monarchmoney.com/graphql';
const MONARCH_LOGIN_URL = 'https://api.monarchmoney.com/auth/login/';

async function monarchGraphQL<T>(
  token: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(MONARCH_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `Monarch Money API error (${response.status}): ${response.statusText}`,
    );
  }

  const json = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };

  if (json.errors && json.errors.length > 0) {
    throw new Error(`Monarch Money GraphQL error: ${json.errors[0].message}`);
  }

  if (!json.data) {
    throw new Error('Monarch Money API returned no data');
  }

  return json.data;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Authenticates with Monarch Money and returns a session token.
 */
export async function monarchLogin(
  email: string,
  password: string,
): Promise<{ token: string }> {
  const response = await fetch(MONARCH_LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(
      `Monarch Money login failed (${response.status}): ${response.statusText}`,
    );
  }

  const data = (await response.json()) as { token?: string };

  if (!data.token) {
    throw new Error('Monarch Money login did not return a token');
  }

  return { token: data.token };
}

/**
 * Fetches all financial accounts from Monarch Money.
 */
export async function monarchGetAccounts(token: string): Promise<MonarchAccount[]> {
  const query = `
    query GetAccounts {
      accounts {
        id
        displayName
        institution {
          name
        }
        currentBalance
        type {
          name
        }
        subtype {
          name
        }
      }
    }
  `;

  interface RawAccount {
    id: string;
    displayName: string;
    institution: { name: string } | null;
    currentBalance: number;
    type: { name: string } | null;
    subtype: { name: string } | null;
  }

  const data = await monarchGraphQL<{ accounts: RawAccount[] }>(token, query);

  return data.accounts.map((acct) => ({
    id: acct.id,
    displayName: acct.displayName,
    institution: acct.institution?.name ?? '',
    currentBalance: acct.currentBalance,
    type: acct.type?.name ?? '',
    subtype: acct.subtype?.name ?? '',
  }));
}

/**
 * Fetches transactions from Monarch Money with optional filters.
 */
export async function monarchGetTransactions(
  token: string,
  options?: { limit?: number; startDate?: string; endDate?: string },
): Promise<MonarchTransaction[]> {
  const query = `
    query GetTransactions($limit: Int, $startDate: String, $endDate: String) {
      transactions(limit: $limit, startDate: $startDate, endDate: $endDate) {
        id
        date
        amount
        merchant {
          name
        }
        category {
          name
        }
        account {
          displayName
        }
        notes
      }
    }
  `;

  interface RawTransaction {
    id: string;
    date: string;
    amount: number;
    merchant: { name: string } | null;
    category: { name: string } | null;
    account: { displayName: string } | null;
    notes: string | null;
  }

  const variables: Record<string, unknown> = {};
  if (options?.limit !== undefined) variables.limit = options.limit;
  if (options?.startDate) variables.startDate = options.startDate;
  if (options?.endDate) variables.endDate = options.endDate;

  const data = await monarchGraphQL<{ transactions: RawTransaction[] }>(
    token,
    query,
    variables,
  );

  return data.transactions.map((tx) => ({
    id: tx.id,
    date: tx.date,
    amount: tx.amount,
    merchant: tx.merchant?.name ?? '',
    category: tx.category?.name ?? '',
    account: tx.account?.displayName ?? '',
    notes: tx.notes ?? '',
  }));
}

/**
 * Fetches cashflow summary for the given date range.
 */
export async function monarchGetCashflow(
  token: string,
  startDate: string,
  endDate: string,
): Promise<MonarchCashflow> {
  const query = `
    query GetCashflow($startDate: String!, $endDate: String!) {
      cashflow(startDate: $startDate, endDate: $endDate) {
        income
        expense
        savings
        savingsRate
      }
    }
  `;

  const data = await monarchGraphQL<{ cashflow: MonarchCashflow }>(token, query, {
    startDate,
    endDate,
  });

  return data.cashflow;
}
