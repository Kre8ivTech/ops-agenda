'use server';

import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { createDb, withTenant } from '@/lib/db';
import { connection, emailMessage, calendarEvent } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { decryptTokens } from '@/lib/connectors';

function getDb() { return createDb(env.DATABASE_URL); }

async function requireTenant() {
  const session = await getSession();
  if (!session?.accountId || !session?.userId) throw new Error('Not signed in');
  return { accountId: session.accountId, userId: session.userId };
}

async function getToken(conn: { accessTokenEnc: string | null; tokenIv: string | null; tokenAuthTag: string | null }): Promise<string | null> {
  if (!conn.accessTokenEnc || !conn.tokenIv || !conn.tokenAuthTag) return null;
  try {
    const d = await decryptTokens(conn.accessTokenEnc, conn.tokenIv, conn.tokenAuthTag);
    return JSON.parse(d).access_token ?? null;
  } catch { return null; }
}

export async function syncEmails(): Promise<{ synced: number; errors: string[] }> {
  const tenant = await requireTenant();
  const db = getDb();
  const errors: string[] = [];
  let synced = 0;

  const conns = await withTenant(db, tenant, async (tx) =>
    tx.select().from(connection).where(and(eq(connection.kind, 'mail'), isNull(connection.deletedAt))),
  );

  for (const conn of conns) {
    try {
      const token = await getToken(conn);
      if (!token) { errors.push(`${conn.provider}: no access token`); continue; }

      if (conn.provider === 'microsoft') {
        const res = await fetch(
          'https://graph.microsoft.com/v1.0/me/messages?$top=50&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,isRead,hasAttachments,webLink',
          { headers: { authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error(`Graph ${res.status}: ${(await res.text()).slice(0, 80)}`);
        const msgs = (await res.json()).value ?? [];

        await withTenant(db, tenant, async (tx) => {
          for (const m of msgs) {
            await tx.insert(emailMessage).values({
              accountId: tenant.accountId, connectionId: conn.id,
              externalId: m.id,
              fromAddress: m.from?.emailAddress?.address ?? '',
              fromName: m.from?.emailAddress?.name ?? '',
              subject: m.subject ?? '(no subject)',
              receivedAt: new Date(m.receivedDateTime),
              isRead: m.isRead, hasAttachments: m.hasAttachments,
              webLink: m.webLink ?? '',
            }).onConflictDoUpdate({
              target: [emailMessage.accountId, emailMessage.externalId],
              set: { isRead: m.isRead },
            });
          }
        });
        synced += msgs.length;
      }

      await withTenant(db, tenant, async (tx) => {
        await tx.update(connection).set({ lastSyncAt: new Date(), status: 'healthy', lastErrorCode: null }).where(eq(connection.id, conn.id));
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      errors.push(`${conn.provider}: ${msg}`);
      await withTenant(db, tenant, async (tx) => {
        await tx.update(connection).set({ status: 'degraded', lastErrorCode: msg.slice(0, 100) }).where(eq(connection.id, conn.id));
      });
    }
  }
  revalidatePath('/productivity/email');
  return { synced, errors };
}

export async function syncCalendar(): Promise<{ synced: number; errors: string[] }> {
  const tenant = await requireTenant();
  const db = getDb();
  const errors: string[] = [];
  let synced = 0;

  const now = new Date();
  const start = new Date(now); start.setDate(start.getDate() - 1);
  const end = new Date(now); end.setDate(end.getDate() + 6);

  const conns = await withTenant(db, tenant, async (tx) =>
    tx.select().from(connection).where(and(eq(connection.kind, 'calendar'), isNull(connection.deletedAt))),
  );

  for (const conn of conns) {
    try {
      const token = await getToken(conn);
      if (!token) { errors.push(`${conn.provider}: no access token`); continue; }

      if (conn.provider === 'microsoft') {
        const res = await fetch(
          `https://graph.microsoft.com/v1.0/me/calendarview?startdatetime=${start.toISOString()}&enddatetime=${end.toISOString()}&$top=100&$select=id,subject,start,end,location,isAllDay,organizer,attendees,webLink,responseStatus`,
          { headers: { authorization: `Bearer ${token}`, prefer: 'outlook.timezone="UTC"' } },
        );
        if (!res.ok) throw new Error(`Graph cal ${res.status}: ${(await res.text()).slice(0, 80)}`);
        const events = (await res.json()).value ?? [];

        await withTenant(db, tenant, async (tx) => {
          for (const e of events) {
            await tx.insert(calendarEvent).values({
              accountId: tenant.accountId, connectionId: conn.id,
              externalId: e.id, title: e.subject ?? '(no title)',
              location: e.location?.displayName || null,
              startAt: new Date(e.start.dateTime + 'Z'),
              endAt: new Date(e.end.dateTime + 'Z'),
              isAllDay: e.isAllDay,
              organizer: e.organizer?.emailAddress?.name ?? e.organizer?.emailAddress?.address ?? null,
              attendeeCount: String(e.attendees?.length ?? 0),
              responseStatus: e.responseStatus?.response ?? 'none',
              webLink: e.webLink ?? null,
            }).onConflictDoUpdate({
              target: [calendarEvent.accountId, calendarEvent.externalId],
              set: { title: e.subject ?? '(no title)', startAt: new Date(e.start.dateTime + 'Z'), endAt: new Date(e.end.dateTime + 'Z'), updatedAt: new Date() },
            });
          }
        });
        synced += events.length;
      }

      await withTenant(db, tenant, async (tx) => {
        await tx.update(connection).set({ lastSyncAt: new Date(), status: 'healthy', lastErrorCode: null }).where(eq(connection.id, conn.id));
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      errors.push(`${conn.provider}: ${msg}`);
      await withTenant(db, tenant, async (tx) => {
        await tx.update(connection).set({ status: 'degraded', lastErrorCode: msg.slice(0, 100) }).where(eq(connection.id, conn.id));
      });
    }
  }
  revalidatePath('/productivity/calendar');
  return { synced, errors };
}

export async function syncAll(): Promise<{ emails: number; events: number; errors: string[] }> {
  const [e, c] = await Promise.all([syncEmails(), syncCalendar()]);
  revalidatePath('/productivity/email');
  revalidatePath('/productivity/calendar');
  revalidatePath('/dashboard');
  return { emails: e.synced, events: c.synced, errors: [...e.errors, ...c.errors] };
}
