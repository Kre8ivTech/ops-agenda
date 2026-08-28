import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { mapTestFailure, probeIntegrationCredential } from './integration-probes';

describe('mapTestFailure', () => {
  it('maps decrypt errors to decrypt_failed', () => {
    const outcome = mapTestFailure(new Error('AES-GCM decrypt failed: OperationError'));
    expect(outcome.ok).toBe(false);
    expect(outcome.result).toBe('decrypt_failed');
  });

  it('maps other errors to network_error', () => {
    const outcome = mapTestFailure(new Error('fetch failed'));
    expect(outcome.ok).toBe(false);
    expect(outcome.result).toBe('network_error');
    expect(outcome.detail).toContain('fetch failed');
  });
});

describe('probeIntegrationCredential', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns misconfigured when required fields are missing', async () => {
    const outcome = await probeIntegrationCredential('anthropic', {});
    expect(outcome).toMatchObject({ ok: false, result: 'misconfigured' });
  });

  it('marks anthropic auth failures', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'unauthorized',
    }) as unknown as typeof fetch;

    const outcome = await probeIntegrationCredential('anthropic', { api_key: 'sk-ant-test' });
    expect(outcome.ok).toBe(false);
    expect(outcome.result).toBe('auth_failed');
  });

  it('marks anthropic success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{"data":[]}',
    }) as unknown as typeof fetch;

    const outcome = await probeIntegrationCredential('anthropic', { api_key: 'sk-ant-test' });
    expect(outcome.ok).toBe(true);
    expect(outcome.result).toBe('ok');
  });

  it('treats google invalid_grant as credential ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: 'invalid_grant' }),
    }) as unknown as typeof fetch;

    const outcome = await probeIntegrationCredential('google_workspace', {
      client_id: 'id',
      client_secret: 'secret',
    });
    expect(outcome).toMatchObject({ ok: true, result: 'ok' });
  });

  it('falls back to decrypt-only success for unknown providers', async () => {
    const outcome = await probeIntegrationCredential('custom', { value: 'x' });
    expect(outcome).toMatchObject({ ok: true, result: 'ok' });
  });

  it('maps network failures', async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new Error('DNS failed')) as unknown as typeof fetch;
    const outcome = await probeIntegrationCredential('openai', { api_key: 'sk-test' });
    expect(outcome.result).toBe('network_error');
  });
});
