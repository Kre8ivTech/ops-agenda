'use server';

import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { createDb, withTenant } from '@/lib/db';
import { connection, emailMessage, emailThread, calendarEvent } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { decryptTokens, encryptTokens } from '@/lib/connectors';
import { MicrosoftConnector } from '@/lib/connectors/microsoft';
import { GoogleConnector } from '@/lib/connectors/google';
import { rankEmailThreads } from '@/lib/ai/email-rank';
import { generatePrepSuggestions } from '@/lib/ai/calendar-prep';
import { detectConflicts } from '@/lib/calendar/actions';

function getDb() { return createDb(env.DATABASE_URL); }

async function requireTenant() {
  const session = await getSession();
  if (!session?.accountId || !session?.userId) throw new Error('Not signed in');
  return { accountId: session.accountId, userId: session.userId };
}

/**
 * Decrypt the stored token payload and return accessToken + refreshToken.
 */
function parseTokenPayload(decrypted: string): { accessToken: string | null; refreshToken: string | null } {
  try {
    const parsed = JSON.parse(decrypted);
    return {
      accessToken: parsed.access_token ?? null,
      refreshToken: parsed.refresh_token ?? null,
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

/**
 * Get a valid access token for a connection, refreshing if expired.
 */
async function getValidToken(
  conn: typeof connection.$inferSelect,
  tenant: { accountId: string; userId: string },
  db: ReturnType<typeof createDb>,
): Promise<string | null> {
  if (!conn.accessTokenEnc || !conn.tokenIv || !conn.tokenAuthTag) return null;

  let decrypted: string;
  try {
    decrypted = await decryptTokens(conn.accessTokenEnc, conn.tokenIv, conn.tokenAuthTag);
  } catch {
    return null;
  }

  const { accessToken, refreshToken } = parseTokenPayload(decrypted);
  if (!accessToken) return null;

  // Check if token is still valid (with 5 min buffer)
  const isExpired = conn.tokenExpiresAt && conn.tokenExpiresAt.getTime() < Date.now() + 5 * 60 * 1000;

  if (!isExpired) return accessToken;

  // Token expired — try to refresh
  if (!refreshToken) return null;

  try {
    if (conn.provider === 'microsoft') {
      const refreshed = await MicrosoftConnector.refreshAccessToken(refreshToken);

      // Re-encrypt the new tokens
      const newPayload = JSON.stringify({
        access_token: refreshed.accessToken,
        refresh_token: refreshed.refreshToken,
      });
      const { encrypted, iv, authTag } = await encryptTokens(newPayload);
      const newExpires = new Date(Date.now() + refreshed.expiresIn * 1000);

      // Update the connection with new tokens
      await withTenant(db, tenant, async (tx) => {
        await tx.update(connection).set({
          accessTokenEnc: encrypted,
          refreshTokenEnc: encrypted,
          tokenIv: iv,
          tokenAuthTag: authTag,
          tokenExpiresAt: newExpires,
          updatedAt: new Date(),
        }).where(eq(connection.id, conn.id));
      });

      return refreshed.accessToken;
    }

    if (conn.provider === 'google') {
      const refreshed = await GoogleConnector.refreshAccessToken(refreshToken);

      const newPayload = JSON.stringify({
        access_token: refreshed.accessToken,
        refresh_token: refreshed.refreshToken,
      });
      const { encrypted, iv, authTag } = await encryptTokens(newPayload);
      const newExpires = new Date(Date.now() + refreshed.expiresIn * 1000);

      await withTenant(db, tenant, async (tx) => {
        await tx.update(connection).set({
          accessTokenEnc: encrypted,
          refreshTokenEnc: encrypted,
          tokenIv: iv,
          tokenAuthTag: authTag,
          tokenExpiresAt: newExpires,
          updatedAt: new Date(),
        }).where(eq(connection.id, conn.id));
      });

      return refreshed.accessToken;
    }
  } catch {
    // Refresh failed — token is dead
    return null;
  }

  return accessToken;
}

// ---------------------------------------------------------------------------
// Microsoft Graph message type (subset we select)
// ---------------------------------------------------------------------------
interface GraphMessage {
  id: string;
  conversationId: string;
  subject: string;
  from: { emailAddress: { address: string; name: string } } | null;
  receivedDateTime: string;
  isRead: boolean;
  hasAttachments: boolean;
  webLink: string;
  sender?: { emailAddress: { address: string; name: string } } | null;
}

export async function syncEmails(): Promise<{ synced: number; errors: string[] }> {
  const tenant = await requireTenant();
  const db = getDb();
  const errors: string[] = [];
  let synced = 0;
  const upsertedThreadIds: string[] = [];

  const conns = await withTenant(db, tenant, async (tx) =>
    tx.select().from(connection).where(and(eq(connection.kind, 'mail'), isNull(connection.deletedAt))),
  );

  for (const conn of conns) {
    try {
      const token = await getValidToken(conn, tenant, db);
      if (!token) { errors.push(`${conn.provider}: no access token`); continue; }

      if (conn.provider === 'microsoft') {
        // Fetch messages WITH conversationId for thread grouping
        const res = await fetch(
          'https://graph.microsoft.com/v1.0/me/messages?$top=50&$orderby=receivedDateTime desc&$select=id,conversationId,subject,from,sender,receivedDateTime,isRead,hasAttachments,webLink',
          { headers: { authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error(`Graph ${res.status}: ${(await res.text()).slice(0, 80)}`);
        const msgs: GraphMessage[] = (await res.json()).value ?? [];

        // 1. Upsert individual messages into emailMessage
        await withTenant(db, tenant, async (tx) => {
          for (const m of msgs) {
            await tx.insert(emailMessage).values({
              accountId: tenant.accountId,
              connectionId: conn.id,
              externalId: m.id,
              fromAddress: m.from?.emailAddress?.address ?? '',
              fromName: m.from?.emailAddress?.name ?? '',
              subject: m.subject ?? '(no subject)',
              receivedAt: new Date(m.receivedDateTime),
              isRead: m.isRead,
              hasAttachments: m.hasAttachments,
              webLink: m.webLink ?? '',
            }).onConflictDoUpdate({
              target: [emailMessage.accountId, emailMessage.externalId],
              set: { isRead: m.isRead },
            });
          }
        });

        // 2. Group messages by conversationId and upsert into emailThread
        const threadMap = new Map<string, GraphMessage[]>();
        for (const m of msgs) {
          const threadId = m.conversationId ?? m.id; // fallback to message ID if no conversation
          const existing = threadMap.get(threadId) ?? [];
          existing.push(m);
          threadMap.set(threadId, existing);
        }

        await withTenant(db, tenant, async (tx) => {
          for (const [externalThreadId, messages] of threadMap) {
            // Sort messages in thread by date (newest first)
            messages.sort((a, b) =>
              new Date(b.receivedDateTime).getTime() - new Date(a.receivedDateTime).getTime(),
            );

            const newest = messages[0];
            const participants = [...new Set(
              messages.map((m) => m.from?.emailAddress?.address).filter(Boolean),
            )].join(', ');

            const [upserted] = await tx.insert(emailThread).values({
              accountId: tenant.accountId,
              connectionId: conn.id,
              externalThreadId,
              subject: newest.subject ?? '(no subject)',
              participants,
              messageCount: String(messages.length),
              lastMessageAt: new Date(newest.receivedDateTime),
              webLink: newest.webLink ?? null,
            }).onConflictDoUpdate({
              target: [emailThread.accountId, emailThread.externalThreadId],
              set: {
                subject: newest.subject ?? '(no subject)',
                participants,
                messageCount: String(messages.length),
                lastMessageAt: new Date(newest.receivedDateTime),
                webLink: newest.webLink ?? null,
                updatedAt: new Date(),
              },
            }).returning({ id: emailThread.id });

            if (upserted) {
              upsertedThreadIds.push(upserted.id);
            }
          }
        });

        synced += msgs.length;
      }

      if (conn.provider === 'google') {
        // 1. List message IDs from Gmail (last 7 days)
        const listRes = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=newer_than:7d',
          { headers: { authorization: `Bearer ${token}` } },
        );
        if (!listRes.ok) throw new Error(`Gmail list ${listRes.status}: ${(await listRes.text()).slice(0, 80)}`);
        const messageIds: { id: string; threadId: string }[] = (await listRes.json()).messages ?? [];

        // 2. Fetch metadata for each message
        interface GmailMessage {
          id: string;
          threadId: string;
          from: string;
          subject: string;
          date: string;
        }
        const gmailMessages: GmailMessage[] = [];

        for (const entry of messageIds) {
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${entry.id}?format=metadata&metadataHeaders=From,Subject,Date`,
            { headers: { authorization: `Bearer ${token}` } },
          );
          if (!msgRes.ok) continue;
          const msgData = await msgRes.json();

          const headers: { name: string; value: string }[] = msgData.payload?.headers ?? [];
          const getHeader = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';

          gmailMessages.push({
            id: msgData.id,
            threadId: msgData.threadId,
            from: getHeader('From'),
            subject: getHeader('Subject'),
            date: getHeader('Date'),
          });
        }

        // 3. Upsert individual messages into emailMessage
        await withTenant(db, tenant, async (tx) => {
          for (const m of gmailMessages) {
            // Parse "Name <email>" format
            const fromMatch = m.from.match(/^(.+?)\s*<(.+?)>$/);
            const fromName = fromMatch ? fromMatch[1].trim().replace(/^"|"$/g, '') : m.from;
            const fromAddress = fromMatch ? fromMatch[2] : m.from;

            await tx.insert(emailMessage).values({
              accountId: tenant.accountId,
              connectionId: conn.id,
              externalId: m.id,
              fromAddress,
              fromName,
              subject: m.subject || '(no subject)',
              receivedAt: m.date ? new Date(m.date) : new Date(),
              isRead: true, // Gmail API does not return read status in metadata format
              hasAttachments: false,
              webLink: `https://mail.google.com/mail/u/0/#inbox/${m.id}`,
            }).onConflictDoUpdate({
              target: [emailMessage.accountId, emailMessage.externalId],
              set: { isRead: true },
            });
          }
        });

        // 4. Group messages by threadId and upsert into emailThread
        const threadMap = new Map<string, GmailMessage[]>();
        for (const m of gmailMessages) {
          const existing = threadMap.get(m.threadId) ?? [];
          existing.push(m);
          threadMap.set(m.threadId, existing);
        }

        await withTenant(db, tenant, async (tx) => {
          for (const [externalThreadId, messages] of threadMap) {
            // Sort messages in thread by date (newest first)
            messages.sort((a, b) =>
              new Date(b.date).getTime() - new Date(a.date).getTime(),
            );

            const newest = messages[0];
            const participants = [...new Set(
              messages.map((m) => {
                const match = m.from.match(/<(.+?)>/);
                return match ? match[1] : m.from;
              }).filter(Boolean),
            )].join(', ');

            const [upserted] = await tx.insert(emailThread).values({
              accountId: tenant.accountId,
              connectionId: conn.id,
              externalThreadId,
              subject: newest.subject || '(no subject)',
              participants,
              messageCount: String(messages.length),
              lastMessageAt: newest.date ? new Date(newest.date) : new Date(),
              webLink: `https://mail.google.com/mail/u/0/#inbox/${externalThreadId}`,
            }).onConflictDoUpdate({
              target: [emailThread.accountId, emailThread.externalThreadId],
              set: {
                subject: newest.subject || '(no subject)',
                participants,
                messageCount: String(messages.length),
                lastMessageAt: newest.date ? new Date(newest.date) : new Date(),
                webLink: `https://mail.google.com/mail/u/0/#inbox/${externalThreadId}`,
                updatedAt: new Date(),
              },
            }).returning({ id: emailThread.id });

            if (upserted) {
              upsertedThreadIds.push(upserted.id);
            }
          }
        });

        synced += gmailMessages.length;
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

  // Trigger AI ranking on upserted threads (non-blocking — errors won't fail the sync)
  if (upsertedThreadIds.length > 0) {
    rankEmailThreads(tenant, upsertedThreadIds).catch((err) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[sync] AI ranking failed:', err instanceof Error ? err.message : err);
      }
    });
  }

  revalidatePath('/productivity/email');
  return { synced, errors };
}

export async function syncCalendar(): Promise<{ synced: number; errors: string[] }> {
  const tenant = await requireTenant();
  const db = getDb();
  const errors: string[] = [];
  let synced = 0;
  const upsertedEventIds: string[] = [];

  const now = new Date();
  const start = new Date(now); start.setDate(start.getDate() - 1);
  const end = new Date(now); end.setDate(end.getDate() + 6);

  const conns = await withTenant(db, tenant, async (tx) =>
    tx.select().from(connection).where(and(eq(connection.kind, 'calendar'), isNull(connection.deletedAt))),
  );

  for (const conn of conns) {
    try {
      const token = await getValidToken(conn, tenant, db);
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
            const [upserted] = await tx.insert(calendarEvent).values({
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
            }).returning({ id: calendarEvent.id });
            if (upserted) upsertedEventIds.push(upserted.id);
          }
        });
        synced += events.length;
      }

      if (conn.provider === 'google') {
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&maxResults=100&singleEvents=true&orderBy=startTime`,
          { headers: { authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error(`Google Calendar ${res.status}: ${(await res.text()).slice(0, 80)}`);
        const events: Array<{
          id: string;
          summary?: string;
          start: { dateTime?: string; date?: string };
          end: { dateTime?: string; date?: string };
          location?: string;
          organizer?: { email?: string; displayName?: string };
          attendees?: Array<{ email: string; responseStatus?: string }>;
          htmlLink?: string;
        }> = (await res.json()).items ?? [];

        await withTenant(db, tenant, async (tx) => {
          for (const e of events) {
            const isAllDay = !e.start.dateTime;
            const startAt = new Date(e.start.dateTime ?? e.start.date ?? new Date().toISOString());
            const endAt = new Date(e.end.dateTime ?? e.end.date ?? new Date().toISOString());

            await tx.insert(calendarEvent).values({
              accountId: tenant.accountId,
              connectionId: conn.id,
              externalId: e.id,
              title: e.summary ?? '(no title)',
              location: e.location || null,
              startAt,
              endAt,
              isAllDay,
              organizer: e.organizer?.displayName ?? e.organizer?.email ?? null,
              attendeeCount: String(e.attendees?.length ?? 0),
              responseStatus: e.attendees?.find((a: { responseStatus?: string }) => a.responseStatus)?.responseStatus ?? 'none',
              webLink: e.htmlLink ?? null,
            }).onConflictDoUpdate({
              target: [calendarEvent.accountId, calendarEvent.externalId],
              set: {
                title: e.summary ?? '(no title)',
                startAt,
                endAt,
                updatedAt: new Date(),
              },
            }).returning({ id: calendarEvent.id }).then(([r]) => { if (r) upsertedEventIds.push(r.id); });
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
  // Post-sync: detect conflicts and generate prep suggestions (non-blocking)
  if (synced > 0) {
    const startStr = start.toISOString();
    const endStr = end.toISOString();

    // Detect conflicts (fast, no AI)
    detectConflicts({ startDate: startStr, endDate: endStr }).catch((err) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[sync] Conflict detection failed:', err instanceof Error ? err.message : err);
      }
    });

    // Generate AI prep suggestions (non-blocking)
    if (upsertedEventIds.length > 0) {
      generatePrepSuggestions(tenant, upsertedEventIds).catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[sync] Prep suggestions failed:', err instanceof Error ? err.message : err);
        }
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
