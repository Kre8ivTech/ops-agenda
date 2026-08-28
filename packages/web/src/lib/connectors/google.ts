/**
 * lib/connectors/google.ts — Google Workspace OAuth2 connector.
 *
 * Uses Google OAuth 2.0 with PKCE for Gmail and Google Calendar access.
 * Scopes: gmail.readonly, calendar.readonly
 */

import { loadEnabledCredential, secretString } from '@/lib/integrations/credentials';
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
  const cred = await loadEnabledCredential('google_workspace');
  if (!cred) {
    throw new Error(
      'Google Workspace integration credentials not configured. Add them in Admin → Integrations.',
    );
  }

  const clientId = secretString(cred.secret, 'client_id', 'clientId');
  const clientSecret = secretString(cred.secret, 'client_secret', 'clientSecret');
  if (!clientId || !clientSecret) {
    throw new Error('Google Workspace credentials are missing client_id or client_secret.');
  }

  const appUrl = env.APP_URL ?? env.NEXT_PUBLIC_APP_URL;
  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl}/api/connectors/callback`,
  };
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
  async exchangeCode(
    code: string,
    codeVerifier?: string,
  ): Promise<{
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
  async testConnection(
    accessToken: string,
  ): Promise<{ ok: boolean; email?: string; error?: string }> {
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
