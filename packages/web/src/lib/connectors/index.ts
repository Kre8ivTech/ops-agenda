/**
 * lib/connectors/index.ts — Provider registry and shared types for email/calendar connectors.
 */

import { decryptAesGcm, encryptAesGcm } from '@/lib/crypto/aes-gcm';

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
 * Uses the shared AES-GCM helpers (same key material as integration credentials).
 */

export async function encryptTokens(payload: string): Promise<{
  encrypted: string;
  iv: string;
  authTag: string;
}> {
  const { ciphertext, iv, authTag } = await encryptAesGcm(payload);
  return { encrypted: ciphertext, iv, authTag };
}

export async function decryptTokens(
  encrypted: string,
  ivB64: string,
  authTagB64: string,
): Promise<string> {
  return decryptAesGcm(encrypted, ivB64, authTagB64);
}

export { MicrosoftConnector } from './microsoft';
export { GoogleConnector } from './google';
export { ImapConnector } from './imap';
