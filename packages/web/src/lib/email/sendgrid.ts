/**
 * Minimal SendGrid transactional mailer using the platform integration credential.
 * Outbound notifications only — never stores raw email bodies.
 */

import { loadEnabledCredential, secretString } from '@/lib/integrations/credentials';

export type SendMailResult =
  | { ok: true }
  | { ok: false; reason: 'not_configured' | 'missing_from' | 'send_failed' };

export interface TransactionalEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

function metaString(metadata: unknown, key: string): string | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return undefined;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/**
 * Send a transactional email via SendGrid.
 * Degrades gracefully when the integration is missing or misconfigured.
 */
export async function sendTransactionalEmail(
  input: TransactionalEmailInput,
): Promise<SendMailResult> {
  const cred = await loadEnabledCredential('sendgrid');
  if (!cred) return { ok: false, reason: 'not_configured' };

  const apiKey = secretString(cred.secret, 'api_key', 'apiKey', 'key', 'value');
  if (!apiKey) return { ok: false, reason: 'not_configured' };

  const fromEmail =
    secretString(cred.secret, 'from_email', 'fromEmail') ?? metaString(cred.metadata, 'from_email');
  if (!fromEmail) return { ok: false, reason: 'missing_from' };

  const fromName =
    secretString(cred.secret, 'from_name', 'fromName') ??
    metaString(cred.metadata, 'from_name') ??
    'Ops Agenda';

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: input.to }] }],
        from: { email: fromEmail, name: fromName },
        subject: input.subject,
        content: [
          { type: 'text/plain', value: input.text },
          ...(input.html ? [{ type: 'text/html', value: input.html }] : []),
        ],
      }),
    });

    // SendGrid returns 202 Accepted on success.
    if (res.status === 202 || res.ok) return { ok: true };

    // Do not log response bodies (may contain recipient PII).
    return { ok: false, reason: 'send_failed' };
  } catch {
    return { ok: false, reason: 'send_failed' };
  }
}
