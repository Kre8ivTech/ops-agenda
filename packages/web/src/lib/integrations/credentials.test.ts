import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  createDb: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  env: { DATABASE_URL: 'postgres://test' },
}));

vi.mock('@/lib/crypto/aes-gcm', () => ({
  decryptAesGcm: vi.fn(async () => JSON.stringify({ client_id: 'cid', client_secret: 'csec' })),
  encryptAesGcm: vi.fn(async () => ({ ciphertext: 'c', iv: 'i', authTag: 't' })),
}));

import { createDb } from '@/lib/db';
import { decryptAesGcm } from '@/lib/crypto/aes-gcm';
import { loadEnabledCredential, secretString } from '@/lib/integrations/credentials';

describe('secretString', () => {
  it('returns the first matching non-empty string', () => {
    expect(secretString({ clientId: 'a', client_id: 'b' }, 'client_id', 'clientId')).toBe('b');
    expect(secretString({ clientId: 'a' }, 'client_id', 'clientId')).toBe('a');
    expect(secretString({}, 'client_id')).toBeUndefined();
  });
});

describe('loadEnabledCredential', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no enabled row exists', async () => {
    const where = vi.fn().mockResolvedValue([]);
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });
    vi.mocked(createDb).mockReturnValue({ select } as never);

    await expect(loadEnabledCredential('office365')).resolves.toBeNull();
  });

  it('decrypts and returns the parsed secret payload', async () => {
    const row = {
      id: '11111111-1111-1111-1111-111111111111',
      provider: 'office365',
      label: 'O365',
      encryptedPayload: 'enc',
      iv: 'iv',
      authTag: 'tag',
      metadata: null,
      enabled: true,
    };
    const where = vi.fn().mockResolvedValue([row]);
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });
    vi.mocked(createDb).mockReturnValue({ select } as never);

    const loaded = await loadEnabledCredential('office365');
    expect(decryptAesGcm).toHaveBeenCalledWith('enc', 'iv', 'tag');
    expect(loaded).toMatchObject({
      id: row.id,
      provider: 'office365',
      label: 'O365',
      secret: { client_id: 'cid', client_secret: 'csec' },
      enabled: true,
    });
  });

  it('returns null when decrypt fails', async () => {
    const row = {
      id: '11111111-1111-1111-1111-111111111111',
      provider: 'plaid',
      label: 'Plaid',
      encryptedPayload: 'enc',
      iv: 'iv',
      authTag: 'tag',
      metadata: null,
      enabled: true,
    };
    const where = vi.fn().mockResolvedValue([row]);
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });
    vi.mocked(createDb).mockReturnValue({ select } as never);
    vi.mocked(decryptAesGcm).mockRejectedValueOnce(new Error('bad tag'));

    await expect(loadEnabledCredential('plaid')).resolves.toBeNull();
  });
});
