import { and, eq, isNull, sql } from 'drizzle-orm';

import type { Session } from '@/lib/auth';
import { createDb } from '@/lib/db';
import { platformAdmin, user } from '@/lib/db/schema';
import { env } from '@/lib/env';

export type ResolvedAuthSession = {
  session: Session;
  isPlatformAdmin: boolean;
};

/**
 * Enrich a Cognito identity with tenant ids when the user already belongs to
 * an account. Uses `app.actor_sub` so the RLS self-lookup policy can match
 * without knowing `account_id` yet.
 */
export async function resolveSessionTenant(base: Session): Promise<ResolvedAuthSession> {
  if (!env.DATABASE_URL?.trim()) {
    return { session: base, isPlatformAdmin: false };
  }

  const db = createDb(env.DATABASE_URL);

  const [admin] = await db
    .select({ id: platformAdmin.id })
    .from(platformAdmin)
    .where(and(eq(platformAdmin.cognitoSub, base.sub), isNull(platformAdmin.revokedAt)))
    .limit(1);

  if (admin) {
    return { session: base, isPlatformAdmin: true };
  }

  const session = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.actor_sub', ${base.sub}::text, true)`);
    const [row] = await tx
      .select({
        id: user.id,
        accountId: user.accountId,
        role: user.role,
        name: user.name,
      })
      .from(user)
      .where(eq(user.cognitoSub, base.sub))
      .limit(1);

    if (!row) return base;

    return {
      ...base,
      accountId: row.accountId,
      userId: row.id,
      role: row.role,
      name: row.name ?? base.name,
    };
  });

  return { session, isPlatformAdmin: false };
}
