/**
 * /api/finances/plaid/exchange — Exchanges a Plaid public_token for an access_token
 * after the user completes Plaid Link on the client side.
 */

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { createDb, withTenant } from '@/lib/db';
import { connection } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { encryptTokens } from '@/lib/connectors';
import { exchangePublicToken, syncAccounts } from '@/lib/finances/connectors/plaid';
import { financialAccount } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.accountId || !session?.userId) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const { publicToken, institutionName } = body;

  if (!publicToken) {
    return Response.json({ error: 'Missing public_token' }, { status: 400 });
  }

  try {
    // Exchange public token for access token
    const { accessToken, itemId } = await exchangePublicToken(publicToken);

    // Encrypt the access token for storage
    const tokenPayload = JSON.stringify({ access_token: accessToken, item_id: itemId });
    const { encrypted, iv, authTag } = await encryptTokens(tokenPayload);

    const tenant = { accountId: session.accountId!, userId: session.userId! };
    const db = createDb(env.DATABASE_URL);

    // Store as a connection (kind = 'bank')
    await withTenant(db, tenant, async (tx) => {
      await tx.insert(connection).values({
        accountId: tenant.accountId,
        createdBy: tenant.userId,
        provider: 'plaid',
        kind: 'bank',
        externalAccountRef: institutionName ?? 'Bank Account',
        status: 'healthy',
        accessTokenEnc: encrypted,
        tokenIv: iv,
        tokenAuthTag: authTag,
      });
    });

    // Immediately sync accounts from Plaid
    try {
      const accounts = await syncAccounts(accessToken);

      await withTenant(db, tenant, async (tx) => {
        for (const acct of accounts) {
          await tx.insert(financialAccount).values({
            accountId: tenant.accountId,
            name: acct.name ?? acct.official_name ?? 'Account',
            institution: institutionName ? `${institutionName} →${acct.mask ?? ''}` : null,
            balance: String(Math.round((acct.balances?.current ?? 0) * 100)),
            kind: acct.type ?? 'checking',
            state: 'healthy',
          }).onConflictDoNothing();
        }
      });
    } catch {
      // Account sync failed but connection is saved — will retry on next sync
    }

    revalidatePath('/finances/overview');
    revalidatePath('/finances/connect');

    return Response.json({ success: true, institutionName, accountCount: 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token exchange failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
