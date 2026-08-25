import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = join(
  dirname(import.meta.filename),
  '../../../drizzle/0010_perpetual_spectrum.sql',
);
const migration = readFileSync(migrationPath, 'utf8');

describe('connection entity migration', () => {
  it('adds the entity relationship and lookup index', () => {
    expect(migration).toContain('ADD COLUMN "entity_id" uuid');
    expect(migration).toContain('connection_entity_id_entity_id_fk');
    expect(migration).toContain('connection_entity_id_idx');
  });

  it('backfills existing connections to their Personal entity', () => {
    expect(migration).toContain('"entity"."kind" = \'personal\'');
    expect(migration).toContain('WHERE "current_connection"."entity_id" IS NULL');
  });
});
