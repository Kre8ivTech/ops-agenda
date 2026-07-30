import { timingSafeEqual } from 'node:crypto';

import { env } from '@/lib/env';

function normalizeCode(value: string): string {
  return value.trim();
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

/** Parse comma-separated SIGNUP_ACCESS_CODES into a list of non-empty codes. */
export function parseAccessCodes(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((code) => normalizeCode(code))
    .filter(Boolean);
}

/** Constant-time check against an allowlist. Empty allowlist always fails. */
export function matchesAccessCode(submitted: string, allowlist: string[]): boolean {
  if (allowlist.length === 0) return false;

  const candidate = normalizeCode(submitted);
  if (!candidate) return false;

  let matched = false;
  for (const code of allowlist) {
    if (safeEqual(candidate, code)) matched = true;
  }
  return matched;
}

/**
 * Constant-time check against the configured allowlist.
 * Returns false when no codes are configured (signup disabled until env is set).
 */
export function isValidAccessCode(submitted: string): boolean {
  return matchesAccessCode(submitted, parseAccessCodes(env.SIGNUP_ACCESS_CODES));
}
