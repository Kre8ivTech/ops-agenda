import { describe, expect, it } from 'vitest';

import { buildAuditEvent, scrubAuditValue } from '@/lib/audit';

describe('scrubAuditValue', () => {
  it('redacts sensitive keys without leaking ciphertext', () => {
    const scrubbed = scrubAuditValue({
      label: 'Stripe prod',
      secret: 'sk_live_should_not_appear',
      encryptedPayload: 'AAAA',
      api_key: 'sk_test',
      clientSecret: 'abc',
      nested: { auth_token: 'tok', region: 'us-east-1' },
    }) as Record<string, unknown>;

    expect(scrubbed.label).toBe('Stripe prod');
    expect(scrubbed.secret).toBe('[redacted]');
    expect(scrubbed.encryptedPayload).toBe('[redacted]');
    expect(scrubbed.api_key).toBe('[redacted]');
    expect(scrubbed.clientSecret).toBe('[redacted]');
    expect((scrubbed.nested as Record<string, unknown>).auth_token).toBe('[redacted]');
    expect((scrubbed.nested as Record<string, unknown>).region).toBe('us-east-1');
  });
});

describe('buildAuditEvent platform scope', () => {
  it('allows null accountId for platform operator events', () => {
    const row = buildAuditEvent(
      { accountId: null, userId: '', actorPlatformAdminId: 'admin-1' },
      {
        action: 'integration.create',
        targetType: 'integration_credential',
        targetId: '22222222-2222-2222-2222-222222222222',
        after: { provider: 'stripe', label: 'prod', secret: 'nope' },
      },
    );

    expect(row.accountId).toBeNull();
    expect(row.actorPlatformAdminId).toBe('admin-1');
    expect((row.after as Record<string, unknown>).secret).toBe('[redacted]');
  });
});
