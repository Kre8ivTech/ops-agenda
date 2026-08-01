/**
 * /api/connectors/callback — OAuth callback handler.
 *
 * Receives the authorization code, exchanges it for tokens, encrypts them,
 * and creates connection records in the database.
 */

import { eq, and, isNull } from 'drizzle-orm';
import { createDb, withTenant } from '@/lib/db';
import { connection, oauthState } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { encryptTokens } from '@/lib/connectors';
import { MicrosoftConnector } from '@/lib/connectors/microsoft';
import { GoogleConnector } from '@/lib/connectors/google';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  const appUrl = env.APP_URL ?? env.NEXT_PUBLIC_APP_URL;

  if (error) {
    return Response.redirect(
      `${appUrl}/settings/connections?error=${encodeURIComponent(errorDescription ?? error)}`,
    );
  }

  if (!code || !state) {
    return Response.redirect(`${appUrl}/settings/connections?error=missing_params`);
  }

  const db = createDb(env.DATABASE_URL);

  // Look up the OAuth state record
  const [stateRecord] = await db
    .select()
    .from(oauthState)
    .where(and(eq(oauthState.state, state), isNull(oauthState.consumedAt)));

  if (!stateRecord) {
    return Response.redirect(`${appUrl}/settings/connections?error=invalid_state`);
  }

  // Mark state as consumed
  await db
    .update(oauthState)
    .set({ consumedAt: new Date() })
    .where(eq(oauthState.id, stateRecord.id));

  // Check if state is expired (5 min TTL)
  const age = Date.now() - stateRecord.createdAt.getTime();
  if (age > 5 * 60 * 1000) {
    return Response.redirect(`${appUrl}/settings/connections?error=state_expired`);
  }

  try {
    // Exchange code for tokens based on provider
    let tokens: { accessToken: string; refreshToken: string; expiresIn: number; email: string };

    switch (stateRecord.provider) {
      case 'microsoft':
        tokens = await MicrosoftConnector.exchangeCode(code, stateRecord.codeVerifier ?? undefined);
        break;
      case 'google':
        tokens = await GoogleConnector.exchangeCode(code, stateRecord.codeVerifier ?? undefined);
        break;
      default:
        return Response.redirect(`${appUrl}/settings/connections?error=unknown_provider`);
    }

    // Encrypt tokens for at-rest storage
    const tokenPayload = JSON.stringify({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
    const { encrypted, iv, authTag } = await encryptTokens(tokenPayload);

    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
    const tenant = { accountId: stateRecord.accountId, userId: stateRecord.userId };
    const kinds = stateRecord.kinds ?? ['mail'];

    // Create connection records (one per kind)
    await withTenant(db, tenant, async (tx) => {
      for (const kind of kinds) {
        await tx.insert(connection).values({
          accountId: stateRecord.accountId,
          createdBy: stateRecord.userId,
          provider: stateRecord.provider,
          kind: kind as 'mail' | 'calendar',
          externalAccountRef: tokens.email,
          scopes:
            stateRecord.provider === 'microsoft'
              ? ['Mail.Read', 'Calendars.Read']
              : ['gmail.readonly', 'calendar.readonly'],
          status: 'healthy',
          accessTokenEnc: encrypted,
          refreshTokenEnc: encrypted, // Same blob contains both
          tokenIv: iv,
          tokenAuthTag: authTag,
          tokenExpiresAt: expiresAt,
        });
      }
    });

    return Response.redirect(`${appUrl}/settings/connections?success=connected`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'token_exchange_failed';
    return Response.redirect(
      `${appUrl}/settings/connections?error=${encodeURIComponent(message)}`,
    );
  }
}
