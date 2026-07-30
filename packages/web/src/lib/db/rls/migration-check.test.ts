import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = join(dirname(import.meta.filename), '../../../../drizzle/0000_initial.sql');
const sql = readFileSync(migrationPath, 'utf8');

const tenantTables = [
  'account',
  'user',
  'entity',
  'entity_grant',
  'module_state',
  'connection',
  'audit_event',
  'task',
];

describe('RLS is enforced on every tenant table', () => {
  for (const table of tenantTables) {
    it(`enables and forces RLS on "${table}"`, () => {
      const enable = new RegExp(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      const force = new RegExp(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;`);
      expect(sql).toMatch(enable);
      expect(sql).toMatch(force);
    });

    it(`defines a tenant isolation policy for "${table}"`, () => {
      // account table uses id instead of account_id
      const column = table === 'account' ? 'id' : 'account_id';
      const policy = new RegExp(
        `CREATE POLICY .* ON "${table}"\\s*\\n\\s*USING \\(?"${column}" =`,
        'i',
      );
      expect(sql).toMatch(policy);
    });
  }
});
