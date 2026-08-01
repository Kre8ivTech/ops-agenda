/**
 * lib/connectors/index.ts — Provider registry and shared types for email/calendar connectors.
 */

export type ConnectorProvider = 'microsoft' | 'google' | 'imap';

export interface ConnectorConfig {
  provider: ConnectorProvider;
  label: string;
  description: string;
  supportsOAuth: boolean;
  supportedKinds: ('mail' | 'calendar')[];
  icon: string;
}

export const CONNECTOR_PROVIDERS: Record<ConnectorProvider, ConnectorConfig> = {
  microsoft: {
    provider: 'microsoft',
    label: 'Microsoft 365',
    description: 'Outlook mail and calendar via Microsoft Graph API',
    supportsOAuth: true,
    supportedKinds: ['mail', 'calendar'],
    icon: '📧',
  },
  google: {
    provider: 'google',
    label: 'Google Workspace',
    description: 'Gmail and Google Calendar via Google APIs',
    supportsOAuth: true,
    supportedKinds: ['mail', 'calendar'],
    icon: '📬',
  },
  imap: {
    provider: 'imap',
    label: 'IMAP / POP3',
    description: 'Connect any email provider using IMAP or POP3 credentials',
    supportsOAuth: false,
    supportedKinds: ['mail'],
    icon: '📮',
  },
};

export const PROVIDER_LIST = Object.values(CONNECTOR_PROVIDERS);

/**
 * Encryption helpers for storing OAuth tokens at rest.
 */

const ENCRYPTION_KEY_ENV = 'SESSION_SECRET';

export async function getTokenEncryptionKey(): Promise<CryptoKey> {
  const raw = process.env[ENCRYPTION_KEY_ENV];
  if (!raw || raw.length < 32) throw new Error('SESSION_SECRET not configured');
  const keyMaterial = new TextEncoder().encode(raw.slice(0, 32));
  return crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function encryptTokens(payload: string): Promise<{
  encrypted: string;
  iv: string;
  authTag: string;
}> {
  const key = await getTokenEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(payload);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const buf = new Uint8Array(encrypted);
  const ciphertext = buf.slice(0, buf.length - 16);
  const authTag = buf.slice(buf.length - 16);
  return {
    encrypted: Buffer.from(ciphertext).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
    authTag: Buffer.from(authTag).toString('base64'),
  };
}

export async function decryptTokens(encrypted: string, ivB64: string, authTagB64: string): Promise<string> {
  const key = await getTokenEncryptionKey();
  const iv = Buffer.from(ivB64, 'base64');
  const ct = Buffer.from(encrypted, 'base64');
  const tag = Buffer.from(authTagB64, 'base64');
  const combined = new Uint8Array(ct.length + tag.length);
  combined.set(ct, 0);
  combined.set(tag, ct.length);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined);
  return new TextDecoder().decode(decrypted);
}

export { MicrosoftConnector } from './microsoft';
export { GoogleConnector } from './google';
export { ImapConnector } from './imap';
