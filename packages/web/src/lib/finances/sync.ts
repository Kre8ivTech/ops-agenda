'use server';

import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { createDb, withTenant } from '@/lib/db';
import { financialAccount, financialTransaction, connection } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { decryptTokens } from '@/lib/connectors';

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

function parseTokenPayload(decrypted: string): Record<string, string> {
  try {
    return JSON.parse(decrypted);
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Plaid sync helpers
// ---------------------------------------------------------------------------

interface PlaidAccount {
  account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  balances: { current: number | null; available: number | null };
  mask: string | null;
}

interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  name: string;
  amount: number;
  date: string;
  category: string[] | null;
  pending: boolean;
}

async function syncPlaidConnection(
  conn: typeof connection.$inferSelect,
  tenant: { accountId: string; userId: string },
  db: ReturnType<typeof createDb>,
): Promise<{ synced: number }> {
  if (!conn.accessTokenEnc || !conn.tokenIv || !conn.tokenAuthTag) {
    throw new Error('No access token stored');
  }

  const decrypted = await decryptTokens(conn.accessTokenEnc, conn.tokenIv, conn.tokenAuthTag);
  const payload = parseTokenPayload(decrypted);
  const accessToken = payload.access_token;
  if (!accessToken) throw new Error('No Plaid access_token in payload');

  const plaidEnv = process.env.PLAID_ENV ?? 'sandbox';
  const plaidBase = plaidEnv === 'production'
    ? 'https://production.plaid.com'
    : plaidEnv === 'development'
      ? 'https://development.plaid.com'
      : 'https://sandbox.plaid.com';

  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  if (!clientId || !secret) throw new Error('PLAID_CLIENT_ID or PLAID_SECRET not configured');

  // Fetch accounts
  const accountsRes = await fetch(`${plaidBase}/accounts/get`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, secret, access_token: accessToken }),
  });
  if (!accountsRes.ok) throw new Error(`Plaid accounts ${accountsRes.status}: ${(await accountsRes.text()).slice(0, 80)}`);
  const accountsData: { accounts: PlaidAccount[] } = await accountsRes.json();

  // Upsert accounts
  const accountIdMap = new Map<string, string>(); // plaid account_id -> our financial_account.id
  await withTenant(db, tenant, async (tx) => {
    for (const acct of accountsData.accounts) {
      const kind = acct.type === 'credit' ? 'credit_card' : acct.type === 'investment' ? 'investment' : 'checking';
      const balanceCents = String(Math.round((acct.balances.current ?? 0) * 100));
      const institutionLabel = acct.mask ? `${acct.name} →${acct.mask}` : acct.name;

      const [upserted] = await tx.insert(financialAccount).values({
        accountId: tenant.accountId,
        createdBy: tenant.userId,
        name: acct.official_name ?? acct.name,
        institution: institutionLabel,
        balance: balanceCents,
        kind,
        state: 'healthy',
        currency: 'USD',
      }).onConflictDoUpdate({
        target: [financialAccount.id],
        set: {
          balance: balanceCents,
          updatedAt: new Date(),
        },
      }).returning({ id: financialAccount.id });

      if (upserted) {
        accountIdMap.set(acct.account_id, upserted.id);
      }
    }
  });

  // Fetch transactions (last 30 days)
  const now = new Date();
  const startDate = new Date(now.getTime() - 30 * 86400000);
  const txnRes = await fetch(`${plaidBase}/transactions/get`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      secret,
      access_token: accessToken,
      start_date: startDate.toISOString().slice(0, 10),
      end_date: now.toISOString().slice(0, 10),
    }),
  });
  if (!txnRes.ok) throw new Error(`Plaid transactions ${txnRes.status}: ${(await txnRes.text()).slice(0, 80)}`);
  const txnData: { transactions: PlaidTransaction[] } = await txnRes.json();

  let synced = 0;
  await withTenant(db, tenant, async (tx) => {
    for (const txn of txnData.transactions) {
      const financialAccountId = accountIdMap.get(txn.account_id);
      if (!financialAccountId) continue;

      const amountCents = String(Math.abs(Math.round(txn.amount * 100)));
      const direction = txn.amount < 0 ? 'in' : 'out'; // Plaid: negative = income
      const category = txn.category?.[0] ?? null;

      await tx.insert(financialTransaction).values({
        accountId: tenant.accountId,
        createdBy: tenant.userId,
        financialAccountId,
        description: txn.name,
        amount: amountCents,
        direction,
        status: txn.pending ? 'projected' : 'committed',
        dueOn: new Date(txn.date),
        category,
      }).onConflictDoNothing();

      synced++;
    }
  });

  return { synced };
}

// ---------------------------------------------------------------------------
// Monarch sync helpers
// ---------------------------------------------------------------------------

interface MonarchAccount {
  id: string;
  displayName: string;
  institution?: { name: string };
  currentBalance: number;
  type?: { name: string };
}

interface MonarchTransaction {
  id: string;
  accountId: string;
  merchant?: { name: string };
  amount: number;
  date: string;
  category?: { name: string };
  pending: boolean;
}

async function syncMonarchConnection(
  conn: typeof connection.$inferSelect,
  tenant: { accountId: string; userId: string },
  db: ReturnType<typeof createDb>,
): Promise<{ synced: number }> {
  if (!conn.accessTokenEnc || !conn.tokenIv || !conn.tokenAuthTag) {
    throw new Error('No session token stored');
  }

  const decrypted = await decryptTokens(conn.accessTokenEnc, conn.tokenIv, conn.tokenAuthTag);
  const payload = parseTokenPayload(decrypted);
  const sessionToken = payload.session_token;
  if (!sessionToken) throw new Error('No Monarch session_token in payload');

  // Monarch Money uses a GraphQL API
  const monarchBase = 'https://api.monarchmoney.com/graphql';

  // Fetch accounts
  const accountsRes = await fetch(monarchBase, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${sessionToken}`,
    },
    body: JSON.stringify({
      query: `{ accounts { id displayName institution { name } currentBalance type { name } } }`,
    }),
  });
  if (!accountsRes.ok) throw new Error(`Monarch accounts ${accountsRes.status}`);
  const accountsJson = await accountsRes.json();
  const monarchAccounts: MonarchAccount[] = accountsJson?.data?.accounts ?? [];

  const accountIdMap = new Map<string, string>();
  await withTenant(db, tenant, async (tx) => {
    for (const acct of monarchAccounts) {
      const kind = acct.type?.name === 'credit card' ? 'credit_card' : 'checking';
      const balanceCents = String(Math.round(acct.currentBalance * 100));

      const [upserted] = await tx.insert(financialAccount).values({
        accountId: tenant.accountId,
        createdBy: tenant.userId,
        name: acct.displayName,
        institution: acct.institution?.name ?? null,
        balance: balanceCents,
        kind,
        state: 'healthy',
        currency: 'USD',
      }).onConflictDoUpdate({
        target: [financialAccount.id],
        set: {
          balance: balanceCents,
          updatedAt: new Date(),
        },
      }).returning({ id: financialAccount.id });

      if (upserted) {
        accountIdMap.set(acct.id, upserted.id);
      }
    }
  });

  // Fetch transactions (last 30 days)
  const now = new Date();
  const startDate = new Date(now.getTime() - 30 * 86400000);
  const txnRes = await fetch(monarchBase, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${sessionToken}`,
    },
    body: JSON.stringify({
      query: `query($startDate: Date!, $endDate: Date!) {
        transactions(startDate: $startDate, endDate: $endDate) {
          id accountId merchant { name } amount date category { name } pending
        }
      }`,
      variables: {
        startDate: startDate.toISOString().slice(0, 10),
        endDate: now.toISOString().slice(0, 10),
      },
    }),
  });
  if (!txnRes.ok) throw new Error(`Monarch transactions ${txnRes.status}`);
  const txnJson = await txnRes.json();
  const monarchTransactions: MonarchTransaction[] = txnJson?.data?.transactions ?? [];

  let synced = 0;
  await withTenant(db, tenant, async (tx) => {
    for (const txn of monarchTransactions) {
      const financialAccountId = accountIdMap.get(txn.accountId);
      if (!financialAccountId) continue;

      const amountCents = String(Math.abs(Math.round(txn.amount * 100)));
      const direction = txn.amount < 0 ? 'out' : 'in';
      const category = txn.category?.name ?? null;

      await tx.insert(financialTransaction).values({
        accountId: tenant.accountId,
        createdBy: tenant.userId,
        financialAccountId,
        description: txn.merchant?.name ?? 'Unknown',
        amount: amountCents,
        direction,
        status: txn.pending ? 'projected' : 'committed',
        dueOn: new Date(txn.date),
        category,
      }).onConflictDoNothing();

      synced++;
    }
  });

  return { synced };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function syncFinanceAccounts(): Promise<{ synced: number; errors: string[] }> {
  const tenant = await requireTenant();
  const db = getDb();
  const errors: string[] = [];
  let synced = 0;

  const conns = await withTenant(db, tenant, async (tx) =>
    tx.select().from(connection).where(
      and(
        eq(connection.accountId, tenant.accountId),
        isNull(connection.deletedAt),
      ),
    ),
  );

  // Filter to bank/card connections
  const financeConns = conns.filter((c) => c.kind === 'bank' || c.kind === 'card');

  for (const conn of financeConns) {
    try {
      if (conn.provider === 'plaid') {
        const result = await syncPlaidConnection(conn, tenant, db);
        synced += result.synced;
      } else if (conn.provider === 'monarch') {
        const result = await syncMonarchConnection(conn, tenant, db);
        synced += result.synced;
      } else {
        errors.push(`${conn.provider}: unsupported finance provider`);
        continue;
      }

      // Mark connection healthy
      await withTenant(db, tenant, async (tx) => {
        await tx.update(connection).set({
          lastSyncAt: new Date(),
          status: 'healthy',
          lastErrorCode: null,
        }).where(eq(connection.id, conn.id));
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`${conn.provider}: ${msg}`);
      await withTenant(db, tenant, async (tx) => {
        await tx.update(connection).set({
          status: 'degraded',
          lastErrorCode: msg.slice(0, 100),
        }).where(eq(connection.id, conn.id));
      });
    }
  }

  revalidatePath('/finances/overview');
  return { synced, errors };
}

// ---------------------------------------------------------------------------
// CSV Import
// ---------------------------------------------------------------------------

interface CsvRow {
  date: string;
  description: string;
  amount: string;
  direction?: string;
  category?: string;
}

function parseCsvContent(csvContent: string): CsvRow[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

  const dateIdx = headers.findIndex((h) => h === 'date' || h === 'transaction date' || h === 'posted date');
  const descIdx = headers.findIndex((h) => h === 'description' || h === 'memo' || h === 'name' || h === 'payee');
  const amountIdx = headers.findIndex((h) => h === 'amount' || h === 'transaction amount');
  const directionIdx = headers.findIndex((h) => h === 'direction' || h === 'type' || h === 'debit/credit');
  const categoryIdx = headers.findIndex((h) => h === 'category');

  if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
    return [];
  }

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    if (!cols[dateIdx] || !cols[amountIdx]) continue;

    rows.push({
      date: cols[dateIdx],
      description: cols[descIdx] ?? 'Unknown',
      amount: cols[amountIdx],
      direction: directionIdx >= 0 ? cols[directionIdx] : undefined,
      category: categoryIdx >= 0 ? cols[categoryIdx] : undefined,
    });
  }

  return rows;
}

export async function importCsvTransactions(input: {
  accountId: string;
  csvContent: string;
}): Promise<{ imported: number; errors: string[] }> {
  const tenant = await requireTenant();
  const db = getDb();
  const errors: string[] = [];
  let imported = 0;

  // Validate the account exists and belongs to tenant
  const [account] = await withTenant(db, tenant, async (tx) =>
    tx.select({ id: financialAccount.id })
      .from(financialAccount)
      .where(
        and(
          eq(financialAccount.id, input.accountId),
          eq(financialAccount.accountId, tenant.accountId),
        ),
      ),
  );

  if (!account) {
    return { imported: 0, errors: ['Account not found or does not belong to you'] };
  }

  const rows = parseCsvContent(input.csvContent);
  if (rows.length === 0) {
    return { imported: 0, errors: ['No valid rows found. CSV must have date, description, and amount columns.'] };
  }

  await withTenant(db, tenant, async (tx) => {
    for (const row of rows) {
      try {
        const rawAmount = parseFloat(row.amount.replace(/[$,]/g, ''));
        if (isNaN(rawAmount)) {
          errors.push(`Invalid amount "${row.amount}" for "${row.description}"`);
          continue;
        }

        const amountCents = String(Math.abs(Math.round(rawAmount * 100)));
        let direction: 'in' | 'out';

        if (row.direction) {
          const d = row.direction.toLowerCase();
          direction = d === 'credit' || d === 'in' || d === 'deposit' ? 'in' : 'out';
        } else {
          direction = rawAmount < 0 ? 'out' : 'in';
        }

        const dueOn = new Date(row.date);
        if (isNaN(dueOn.getTime())) {
          errors.push(`Invalid date "${row.date}" for "${row.description}"`);
          continue;
        }

        await tx.insert(financialTransaction).values({
          accountId: tenant.accountId,
          createdBy: tenant.userId,
          financialAccountId: input.accountId,
          description: row.description,
          amount: amountCents,
          direction,
          status: 'committed',
          dueOn,
          category: row.category ?? null,
        });

        imported++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown';
        errors.push(`Row "${row.description}": ${msg}`);
      }
    }
  });

  revalidatePath('/finances/overview');
  return { imported, errors };
}
