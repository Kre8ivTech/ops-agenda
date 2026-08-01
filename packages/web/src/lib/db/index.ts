import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from './schema';

let pool: Pool | null = null;

export type Database = ReturnType<typeof createDb>;
export type Transaction = Parameters<Database['transaction']>[0] extends (tx: infer T) => unknown
  ? T
  : never;

export function createDb(connectionString?: string) {
  if (!connectionString?.trim()) {
    throw new Error('DATABASE_URL is not configured');
  }
  if (!pool) {
    pool = new Pool({
      connectionString,
      // RDS requires encrypted connections (rds.force_ssl=1). The `pg` driver does
      // not parse sslmode from the URL by default, so we enable SSL explicitly in
      // production. `rejectUnauthorized: false` trusts the RDS-issued certificate
      // without bundling the AWS RDS CA; the connection is still encrypted.
      ...(process.env.NODE_ENV === 'production' && { ssl: { rejectUnauthorized: false } }),
    });
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

/**
 * Execute a callback with the acting platform admin's Cognito sub set in the
 * transaction. This does NOT set `app.account_id`, so normal tenant isolation
 * policies stay in effect; it only satisfies the additional `platform_admin_*`
 * read policies that let operators list rows across every account. Writes
 * still require `withTenant` scoped to a specific target account.
 */
export async function withPlatformAdmin<T>(
  db: Database,
  cognitoSub: string,
  callback: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.actor_sub', ${cognitoSub}::text, true)`);
    return callback(tx);
  });
}
