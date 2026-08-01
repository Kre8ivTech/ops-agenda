/**
 * lib/connectors/microsoft.ts — Office 365 OAuth2 connector.
 *
 * Uses Microsoft Identity Platform (v2.0) for OAuth with PKCE.
 * Scopes: Mail.Read, Calendars.Read (read-only access to mail + calendar).
 */

import { eq, and } from 'drizzle-orm';
import { createDb } from '@/lib/db';
import { integrationCredential } from '@/lib/db/schema';
import { env } from '@/lib/env';

const AUTHORITY = 'https://login.microsoftonline.com/common/oauth2/v2.0';
const SCOPES = ['openid', 'profile', 'email', 'offline_access', 'Mail.Read', 'Calendars.Read'];

export interface MicrosoftOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

async function loadConfig(): Promise<MicrosoftOAuthConfig> {
  const db = createDb(env.DATABASE_URL);
  const [cred] = await db
    .select()
    .from(integrationCredential)
    .where(and(eq(integrationCredential.provider, 'office365'), eq(integrationCredential.enabled, true)));

  if (!cred) {
    throw new Error('Office 365 integration credentials not configured. Add them in Admin → Integrations.');
  }

  // Decrypt the credential
  const key = await getDecryptionKey();
  const iv = Buffer.from(cred.iv, 'base64');
  const ct = Buffer.from(cred.encryptedPayload, 'base64');
  const tag = Buffer.from(cred.authTag, 'base64');
  const combined = new Uint8Array(ct.length + tag.length);
  combined.set(ct, 0);
  combined.set(tag, ct.length);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined);
  const parsed = JSON.parse(new TextDecoder().decode(decrypted));

  const appUrl = env.APP_URL ?? env.NEXT_PUBLIC_APP_URL;
  return {
    clientId: parsed.client_id ?? parsed.clientId,
    clientSecret: parsed.client_secret ?? parsed.clientSecret,
    redirectUri: `${appUrl}/api/connectors/callback`,
  };
}

async function getDecryptionKey(): Promise<CryptoKey> {
  const raw = env.SESSION_SECRET;
  if (!raw || raw.length < 32) throw new Error('SESSION_SECRET not configured');
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(raw.slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  );
}

export const MicrosoftConnector = {
  provider: 'microsoft' as const,

  /**
   * Generate the OAuth authorization URL for Microsoft.
   */
  async getAuthorizationUrl(state: string, codeVerifier?: string): Promise<string> {
    const config = await loadConfig();

    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: config.redirectUri,
      scope: SCOPES.join(' '),
      state,
      response_mode: 'query',
      prompt: 'consent',
    });

    if (codeVerifier) {
      const encoder = new TextEncoder();
      const digest = await crypto.subtle.digest('SHA-256', encoder.encode(codeVerifier));
      const codeChallenge = Buffer.from(digest)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      params.set('code_challenge_method', 'S256');
      params.set('code_challenge', codeChallenge);
    }

    return `${AUTHORITY}/authorize?${params.toString()}`;
  },

  /**
   * Exchange an authorization code for tokens.
   */
  async exchangeCode(code: string, codeVerifier?: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    email: string;
  }> {
    const config = await loadConfig();

    const body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      scope: SCOPES.join(' '),
    });

    if (codeVerifier) {
      body.set('code_verifier', codeVerifier);
    }

    const res = await fetch(`${AUTHORITY}/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Microsoft token exchange failed: ${res.status} ${text.slice(0, 200)}`);
    }

    const data = await res.json();

    // Decode the ID token to get the user's email
    const idToken = data.id_token;
    let email = '';
    if (idToken) {
      const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
      email = payload.preferred_username ?? payload.email ?? '';
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? '',
      expiresIn: data.expires_in ?? 3600,
      email,
    };
  },

  /**
   * Refresh an expired access token.
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const config = await loadConfig();

    const body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: SCOPES.join(' '),
    });

    const res = await fetch(`${AUTHORITY}/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Microsoft token refresh failed: ${res.status} ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresIn: data.expires_in ?? 3600,
    };
  },

  /**
   * Test the connection by calling Microsoft Graph /me endpoint.
   */
  async testConnection(accessToken: string): Promise<{ ok: boolean; email?: string; error?: string }> {
    try {
      const res = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return { ok: false, error: `Graph API ${res.status}` };
      const data = await res.json();
      return { ok: true, email: data.mail ?? data.userPrincipalName };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },
};
