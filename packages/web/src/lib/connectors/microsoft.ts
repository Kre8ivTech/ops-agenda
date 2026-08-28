/**
 * lib/connectors/microsoft.ts — Office 365 OAuth2 connector.
 *
 * Uses Microsoft Identity Platform (v2.0) for OAuth with PKCE.
 *
 * Scope note: PRD documents least-privilege Mail.Read + Calendars.Read.
 * Existing tenant connections were granted a wider set including shared-mailbox
 * and Calendars.ReadWrite. Do not shrink or migrate scopes here — changing
 * them would force re-consent and break existing connections. Prefer a
 * deliberate, opt-in scope migration in a later slice.
 */

import { loadEnabledCredential, secretString } from '@/lib/integrations/credentials';
import { env } from '@/lib/env';

const AUTHORITY = 'https://login.microsoftonline.com/common/oauth2/v2.0';
// Kept as-is for existing tenant grants; see file header for PRD scope note.
const SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'Mail.Read',
  'Mail.Read.Shared',
  'Calendars.ReadWrite',
  'Calendars.Read.Shared',
];

export interface MicrosoftOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

async function loadConfig(): Promise<MicrosoftOAuthConfig> {
  const cred = await loadEnabledCredential('office365');
  if (!cred) {
    throw new Error(
      'Office 365 integration credentials not configured. Add them in Admin → Integrations.',
    );
  }

  const clientId = secretString(cred.secret, 'client_id', 'clientId');
  const clientSecret = secretString(cred.secret, 'client_secret', 'clientSecret');
  if (!clientId || !clientSecret) {
    throw new Error('Office 365 credentials are missing client_id or client_secret.');
  }

  const appUrl = env.APP_URL ?? env.NEXT_PUBLIC_APP_URL;
  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl}/api/connectors/callback`,
  };
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
  async testConnection(
    accessToken: string,
  ): Promise<{ ok: boolean; email?: string; error?: string }> {
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
