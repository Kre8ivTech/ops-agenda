import { describe, expect, it } from 'vitest';

import { matchesAccessCode, parseAccessCodes } from '@/lib/auth/access-code';
import { resetPasswordSchema, signUpSchema } from '@/lib/auth/schemas';

describe('parseAccessCodes', () => {
  it('splits and trims comma-separated codes', () => {
    expect(parseAccessCodes(' alpha ,beta,  gamma ')).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('returns empty for undefined or blank', () => {
    expect(parseAccessCodes(undefined)).toEqual([]);
    expect(parseAccessCodes('')).toEqual([]);
    expect(parseAccessCodes(' , , ')).toEqual([]);
  });
});

describe('matchesAccessCode', () => {
  it('accepts a listed code', () => {
    expect(matchesAccessCode('dev-access-2026', ['dev-access-2026'])).toBe(true);
  });

  it('rejects wrong codes and empty allowlist', () => {
    expect(matchesAccessCode('nope', ['dev-access-2026'])).toBe(false);
    expect(matchesAccessCode('dev-access-2026', [])).toBe(false);
    expect(matchesAccessCode('', ['dev-access-2026'])).toBe(false);
  });

  it('trims submitted input', () => {
    expect(matchesAccessCode('  secret  ', ['secret'])).toBe(true);
  });
});

describe('signUpSchema', () => {
  const valid = {
    name: 'Dana Whitfield',
    email: 'dana@northgate.co',
    password: 'CorrectHorse1!',
    confirmPassword: 'CorrectHorse1!',
    accessCode: 'dev-access-2026',
  };

  it('accepts a strong password and matching confirm', () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects weak passwords', () => {
    const result = signUpSchema.safeParse({ ...valid, password: 'short', confirmPassword: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched confirm password', () => {
    const result = signUpSchema.safeParse({ ...valid, confirmPassword: 'CorrectHorse2!' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword?.[0]).toMatch(/match/i);
    }
  });
});

describe('resetPasswordSchema', () => {
  it('requires code and matching passwords', () => {
    const result = resetPasswordSchema.safeParse({
      email: 'dana@northgate.co',
      code: '123456',
      password: 'CorrectHorse1!',
      confirmPassword: 'CorrectHorse2!',
    });
    expect(result.success).toBe(false);
  });
});
