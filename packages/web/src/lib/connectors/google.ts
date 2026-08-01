/**
 * lib/connectors/google.ts — Google Workspace OAuth2 connector.
 *
 * Uses Google OAuth 2.0 with PKCE for Gmail and Google Calendar access.
 * Scopes: gmail.readonly, calendar.readonly
 */

import { eq, and } from 'drizzle-orm';
import { createDb } from '@/lib/db';
import { integrationCredential } from '@/lib/db/schema';
import { env } from '@/lib/env';

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
];

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

async function loadConfig(): Promise<GoogleOAuthConfig> {
  const db = createDb(env.DATABASE_URL);
  const [cred] = await db
    .select()
    .from(integrationCredential)
    .where(and(eq(integrationCredential.provider, 'google_workspace'), eq(integrationCredential.enabled, true)));

  if (!cred) {
    throw new Error('Google Workspace integration credentials not configured. Add them in Admin → Integrations.');
  }

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

export const GoogleConnector = {
  provider: 'google' as const,

  /**
   * Generate the OAuth authorization URL for Google.
   */
  async getAuthorizationUrl(state: string, codeVerifier?: string): Promise<string> {
    const config = await loadConfig();

    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: config.redirectUri,
      scope: SCOPES.join(' '),
      state,
      access_type: 'offline',
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

    return `${AUTH_ENDPOINT}?${params.toString()}`;
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
    });

    if (codeVerifier) {
      body.set('code_verifier', codeVerifier);
    }

    const res = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google token exchange failed: ${res.status} ${text.slice(0, 200)}`);
    }

    const data = await res.json();

    // Get user email from ID token
    let email = '';
    if (data.id_token) {
      const payload = JSON.parse(Buffer.from(data.id_token.split('.')[1], 'base64').toString());
      email = payload.email ?? '';
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
    });

    const res = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google token refresh failed: ${res.status} ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresIn: data.expires_in ?? 3600,
    };
  },

  /**
   * Test the connection by calling Google userinfo endpoint.
   */
  async testConnection(accessToken: string): Promise<{ ok: boolean; email?: string; error?: string }> {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return { ok: false, error: `Google API ${res.status}` };
      const data = await res.json();
      return { ok: true, email: data.email };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },
};
