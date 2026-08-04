/**
 * /api/connectors/shared-mailboxes — Discovers shared/delegated mailboxes
 * accessible to the user from their connected Microsoft/Google accounts.
 */

import { and, eq, isNull } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { createDb, withTenant } from '@/lib/db';
import { connection } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { decryptTokens } from '@/lib/connectors';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session?.accountId || !session?.userId) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const tenant = { accountId: session.accountId, userId: session.userId };
  const db = createDb(env.DATABASE_URL);

  // Get mail connections
  const conns = await withTenant(db, tenant, async (tx) =>
    tx.select().from(connection)
      .where(and(eq(connection.kind, 'mail'), isNull(connection.deletedAt))),
  );

  const sharedMailboxes: { provider: string; email: string; displayName: string; connectionId: string }[] = [];

  for (const conn of conns) {
    if (!conn.accessTokenEnc || !conn.tokenIv || !conn.tokenAuthTag) continue;

    let accessToken: string;
    try {
      const decrypted = await decryptTokens(conn.accessTokenEnc, conn.tokenIv, conn.tokenAuthTag);
      accessToken = JSON.parse(decrypted).access_token;
    } catch { continue; }

    if (conn.provider === 'microsoft') {
      try {
        // Discover shared mailboxes via Microsoft Graph
        // Uses the /me/mailFolders endpoint + shared folder discovery
        const res = await fetch(
          'https://graph.microsoft.com/v1.0/me/people?$filter=personType/subclass eq \'OrganizationUser\'&$top=50&$select=displayName,scoredEmailAddresses',
          { headers: { authorization: `Bearer ${accessToken}` } },
        );

        if (res.ok) {
          const data = await res.json();
          // Also try the findRooms endpoint for shared mailboxes
          const roomsRes = await fetch(
            'https://graph.microsoft.com/v1.0/me/findRooms',
            { headers: { authorization: `Bearer ${accessToken}` } },
          );

          // Try getting shared mailbox folders directly
          const sharedRes = await fetch(
            'https://graph.microsoft.com/v1.0/me/mailFolders?$filter=isHidden eq false&$top=50',
            { headers: { authorization: `Bearer ${accessToken}` } },
          );

          if (sharedRes.ok) {
            const sharedData = await sharedRes.json();
            // Shared mailboxes typically show up as additional mail folders
            // or can be discovered via /users if admin consent is granted
          }
        }

        // Simpler approach: try to list other mailboxes the user has access to
        // via the /me/memberOf → shared mailbox groups
        const groupRes = await fetch(
          'https://graph.microsoft.com/v1.0/me/memberOf?$select=displayName,mail,groupTypes',
          { headers: { authorization: `Bearer ${accessToken}` } },
        );

        if (groupRes.ok) {
          const groupData = await groupRes.json();
          for (const group of groupData.value ?? []) {
            if (group.mail && group['@odata.type'] === '#microsoft.graph.group') {
              sharedMailboxes.push({
                provider: 'microsoft',
                email: group.mail,
                displayName: group.displayName ?? group.mail,
                connectionId: conn.id,
              });
            }
          }
        }
      } catch { /* Graph API error — skip */ }
    }
  }

  return Response.json({ sharedMailboxes });
}
