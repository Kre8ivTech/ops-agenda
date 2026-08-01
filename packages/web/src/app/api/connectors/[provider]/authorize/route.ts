/**
 * /api/connectors/[provider]/authorize — Initiates OAuth flow for a connector.
 *
 * Generates a state token, stores it in oauth_state, and redirects to the provider.
 */

import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { createDb, withTenant } from '@/lib/db';
import { oauthState } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { MicrosoftConnector } from '@/lib/connectors/microsoft';
import { GoogleConnector } from '@/lib/connectors/google';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const session = await getSession();

  if (!session?.accountId || !session?.userId) {
    return Response.redirect(new URL('/auth/signin', request.url));
  }

  // Generate PKCE and state
  const stateValue = Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString('base64url');
  const codeVerifier = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');

  // Store in oauth_state table
  const db = createDb(env.DATABASE_URL);
  await db.insert(oauthState).values({
    accountId: session.accountId,
    userId: session.userId,
    provider,
    state: stateValue,
    codeVerifier,
    kinds: provider === 'microsoft' || provider === 'google' ? ['mail', 'calendar'] : ['mail'],
  });

  // Generate authorization URL
  let authUrl: string;
  switch (provider) {
    case 'microsoft':
      authUrl = await MicrosoftConnector.getAuthorizationUrl(stateValue, codeVerifier);
      break;
    case 'google':
      authUrl = await GoogleConnector.getAuthorizationUrl(stateValue, codeVerifier);
      break;
    default:
      return new Response(`Unknown provider: ${provider}`, { status: 400 });
  }

  return Response.redirect(authUrl);
}
