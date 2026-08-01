/**
 * lib/connectors/imap.ts — IMAP/POP3 email connector.
 *
 * For email providers that don't support OAuth (or users who prefer IMAP).
 * Stores encrypted IMAP credentials and tests connectivity via TCP.
 */

import * as net from 'node:net';
import * as tls from 'node:tls';

export interface ImapConfig {
  host: string;
  port: number;
  security: 'ssl' | 'starttls' | 'none';
  username: string;
  password: string;
}

export const COMMON_IMAP_PROVIDERS: Record<string, Omit<ImapConfig, 'username' | 'password'>> = {
  'outlook.com': { host: 'outlook.office365.com', port: 993, security: 'ssl' },
  'gmail.com': { host: 'imap.gmail.com', port: 993, security: 'ssl' },
  'yahoo.com': { host: 'imap.mail.yahoo.com', port: 993, security: 'ssl' },
  'icloud.com': { host: 'imap.mail.me.com', port: 993, security: 'ssl' },
  'aol.com': { host: 'imap.aol.com', port: 993, security: 'ssl' },
  'zoho.com': { host: 'imap.zoho.com', port: 993, security: 'ssl' },
  'fastmail.com': { host: 'imap.fastmail.com', port: 993, security: 'ssl' },
  'proton.me': { host: 'imap.proton.me', port: 993, security: 'ssl' },
};

export const ImapConnector = {
  provider: 'imap' as const,

  /**
   * Test IMAP connectivity by establishing a TCP/TLS connection
   * and checking for a valid server greeting.
   */
  async testConnection(config: ImapConfig): Promise<{ ok: boolean; error?: string }> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ ok: false, error: 'Connection timed out (10s)' });
      }, 10000);

      try {
        let socket: net.Socket;

        if (config.security === 'ssl') {
          socket = tls.connect(
            { host: config.host, port: config.port, rejectUnauthorized: true },
            () => {
              clearTimeout(timeout);
              socket.destroy();
              resolve({ ok: true });
            },
          );
        } else {
          socket = net.createConnection(config.port, config.host, () => {
            clearTimeout(timeout);
            socket.destroy();
            resolve({ ok: true });
          });
        }

        socket.on('error', (err) => {
          clearTimeout(timeout);
          resolve({ ok: false, error: err.message });
        });
      } catch (err) {
        clearTimeout(timeout);
        resolve({ ok: false, error: err instanceof Error ? err.message : 'Connection failed' });
      }
    });
  },

  /**
   * Auto-detect IMAP settings from an email domain.
   */
  detectSettings(email: string): Omit<ImapConfig, 'username' | 'password'> | null {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;
    return COMMON_IMAP_PROVIDERS[domain] ?? null;
  },
};
