/**
 * Field-Level Encryption — AES-256-GCM
 * 
 * Used for encrypting OAuth tokens before storing in database.
 * Implements 3-layer security: disk (Supabase) + TLS + field-level.
 */

import crypto from "crypto";
import { env } from "@/lib/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY = Buffer.from(env.ENCRYPTION_KEY, "hex");

/**
 * Encrypt a string value using AES-256-GCM
 * 
 * @param plaintext - The value to encrypt
 * @returns Base64-encoded encrypted value with IV and auth tag
 * 
 * Format: iv:authTag:encryptedData (all base64)
 */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  
  const authTag = cipher.getAuthTag();
  
  // Return format: iv:authTag:encryptedData
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypt a string value encrypted with AES-256-GCM
 * 
 * @param ciphertext - The encrypted value (iv:authTag:encryptedData)
 * @returns Decrypted plaintext
 */
export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(":");
  
  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format");
  }
  
  const [ivBase64, authTagBase64, encryptedBase64] = parts;
  
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");
  const encrypted = Buffer.from(encryptedBase64, "base64");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString("utf8");
}

/**
 * Generate a random encryption key (32 bytes = 256 bits)
 * 
 * Run this to generate a new ENCRYPTION_KEY for .env:
 * ```bash
 * node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * ```
 */
export function generateKey(): string {
  return crypto.randomBytes(32).toString("hex");
}
