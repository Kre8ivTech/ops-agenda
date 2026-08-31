import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/integrations/credentials', () => ({
  loadEnabledCredential: vi.fn(),
  secretString: vi.fn(
    (secret: Record<string, unknown>, ...keys: string[]) => {
      for (const key of keys) {
        const value = secret[key];
        if (typeof value === 'string' && value.trim()) return value;
      }
      return undefined;
    },
  ),
}));

import { loadEnabledCredential } from '@/lib/integrations/credentials';
import { sendTransactionalEmail } from './sendgrid';

describe('sendTransactionalEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns not_configured when SendGrid credential is missing', async () => {
    vi.mocked(loadEnabledCredential).mockResolvedValueOnce(null);
    await expect(
      sendTransactionalEmail({
        to: 'a@example.com',
        subject: 'Hi',
        text: 'Body',
      }),
    ).resolves.toEqual({ ok: false, reason: 'not_configured' });
  });

  it('returns missing_from when from_email is absent', async () => {
    vi.mocked(loadEnabledCredential).mockResolvedValueOnce({
      id: '1',
      provider: 'sendgrid',
      label: 'SG',
      secret: { api_key: 'SG.xxx' },
      metadata: null,
      enabled: true,
      row: {} as never,
    });

    await expect(
      sendTransactionalEmail({
        to: 'a@example.com',
        subject: 'Hi',
        text: 'Body',
      }),
    ).resolves.toEqual({ ok: false, reason: 'missing_from' });
  });

  it('posts to SendGrid and returns ok on 202', async () => {
    vi.mocked(loadEnabledCredential).mockResolvedValueOnce({
      id: '1',
      provider: 'sendgrid',
      label: 'SG',
      secret: { api_key: 'SG.xxx', from_email: 'noreply@opsagenda.com', from_name: 'Ops Agenda' },
      metadata: null,
      enabled: true,
      row: {} as never,
    });

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202 });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      sendTransactionalEmail({
        to: 'assignee@example.com',
        subject: 'Task assigned: Demo',
        text: 'Body',
        html: '<p>Body</p>',
      }),
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.sendgrid.com/v3/mail/send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          authorization: 'Bearer SG.xxx',
        }),
      }),
    );
  });

  it('returns send_failed when SendGrid responds with an error status', async () => {
    vi.mocked(loadEnabledCredential).mockResolvedValueOnce({
      id: '1',
      provider: 'sendgrid',
      label: 'SG',
      secret: { api_key: 'SG.xxx', from_email: 'noreply@opsagenda.com' },
      metadata: null,
      enabled: true,
      row: {} as never,
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));

    await expect(
      sendTransactionalEmail({
        to: 'a@example.com',
        subject: 'Hi',
        text: 'Body',
      }),
    ).resolves.toEqual({ ok: false, reason: 'send_failed' });
  });
});
