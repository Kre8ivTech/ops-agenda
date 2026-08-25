import 'server-only';

import { asc, eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

import { getSession } from '@/lib/auth';
import { createDb, withTenant } from '@/lib/db';
import { entity } from '@/lib/db/schema';
import { env } from '@/lib/env';

export const ENTITY_SELECTION_COOKIE = 'ops_agenda_entity_id';

export interface EntityOption {
  id: string;
  name: string;
  kind: 'personal' | 'llc' | 'corp' | 'sole_prop' | 'nonprofit';
}

export async function getEntitySelection(): Promise<{
  entities: EntityOption[];
  selectedEntityId: string | 'all';
}> {
  const session = await getSession();
  if (!session?.accountId || !session?.userId) {
    return { entities: [], selectedEntityId: 'all' };
  }

  const tenant = { accountId: session.accountId, userId: session.userId };
  const db = createDb(env.DATABASE_URL);
  const entities = await withTenant(db, tenant, async (tx) =>
    tx
      .select({ id: entity.id, name: entity.name, kind: entity.kind })
      .from(entity)
      .where(eq(entity.accountId, tenant.accountId))
      .orderBy(asc(entity.name)),
  );

  const cookieStore = await cookies();
  const requested = cookieStore.get(ENTITY_SELECTION_COOKIE)?.value;
  if (requested === 'all') return { entities, selectedEntityId: 'all' };

  const selected = entities.find((item) => item.id === requested);
  if (selected) return { entities, selectedEntityId: selected.id };

  const personal = entities.find((item) => item.kind === 'personal');
  return { entities, selectedEntityId: personal?.id ?? 'all' };
}

export async function listEntities(): Promise<EntityOption[]> {
  return (await getEntitySelection()).entities;
}

export async function getSelectedEntityId(): Promise<string | null> {
  const selected = (await getEntitySelection()).selectedEntityId;
  return selected === 'all' ? null : selected;
}
