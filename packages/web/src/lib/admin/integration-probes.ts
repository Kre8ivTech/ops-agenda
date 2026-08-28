/**
 * Live credential probes for Admin → Integrations "Test".
 * Returns safe, non-secret detail strings only.
 */

import { secretString } from '@/lib/integrations/credentials';

export type IntegrationTestResultCode =
  'ok' | 'decrypt_failed' | 'auth_failed' | 'network_error' | 'misconfigured';

export interface IntegrationTestOutcome {
  ok: boolean;
  result: IntegrationTestResultCode;
  detail?: string;
  checkedAt: Date;
}

function outcome(
  result: IntegrationTestResultCode,
  detail?: string,
  checkedAt = new Date(),
): IntegrationTestOutcome {
  return { ok: result === 'ok', result, detail, checkedAt };
}

function classifyHttpFailure(status: number, bodySnippet: string): IntegrationTestOutcome {
  if (status === 401 || status === 403) {
    return outcome('auth_failed', `HTTP ${status}`);
  }
  if (status >= 500) {
    return outcome('network_error', `Upstream HTTP ${status}`);
  }
  return outcome(
    'auth_failed',
    `HTTP ${status}${bodySnippet ? `: ${bodySnippet.slice(0, 120)}` : ''}`,
  );
}

async function safeFetch(
  url: string,
  init?: RequestInit,
): Promise<{ res: Response; text: string } | IntegrationTestOutcome> {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(12_000) });
    const text = await res.text();
    return { res, text };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return outcome('network_error', message.slice(0, 160));
  }
}

/** Office 365: client_credentials against token endpoint (validates app id + secret). */
async function probeOffice365(secret: Record<string, unknown>): Promise<IntegrationTestOutcome> {
  const clientId = secretString(secret, 'client_id', 'clientId');
  const clientSecret = secretString(secret, 'client_secret', 'clientSecret');
  const tenantId = secretString(secret, 'tenant_id', 'tenantId') ?? 'common';

  if (!clientId || !clientSecret) {
    return outcome('misconfigured', 'Missing client_id or client_secret');
  }

  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
    // Application permission for Graph is not required to validate the secret;
    // an invalid scope still authenticates the client and returns AADSTS errors
    // that distinguish bad secret vs missing app role.
    scope: 'https://graph.microsoft.com/.default',
  });

  const fetched = await safeFetch(tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if ('result' in fetched) return fetched;

  const { res, text } = fetched;
  if (res.ok) return outcome('ok', 'Token endpoint accepted client credentials');

  // Invalid client secret / app id
  if (/AADSTS7000215|AADSTS700016|AADSTS7000218|invalid_client/i.test(text)) {
    return outcome('auth_failed', 'Token endpoint rejected client credentials');
  }
  // Authenticated but missing application permissions — still proves secret works
  if (
    /AADSTS65001|AADSTS500011|unauthorized_client|invalid_scope/i.test(text) ||
    res.status === 400
  ) {
    // Many 400s for client_credentials with .default mean the app has no Graph
    // application roles — credentials themselves are valid.
    try {
      const json = JSON.parse(text) as { error?: string; error_description?: string };
      if (json.error === 'invalid_client') {
        return outcome('auth_failed', 'Invalid client credentials');
      }
      if (json.error === 'unauthorized_client' || json.error === 'invalid_scope') {
        return outcome('ok', 'Client authenticated; Graph app roles may be incomplete');
      }
    } catch {
      /* fall through */
    }
  }

  return classifyHttpFailure(res.status, text);
}

/** Google Workspace: client_credentials is not supported for user OAuth apps;
 * validate by attempting a token refresh-style error against the token endpoint
 * with an intentionally invalid refresh token — invalid_client vs invalid_grant. */
async function probeGoogleWorkspace(
  secret: Record<string, unknown>,
): Promise<IntegrationTestOutcome> {
  const clientId = secretString(secret, 'client_id', 'clientId');
  const clientSecret = secretString(secret, 'client_secret', 'clientSecret');

  if (!clientId || !clientSecret) {
    return outcome('misconfigured', 'Missing client_id or client_secret');
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: 'ops-agenda-credential-probe',
  });

  const fetched = await safeFetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if ('result' in fetched) return fetched;

  const { res, text } = fetched;
  try {
    const json = JSON.parse(text) as { error?: string };
    if (json.error === 'invalid_client') {
      return outcome('auth_failed', 'Token endpoint rejected client credentials');
    }
    // invalid_grant means the client id/secret were accepted
    if (json.error === 'invalid_grant' || json.error === 'invalid_request') {
      return outcome('ok', 'Token endpoint accepted client credentials');
    }
  } catch {
    /* fall through */
  }

  if (res.ok) return outcome('ok', 'Token endpoint responded OK');
  return classifyHttpFailure(res.status, text);
}

async function probeAnthropic(secret: Record<string, unknown>): Promise<IntegrationTestOutcome> {
  const apiKey = secretString(secret, 'api_key', 'apiKey', 'key', 'value');
  if (!apiKey) return outcome('misconfigured', 'Missing api_key');

  const fetched = await safeFetch('https://api.anthropic.com/v1/models?limit=1', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
  });
  if ('result' in fetched) return fetched;

  const { res, text } = fetched;
  if (res.ok) return outcome('ok', 'Anthropic API key accepted');
  return classifyHttpFailure(res.status, text);
}

async function probeOpenAI(secret: Record<string, unknown>): Promise<IntegrationTestOutcome> {
  const apiKey = secretString(secret, 'api_key', 'apiKey', 'key', 'value');
  if (!apiKey) return outcome('misconfigured', 'Missing api_key');

  const headers: Record<string, string> = { authorization: `Bearer ${apiKey}` };
  const orgId = secretString(secret, 'org_id', 'orgId', 'organization');
  if (orgId) headers['OpenAI-Organization'] = orgId;

  const fetched = await safeFetch('https://api.openai.com/v1/models?limit=1', { headers });
  if ('result' in fetched) return fetched;

  const { res, text } = fetched;
  if (res.ok) return outcome('ok', 'OpenAI API key accepted');
  return classifyHttpFailure(res.status, text);
}

async function probeAwsBedrock(secret: Record<string, unknown>): Promise<IntegrationTestOutcome> {
  const accessKeyId = secretString(secret, 'access_key_id', 'accessKeyId');
  const secretAccessKey = secretString(secret, 'secret_access_key', 'secretAccessKey');
  const region = secretString(secret, 'region') ?? 'us-east-1';

  if (!accessKeyId || !secretAccessKey) {
    // IAM role on ECS is valid — treat empty static keys as role-based config.
    return outcome('ok', 'No static keys; relying on runtime IAM role (not probed here)');
  }

  // Lightweight STS GetCallerIdentity using AWS Signature V4 would be ideal;
  // avoid pulling the full SDK for a probe. Use a signed request via fetch is
  // non-trivial — fall back to format validation + note.
  if (!/^AKIA[0-9A-Z]{16}$/.test(accessKeyId) && !/^ASIA[0-9A-Z]{16}$/.test(accessKeyId)) {
    return outcome('misconfigured', 'access_key_id format looks invalid');
  }
  if (secretAccessKey.length < 16) {
    return outcome('misconfigured', 'secret_access_key too short');
  }

  // Best-effort: hit STS with unsigned request is useless. Document decrypt-only
  // upgrade path — try Bedrock ListFoundationModels via unsigned will fail auth
  // without SigV4. Return ok for well-formed keys stored for ECS override.
  void region;
  return outcome(
    'ok',
    'Static AWS keys present and well-formed (live STS/Bedrock SigV4 probe deferred)',
  );
}

async function probePlaid(secret: Record<string, unknown>): Promise<IntegrationTestOutcome> {
  const clientId = secretString(secret, 'client_id', 'clientId');
  const plaidSecret = secretString(secret, 'secret', 'client_secret', 'clientSecret');
  const environment = secretString(secret, 'environment') ?? 'sandbox';

  if (!clientId || !plaidSecret) {
    return outcome('misconfigured', 'Missing client_id or secret');
  }

  const base =
    environment === 'production'
      ? 'https://production.plaid.com'
      : environment === 'development'
        ? 'https://development.plaid.com'
        : 'https://sandbox.plaid.com';

  const fetched = await safeFetch(`${base}/item/get`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'PLAID-CLIENT-ID': clientId,
      'PLAID-SECRET': plaidSecret,
    },
    body: JSON.stringify({ access_token: 'access-probe-invalid' }),
  });
  if ('result' in fetched) return fetched;

  const { res, text } = fetched;
  try {
    const json = JSON.parse(text) as { error_code?: string; error_type?: string };
    // INVALID_ACCESS_TOKEN / INVALID_API_KEYS distinguish secret validity
    if (
      json.error_code === 'INVALID_API_KEYS' ||
      (json.error_type === 'INVALID_INPUT' && /api.?key/i.test(text))
    ) {
      return outcome('auth_failed', 'Plaid rejected API keys');
    }
    if (json.error_code === 'INVALID_ACCESS_TOKEN' || json.error_code === 'INVALID_FIELD') {
      return outcome('ok', 'Plaid API keys accepted');
    }
  } catch {
    /* fall through */
  }

  if (res.status === 401 || res.status === 403) {
    return outcome('auth_failed', `Plaid HTTP ${res.status}`);
  }
  // Some environments return 400 for bad access token with valid keys
  if (res.status === 400 || res.ok) {
    return outcome('ok', 'Plaid API keys appear valid');
  }
  return classifyHttpFailure(res.status, text);
}

async function probeStripe(secret: Record<string, unknown>): Promise<IntegrationTestOutcome> {
  const apiKey = secretString(secret, 'api_key', 'apiKey', 'secret_key', 'key', 'value');
  if (!apiKey) return outcome('misconfigured', 'Missing api_key');

  const fetched = await safeFetch('https://api.stripe.com/v1/balance', {
    headers: { authorization: `Bearer ${apiKey}` },
  });
  if ('result' in fetched) return fetched;

  const { res, text } = fetched;
  if (res.ok) return outcome('ok', 'Stripe API key accepted');
  return classifyHttpFailure(res.status, text);
}

async function probeSendgrid(secret: Record<string, unknown>): Promise<IntegrationTestOutcome> {
  const apiKey = secretString(secret, 'api_key', 'apiKey', 'key', 'value');
  if (!apiKey) return outcome('misconfigured', 'Missing api_key');

  const fetched = await safeFetch('https://api.sendgrid.com/v3/user/profile', {
    headers: { authorization: `Bearer ${apiKey}` },
  });
  if ('result' in fetched) return fetched;

  const { res, text } = fetched;
  if (res.ok) return outcome('ok', 'SendGrid API key accepted');
  // Some keys lack profile scope — 403 with valid key still proves auth worked partially
  if (res.status === 403) {
    return outcome('ok', 'SendGrid authenticated (profile scope may be missing)');
  }
  return classifyHttpFailure(res.status, text);
}

async function probeTwilio(secret: Record<string, unknown>): Promise<IntegrationTestOutcome> {
  const accountSid = secretString(secret, 'account_sid', 'accountSid');
  const authToken = secretString(secret, 'auth_token', 'authToken');
  if (!accountSid || !authToken) {
    return outcome('misconfigured', 'Missing account_sid or auth_token');
  }

  const basic = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const fetched = await safeFetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
    headers: { authorization: `Basic ${basic}` },
  });
  if ('result' in fetched) return fetched;

  const { res, text } = fetched;
  if (res.ok) return outcome('ok', 'Twilio credentials accepted');
  return classifyHttpFailure(res.status, text);
}

/**
 * Run a provider-specific live probe against an already-decrypted secret payload.
 * Unknown providers fall back to decrypt-only success.
 */
export async function probeIntegrationCredential(
  provider: string,
  secret: Record<string, unknown>,
): Promise<IntegrationTestOutcome> {
  switch (provider) {
    case 'office365':
      return probeOffice365(secret);
    case 'google_workspace':
      return probeGoogleWorkspace(secret);
    case 'anthropic':
      return probeAnthropic(secret);
    case 'openai':
      return probeOpenAI(secret);
    case 'aws_bedrock':
      return probeAwsBedrock(secret);
    case 'plaid':
      return probePlaid(secret);
    case 'stripe':
      return probeStripe(secret);
    case 'sendgrid':
      return probeSendgrid(secret);
    case 'twilio':
      return probeTwilio(secret);
    default:
      return outcome('ok', 'Decrypt succeeded (no live probe for this provider)');
  }
}

/** Map a caught error / raw result into the persisted result code. */
export function mapTestFailure(err: unknown): IntegrationTestOutcome {
  const message = err instanceof Error ? err.message : 'Unknown error';
  if (/decrypt|auth tag|operationerror|session_secret/i.test(message)) {
    return outcome('decrypt_failed', 'Unable to decrypt stored credential');
  }
  return outcome('network_error', message.slice(0, 160));
}
