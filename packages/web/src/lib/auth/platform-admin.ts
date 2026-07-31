import { and, eq, isNull } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { createDb } from '@/lib/db';
import { platformAdmin } from '@/lib/db/schema';
import { env } from '@/lib/env';

export interface PlatformAdminIdentity {
  cognitoSub: string;
  email: string;
  name: string | null;
}

/**
 * Authoritative check for platform-operator access: membership in the
 * `platform_admin` table, keyed by Cognito sub. This is independent of any
 * per-tenant `user.role` value — a platform admin may or may not also belong
 * to a tenant account.
 *
 * Throws if the caller is not signed in or is not an active platform admin.
 * Every `/admin` route and admin server action must call this before doing
 * any cross-tenant read or write.
 */
export async function requirePlatformAdmin(): Promise<PlatformAdminIdentity> {
  const session = await getSession();
  if (!session?.sub) {
    throw new Error('You must be signed in');
  }

  const db = createDb(env.DATABASE_URL);
  const [admin] = await db
    .select()
    .from(platformAdmin)
    .where(and(eq(platformAdmin.cognitoSub, session.sub), isNull(platformAdmin.revokedAt)));

  if (!admin) {
    throw new Error('Forbidden: platform admin access required');
  }

  return { cognitoSub: admin.cognitoSub, email: admin.email, name: admin.name };
}

/** Non-throwing variant for layout-level UI checks (e.g. hiding a nav link). */
export async function isPlatformAdmin(): Promise<boolean> {
  try {
    await requirePlatformAdmin();
    return true;
  } catch {
    return false;
  }
}
