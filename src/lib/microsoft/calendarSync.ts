/**
 * Calendar Sync — Microsoft Graph API
 * 
 * Handles calendar event synchronization using incremental delta queries.
 * Supports multiple calendars per user.
 */

import { Event } from "@microsoft/microsoft-graph-types";
import { getGraphClientForUser } from "./graphClient";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

interface CalendarSyncResult {
  synced: number;
  deltaToken: string | null;
  errors: number;
}

/**
 * Perform initial full sync of calendar events (next 7 days)
 */
export async function syncCalendarInitial(userId: string): Promise<CalendarSyncResult> {
  try {
    const client = await getGraphClientForUser(userId);
    
    // Calculate date range (next 7 days)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    // Fetch events from all calendars
    const response = await client
      .api("/me/calendarView")
      .query({
        startDateTime: startDateStr,
        endDateTime: endDateStr,
      })
      .select(
        "id,subject,start,end,location,isOnlineMeeting,onlineMeetingUrl,attendees,isAllDay,organizer"
      )
      .top(200)
      .orderby("start/dateTime")
      .get();

    const events: Event[] = response.value;
    let synced = 0;
    let errors = 0;

    logger.info("Starting initial calendar sync", { userId, count: events.length });

    // Process each event
    for (const event of events) {
      try {
        await storeCalendarEvent(userId, event);
        synced++;
      } catch (error) {
        logger.error("Failed to store calendar event", error, { eventId: event.id });
        errors++;
      }
    }

    // Get delta token for incremental sync
    const deltaResponse = await client
      .api("/me/calendar/events/delta")
      .select(
        "id,subject,start,end,location,isOnlineMeeting,onlineMeetingUrl,attendees,isAllDay,organizer"
      )
      .get();

    const deltaToken = extractDeltaToken(deltaResponse);

    // Store delta token
    await supabaseAdmin
      .from("microsoft_accounts")
      .update({
        delta_token_calendar: deltaToken,
        last_sync_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    logger.info("Initial calendar sync complete", { userId, synced, errors });

    return { synced, deltaToken, errors };
  } catch (error) {
    logger.error("Initial calendar sync failed", error, { userId });
    throw error;
  }
}

/**
 * Perform incremental sync using delta token
 */
export async function syncCalendarIncremental(userId: string): Promise<CalendarSyncResult> {
  try {
    const client = await getGraphClientForUser(userId);

    // Get stored delta token
    const { data: account } = await supabaseAdmin
      .from("microsoft_accounts")
      .select("delta_token_calendar")
      .eq("user_id", userId)
      .single();

    if (!account?.delta_token_calendar) {
      logger.warn("No delta token found, performing initial sync", { userId });
      return await syncCalendarInitial(userId);
    }

    // Use delta token to get only changes
    const deltaUrl = account.delta_token_calendar;
    const response = await client.api(deltaUrl).get();

    const events: Event[] = response.value;
    let synced = 0;
    let errors = 0;

    logger.info("Starting incremental calendar sync", { userId, count: events.length });

    // Process each event
    for (const event of events) {
      try {
        // Check if event was deleted
        if ((event as any)["@removed"]) {
          await deleteCalendarEvent(userId, event.id!);
          synced++;
        } else {
          await storeCalendarEvent(userId, event);
          synced++;
        }
      } catch (error) {
        logger.error("Failed to process calendar delta", error, { eventId: event.id });
        errors++;
      }
    }

    // Extract and store new delta token
    const newDeltaToken = extractDeltaToken(response);

    await supabaseAdmin
      .from("microsoft_accounts")
      .update({
        delta_token_calendar: newDeltaToken,
        last_sync_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    logger.info("Incremental calendar sync complete", { userId, synced, errors });

    return { synced, deltaToken: newDeltaToken, errors };
  } catch (error) {
    logger.error("Incremental calendar sync failed", error, { userId });
    throw error;
  }
}

/**
 * Store calendar event metadata in database
 */
async function storeCalendarEvent(userId: string, event: Event): Promise<void> {
  const attendees = event.attendees?.map((a) => ({
    email: a.emailAddress?.address || "",
    name: a.emailAddress?.name || null,
    response_status: a.status?.response || "none",
  })) || [];

  const { error } = await supabaseAdmin
    .from("calendar_events")
    .upsert(
      {
        user_id: userId,
        microsoft_event_id: event.id!,
        subject: event.subject || "(No Title)",
        start_time: event.start?.dateTime!,
        end_time: event.end?.dateTime!,
        location: event.location?.displayName || null,
        is_online_meeting: event.isOnlineMeeting || false,
        join_url: event.onlineMeetingUrl || null,
        attendees: attendees,
        is_all_day: event.isAllDay || false,
        calendar_name: "Primary", // TODO: Get actual calendar name
      },
      {
        onConflict: "user_id,microsoft_event_id",
      }
    );

  if (error) {
    throw error;
  }
}

/**
 * Delete calendar event (when deleted in Microsoft 365)
 */
async function deleteCalendarEvent(userId: string, eventId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("calendar_events")
    .delete()
    .eq("user_id", userId)
    .eq("microsoft_event_id", eventId);

  if (error) {
    throw error;
  }
}

/**
 * Extract delta token from Graph API response
 */
function extractDeltaToken(response: any): string | null {
  return response["@odata.deltaLink"] || response["@odata.nextLink"] || null;
}
