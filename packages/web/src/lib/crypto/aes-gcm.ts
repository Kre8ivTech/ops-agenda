/**
 * Shared AES-256-GCM helpers for secrets at rest (integration credentials and
 * OAuth token payloads). Key material is derived from SESSION_SECRET.
 */

const ENCRYPTION_KEY_ENV = 'SESSION_SECRET';

export async function getAesGcmKey(
  usages: KeyUsage[] = ['encrypt', 'decrypt'],
): Promise<CryptoKey> {
  const raw = process.env[ENCRYPTION_KEY_ENV];
  if (!raw || raw.length < 32) throw new Error('SESSION_SECRET not configured');
  const keyMaterial = new TextEncoder().encode(raw.slice(0, 32));
  return crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, usages);
}

export async function encryptAesGcm(plaintext: string): Promise<{
  ciphertext: string;
  iv: string;
  authTag: string;
}> {
  const key = await getAesGcmKey(['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const buf = new Uint8Array(encrypted);
  // AES-GCM appends 16-byte auth tag to the ciphertext
  const ciphertext = buf.slice(0, buf.length - 16);
  const authTag = buf.slice(buf.length - 16);
  return {
    ciphertext: Buffer.from(ciphertext).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
    authTag: Buffer.from(authTag).toString('base64'),
  };
}

export async function decryptAesGcm(
  ciphertext: string,
  ivB64: string,
  authTagB64: string,
): Promise<string> {
  const key = await getAesGcmKey(['decrypt']);
  const iv = Buffer.from(ivB64, 'base64');
  const ct = Buffer.from(ciphertext, 'base64');
  const tag = Buffer.from(authTagB64, 'base64');
  const combined = new Uint8Array(ct.length + tag.length);
  combined.set(ct, 0);
  combined.set(tag, ct.length);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined);
  return new TextDecoder().decode(decrypted);
}
