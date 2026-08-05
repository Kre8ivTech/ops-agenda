/**
 * /api/finances/plaid/link-token — Creates a Plaid Link token for the client-side SDK.
 */

import { getSession } from '@/lib/auth';
import { createLinkToken } from '@/lib/finances/connectors/plaid';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getSession();
  if (!session?.accountId || !session?.userId) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
    return Response.json(
      { error: 'Plaid is not configured. Contact your administrator.' },
      { status: 503 },
    );
  }

  try {
    const linkToken = await createLinkToken(session.userId);
    return Response.json({ linkToken });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create link token';
    return Response.json({ error: message }, { status: 500 });
  }
}
