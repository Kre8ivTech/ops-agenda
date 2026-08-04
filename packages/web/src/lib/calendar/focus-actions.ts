'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { createDb, withTenant } from '@/lib/db';
import { connection, calendarEvent } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { decryptTokens, encryptTokens } from '@/lib/connectors';
import { MicrosoftConnector } from '@/lib/connectors/microsoft';

function getDb() {
  return createDb(env.DATABASE_URL);
}

async function requireTenant() {
  const session = await getSession();
  if (!session?.accountId || !session?.userId) {
    throw new Error('Not signed in');
  }
  return { accountId: session.accountId, userId: session.userId };
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const applyFocusBlockSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  title: z.string().min(1).max(200).default('Focus time'),
});

const dismissFocusBlockSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

// ---------------------------------------------------------------------------
// Get a valid token for calendar write
// ---------------------------------------------------------------------------

async function getCalendarToken(
  tenant: { accountId: string; userId: string },
): Promise<{ token: string; connectionId: string; email: string } | null> {
  const db = getDb();

  const conns = await withTenant(db, tenant, async (tx) =>
    tx.select().from(connection)
      .where(and(eq(connection.kind, 'calendar'), eq(connection.provider, 'microsoft'), isNull(connection.deletedAt))),
  );

  if (conns.length === 0) return null;
  const conn = conns[0];

  if (!conn.accessTokenEnc || !conn.tokenIv || !conn.tokenAuthTag) return null;

  let decrypted: string;
  try {
    decrypted = await decryptTokens(conn.accessTokenEnc, conn.tokenIv, conn.tokenAuthTag);
  } catch {
    return null;
  }

  const parsed = JSON.parse(decrypted);
  let accessToken = parsed.access_token;
  const refreshToken = parsed.refresh_token;

  // Refresh if expired
  const isExpired = conn.tokenExpiresAt && conn.tokenExpiresAt.getTime() < Date.now() + 60 * 1000;
  if (isExpired && refreshToken) {
    try {
      const refreshed = await MicrosoftConnector.refreshAccessToken(refreshToken);
      accessToken = refreshed.accessToken;

      // Persist new tokens
      const newPayload = JSON.stringify({ access_token: refreshed.accessToken, refresh_token: refreshed.refreshToken });
      const { encrypted, iv, authTag } = await encryptTokens(newPayload);
      await withTenant(db, tenant, async (tx) => {
        await tx.update(connection).set({
          accessTokenEnc: encrypted,
          refreshTokenEnc: encrypted,
          tokenIv: iv,
          tokenAuthTag: authTag,
          tokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
          updatedAt: new Date(),
        }).where(eq(connection.id, conn.id));
      });
    } catch {
      return null;
    }
  }

  return { token: accessToken, connectionId: conn.id, email: conn.externalAccountRef ?? '' };
}

// ---------------------------------------------------------------------------
// Apply: Create event in Outlook
// ---------------------------------------------------------------------------

export async function applyFocusBlock(input: z.input<typeof applyFocusBlockSchema>): Promise<{
  success: boolean;
  error?: string;
}> {
  const tenant = await requireTenant();
  const data = applyFocusBlockSchema.parse(input);

  const creds = await getCalendarToken(tenant);
  if (!creds) {
    return { success: false, error: 'No calendar connection found. Connect Microsoft 365 in Settings.' };
  }

  const startDateTime = `${data.date}T${data.startTime}:00`;
  const endDateTime = `${data.date}T${data.endTime}:00`;

  // Create event via Microsoft Graph
  const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${creds.token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      subject: data.title,
      start: { dateTime: startDateTime, timeZone: 'UTC' },
      end: { dateTime: endDateTime, timeZone: 'UTC' },
      showAs: 'busy',
      isReminderOn: false,
      categories: ['Focus time'],
      body: {
        contentType: 'text',
        content: 'Protected focus block created by Ops Agenda.',
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { success: false, error: `Graph API ${res.status}: ${text.slice(0, 100)}` };
  }

  const created = await res.json();

  // Store locally in calendar_event table
  const db = getDb();
  await withTenant(db, tenant, async (tx) => {
    await tx.insert(calendarEvent).values({
      accountId: tenant.accountId,
      connectionId: creds.connectionId,
      externalId: created.id,
      title: data.title,
      startAt: new Date(startDateTime + 'Z'),
      endAt: new Date(endDateTime + 'Z'),
      isAllDay: false,
      organizer: creds.email,
      calendarName: 'Protected',
      calendarColor: 'green',
      webLink: created.webLink ?? null,
    }).onConflictDoUpdate({
      target: [calendarEvent.accountId, calendarEvent.externalId],
      set: { title: data.title, updatedAt: new Date() },
    });
  });

  revalidatePath('/productivity/calendar');
  return { success: true };
}

// ---------------------------------------------------------------------------
// Dismiss: Track dismissed suggestions locally
// ---------------------------------------------------------------------------

// We store dismissed suggestions in calendar_event with a special marker
// so they don't get re-suggested. Using a convention: externalId = "dismissed:{date}:{start}-{end}"

export async function dismissFocusBlock(input: z.input<typeof dismissFocusBlockSchema>): Promise<{
  success: boolean;
}> {
  const tenant = await requireTenant();
  const data = dismissFocusBlockSchema.parse(input);
  const db = getDb();

  const dismissKey = `dismissed:${data.date}:${data.startTime}-${data.endTime}`;

  await withTenant(db, tenant, async (tx) => {
    await tx.insert(calendarEvent).values({
      accountId: tenant.accountId,
      externalId: dismissKey,
      title: `[Dismissed] Focus ${data.startTime}–${data.endTime}`,
      startAt: new Date(`${data.date}T${data.startTime}:00Z`),
      endAt: new Date(`${data.date}T${data.endTime}:00Z`),
      isAllDay: false,
      calendarName: 'Dismissed',
      calendarColor: 'gray',
    }).onConflictDoUpdate({
      target: [calendarEvent.accountId, calendarEvent.externalId],
      set: { updatedAt: new Date() },
    });
  });

  revalidatePath('/productivity/calendar');
  return { success: true };
}

// ---------------------------------------------------------------------------
// Check dismissed: filter out already-dismissed suggestions
// ---------------------------------------------------------------------------

export async function getDismissedSlots(_startOfWeek: string, _endOfWeek: string): Promise<string[]> {
  const tenant = await requireTenant();
  const db = getDb();

  const rows = await withTenant(db, tenant, async (tx) =>
    tx.select({ externalId: calendarEvent.externalId })
      .from(calendarEvent)
      .where(and(
        eq(calendarEvent.accountId, tenant.accountId),
        eq(calendarEvent.calendarName, 'Dismissed'),
      )),
  );

  return rows.map((r) => r.externalId);
}
