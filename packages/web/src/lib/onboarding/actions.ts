'use server';

import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { createDb, withTenant } from '@/lib/db';
import { account, auditEvent, entity, moduleState, user } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { buildAuditEvent } from '@/lib/audit';

const db = createDb(env.DATABASE_URL ?? '');

const onboardSchema = z.object({
  accountName: z.string().min(1).max(255),
  userEmail: z.string().email(),
  userName: z.string().min(1).max(255),
});

/**
 * Seed a new tenant account, the first admin user, a default Personal entity,
 * and enable the Productivity module. This is a one-time onboarding step; in
 * production it will be gated by Cognito post-confirmation triggers or admin
 * approval and will link the Cognito sub to the user row.
 */
export async function onboardTenant(input: z.input<typeof onboardSchema>) {
  const data = onboardSchema.parse(input);

  // Onboarding runs outside a normal tenant context, so we create the account
  // first and then use its id as the tenant for the remaining rows.
  const [newAccount] = await db.insert(account).values({ name: data.accountName }).returning();
  const tenant = { accountId: newAccount.id, userId: '' };

  return withTenant(db, tenant, async (tx) => {
    const [newUser] = await tx
      .insert(user)
      .values({
        accountId: newAccount.id,
        email: data.userEmail,
        name: data.userName,
        role: 'admin',
      })
      .returning();

    // Re-set the context with the real user id for audit logging.
    await tx.execute(sql`SELECT set_config('app.user_id', ${newUser.id}::text, true)`);

    await tx.insert(entity).values({
      accountId: newAccount.id,
      name: 'Personal',
      kind: 'personal',
    });

    await tx.insert(moduleState).values({
      accountId: newAccount.id,
      module: 'productivity',
      enabled: true,
      enabledAt: new Date(),
    });

    await tx.insert(auditEvent).values(
      buildAuditEvent(
        { accountId: newAccount.id, userId: newUser.id },
        {
          action: 'tenant.onboard',
          targetType: 'account',
          targetId: newAccount.id,
          after: { accountName: data.accountName, userEmail: data.userEmail },
        },
      ),
    );

    return { account: newAccount, user: newUser };
  });
}
