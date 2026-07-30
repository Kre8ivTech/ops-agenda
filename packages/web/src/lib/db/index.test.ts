import { describe, expect, it } from 'vitest';

import { createDb } from '@/lib/db';

describe('createDb', () => {
  it('fails fast when DATABASE_URL is missing', () => {
    expect(() => createDb(undefined)).toThrow('DATABASE_URL is not configured');
    expect(() => createDb('')).toThrow('DATABASE_URL is not configured');
    expect(() => createDb('   ')).toThrow('DATABASE_URL is not configured');
  });
});
