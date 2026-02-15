/**
 * Email Sync — Microsoft Graph API
 * 
 * Handles email synchronization using incremental delta queries.
 * Stores only metadata — NO raw email bodies per PRD.
 */

import { Message } from "@microsoft/microsoft-graph-types";
import { getGraphClientForUser } from "./graphClient";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

interface EmailSyncResult {
  synced: number;
  deltaToken: string | null;
  errors: number;
}

/**
 * Perform initial full sync of emails (last 7 days from Inbox)
 */
export async function syncEmailsInitial(userId: string): Promise<EmailSyncResult> {
  try {
    const client = await getGraphClientForUser(userId);
    
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const filterDate = sevenDaysAgo.toISOString();

    // Fetch emails from Inbox only, last 7 days
    const response = await client
      .api("/me/mailFolders/Inbox/messages")
      .select(
        "id,subject,from,toRecipients,ccRecipients,receivedDateTime,hasAttachments,importance,isRead,bodyPreview"
      )
      .filter(`receivedDateTime ge ${filterDate}`)
      .top(200)
      .orderby("receivedDateTime desc")
      .get();

    const messages: Message[] = response.value;
    let synced = 0;
    let errors = 0;

    logger.info("Starting initial email sync", { userId, count: messages.length });

    // Process each message
    for (const message of messages) {
      try {
        await storeEmailMetadata(userId, message);
        synced++;
      } catch (error) {
        logger.error("Failed to store email", error, { messageId: message.id });
        errors++;
      }
    }

    // Get delta token for incremental sync
    const deltaResponse = await client
      .api("/me/mailFolders/Inbox/messages/delta")
      .select(
        "id,subject,from,toRecipients,ccRecipients,receivedDateTime,hasAttachments,importance,isRead,bodyPreview"
      )
      .get();

    const deltaToken = extractDeltaToken(deltaResponse);

    // Store delta token
    await supabaseAdmin
      .from("microsoft_accounts")
      .update({
        delta_token_email: deltaToken,
        last_sync_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    logger.info("Initial email sync complete", { userId, synced, errors });

    return { synced, deltaToken, errors };
  } catch (error) {
    logger.error("Initial email sync failed", error, { userId });
    throw error;
  }
}

/**
 * Perform incremental sync using delta token
 */
export async function syncEmailsIncremental(userId: string): Promise<EmailSyncResult> {
  try {
    const client = await getGraphClientForUser(userId);

    // Get stored delta token
    const { data: account } = await supabaseAdmin
      .from("microsoft_accounts")
      .select("delta_token_email")
      .eq("user_id", userId)
      .single();

    if (!account?.delta_token_email) {
      logger.warn("No delta token found, performing initial sync", { userId });
      return await syncEmailsInitial(userId);
    }

    // Use delta token to get only changes
    const deltaUrl = account.delta_token_email;
    const response = await client.api(deltaUrl).get();

    const messages: Message[] = response.value;
    let synced = 0;
    let errors = 0;

    logger.info("Starting incremental email sync", { userId, count: messages.length });

    // Process each message
    for (const message of messages) {
      try {
        // Check if message was deleted
        if ((message as any)["@removed"]) {
          await deleteEmailMetadata(userId, message.id!);
          synced++;
        } else {
          await storeEmailMetadata(userId, message);
          synced++;
        }
      } catch (error) {
        logger.error("Failed to process email delta", error, { messageId: message.id });
        errors++;
      }
    }

    // Extract and store new delta token
    const newDeltaToken = extractDeltaToken(response);

    await supabaseAdmin
      .from("microsoft_accounts")
      .update({
        delta_token_email: newDeltaToken,
        last_sync_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    logger.info("Incremental email sync complete", { userId, synced, errors });

    return { synced, deltaToken: newDeltaToken, errors };
  } catch (error) {
    logger.error("Incremental email sync failed", error, { userId });
    throw error;
  }
}

/**
 * Store email metadata in database (NO raw body)
 */
async function storeEmailMetadata(userId: string, message: Message): Promise<void> {
  const toEmails = message.toRecipients?.map((r) => r.emailAddress?.address).filter(Boolean) || [];
  const ccEmails = message.ccRecipients?.map((r) => r.emailAddress?.address).filter(Boolean) || [];

  // Use bodyPreview (first ~150 chars) as snippet - NO full body
  const snippet = message.bodyPreview?.substring(0, 200) || "";

  const { error } = await supabaseAdmin
    .from("emails_metadata")
    .upsert(
      {
        user_id: userId,
        microsoft_message_id: message.id!,
        subject: message.subject || "(No Subject)",
        from_email: message.from?.emailAddress?.address || "",
        from_name: message.from?.emailAddress?.name,
        to_emails: toEmails,
        cc_emails: ccEmails,
        snippet,
        received_at: message.receivedDateTime!,
        has_attachments: message.hasAttachments || false,
        importance: message.importance || "normal",
        is_read: message.isRead || false,
      },
      {
        onConflict: "user_id,microsoft_message_id",
      }
    );

  if (error) {
    throw error;
  }
}

/**
 * Delete email metadata (when email is deleted in Microsoft 365)
 */
async function deleteEmailMetadata(userId: string, messageId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("emails_metadata")
    .delete()
    .eq("user_id", userId)
    .eq("microsoft_message_id", messageId);

  if (error) {
    throw error;
  }
}

/**
 * Extract delta token from Graph API response
 */
function extractDeltaToken(response: any): string | null {
  // Delta token is in @odata.deltaLink or @odata.nextLink
  return response["@odata.deltaLink"] || response["@odata.nextLink"] || null;
}
