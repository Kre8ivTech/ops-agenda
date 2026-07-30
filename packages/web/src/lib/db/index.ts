import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from './schema';

let pool: Pool | null = null;

export type Database = ReturnType<typeof createDb>;
export type Transaction = Parameters<Database['transaction']>[0] extends (tx: infer T) => unknown
  ? T
  : never;

export function createDb(connectionString: string) {
  if (!pool) {
    pool = new Pool({ connectionString });
  }
  return drizzle(pool, { schema, logger: process.env.NODE_ENV === 'development' });
}

/**
 * Execute a callback inside a PostgreSQL transaction with the tenant context
 * variables set. RLS policies in every tenant table read these variables and
 * enforce that rows belong to the current account_id.
 *
 * The context is set with `is_local = true` so it is scoped to the transaction
 * and cannot leak across pooled connections.
 */
export async function withTenant<T>(
  db: Database,
  tenant: { accountId: string; userId: string },
  callback: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('app.account_id', ${tenant.accountId}::text, true), set_config('app.user_id', ${tenant.userId}::text, true)`,
    );
    return callback(tx);
  });
}
