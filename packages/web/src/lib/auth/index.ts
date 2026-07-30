import * as Iron from 'iron-webcrypto';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export interface Session {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  accountId?: string;
  userId?: string;
  role?: string;
}

interface TokenSet {
  id_token: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface PkceCookie {
  codeVerifier: string;
  state: string;
}

const SESSION_COOKIE = '__Host-session';
const PKCE_COOKIE = '__Host-pkce';
const RETURN_TO_COOKIE = '__Host-return-to';

function cognitoDomain(): string {
  const domain = env.COGNITO_DOMAIN;
  if (!domain) throw new Error('COGNITO_DOMAIN is not configured');
  return domain;
}

function redirectUri(): string {
  return `${env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;
}

type IronCrypto = Parameters<typeof Iron.seal>[0];

function getCrypto(): IronCrypto {
  // iron-webcrypto's Crypto type is slightly stricter than globalThis.crypto;
  // the runtime object is compatible, so cast it.
  return globalThis.crypto as unknown as IronCrypto;
}

function secret(): string {
  const value = env.SESSION_SECRET;
  if (!value) throw new Error('SESSION_SECRET is not configured');
  return value;
}

export async function seal(value: unknown): Promise<string> {
  return Iron.seal(getCrypto(), value, secret(), Iron.defaults);
}

export async function unseal<T>(token: string): Promise<T> {
  return Iron.unseal(getCrypto(), token, secret(), Iron.defaults) as Promise<T>;
}

function base64url(value: Uint8Array): string {
  return btoa(String.fromCharCode(...value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Use the runtime Web Crypto global for standard operations; only Iron needs the
// narrower type.
const webCrypto = globalThis.crypto;

export async function generatePkce(): Promise<{ codeChallenge: string; codeVerifier: string }> {
  const verifier = base64url(webCrypto.getRandomValues(new Uint8Array(32)));
  const encoder = new TextEncoder();
  const digest = await webCrypto.subtle.digest('SHA-256', encoder.encode(verifier));
  const challenge = base64url(new Uint8Array(digest));
  return { codeVerifier: verifier, codeChallenge: challenge };
}

function cognitoAuthorizeUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.COGNITO_CLIENT_ID ?? '',
    redirect_uri: redirectUri(),
    scope: 'openid email profile',
    state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });
  return `https://${cognitoDomain()}/oauth2/authorize?${params.toString()}`;
}

export async function createSignInUrl(returnTo = '/dashboard'): Promise<string> {
  const state = base64url(webCrypto.getRandomValues(new Uint8Array(16)));
  const { codeVerifier, codeChallenge } = await generatePkce();

  const cookieStore = await cookies();
  cookieStore.set(PKCE_COOKIE, await seal({ codeVerifier, state }), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 5,
  });
  cookieStore.set(RETURN_TO_COOKIE, await seal(returnTo), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 5,
  });

  return cognitoAuthorizeUrl(state, codeChallenge);
}

export async function exchangeCode(
  code: string,
  state: string,
): Promise<{ session: Session; tokens: TokenSet; returnTo: string }> {
  const cookieStore = await cookies();
  const pkceCookie = cookieStore.get(PKCE_COOKIE)?.value;
  const returnToCookie = cookieStore.get(RETURN_TO_COOKIE)?.value;

  if (!pkceCookie) {
    throw new Error('PKCE cookie missing');
  }

  const { codeVerifier, state: expectedState } = await unseal<PkceCookie>(pkceCookie);

  if (state !== expectedState) {
    throw new Error('Invalid OAuth state');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: env.COGNITO_CLIENT_ID ?? '',
    redirect_uri: redirectUri(),
    code,
    code_verifier: codeVerifier,
  });

  if (env.COGNITO_CLIENT_SECRET) {
    body.set('client_secret', env.COGNITO_CLIENT_SECRET);
  }

  const tokenRes = await fetch(`https://${cognitoDomain()}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Token exchange failed: ${tokenRes.status} ${text}`);
  }

  const tokens = (await tokenRes.json()) as TokenSet;
  const payload = await verifyIdToken(tokens.id_token);

  // Clear PKCE cookies now that the flow is complete.
  cookieStore.delete(PKCE_COOKIE);
  cookieStore.delete(RETURN_TO_COOKIE);

  const email =
    typeof payload.email === 'string'
      ? payload.email
      : ((payload.preferred_username as string) ?? '');
  const session: Session = {
    sub: payload.sub as string,
    email,
    name: (payload.name as string | undefined) ?? email,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
  };

  const returnTo = returnToCookie ? await unseal<string>(returnToCookie) : '/dashboard';

  return { session, tokens, returnTo };
}

export async function verifyIdToken(token: string): Promise<Record<string, unknown>> {
  const region = env.AWS_REGION;
  const userPoolId = env.COGNITO_USER_POOL_ID;
  if (!userPoolId) throw new Error('COGNITO_USER_POOL_ID is not configured');

  const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  const jwksUri = `${issuer}/.well-known/jwks.json`;
  const JWKS = createRemoteJWKSet(new URL(jwksUri));

  const { payload } = await jwtVerify(token, JWKS, {
    issuer,
    audience: env.COGNITO_CLIENT_ID,
  });

  return payload as Record<string, unknown>;
}

export async function setSessionCookie(session: Session): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await seal(session), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE)?.value;
  if (!value) return null;
  try {
    return await unseal<Session>(value);
  } catch {
    return null;
  }
}
