/**
 * Microsoft Graph API Client
 * 
 * Handles all interactions with Microsoft Graph API for email and calendar data.
 * Uses delegated permissions (Mail.Read, Calendars.Read).
 */

import { Client } from "@microsoft/microsoft-graph-client";
import { decrypt } from "@/lib/utils/encryption";
import { logger } from "@/lib/utils/logger";
import { supabaseAdmin } from "@/lib/supabase/server";

interface GraphClientOptions {
  accessToken: string;
}

/**
 * Create a Microsoft Graph client with the given access token
 */
export function createGraphClient({ accessToken }: GraphClientOptions): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

/**
 * Get a Graph client for a specific user
 * Fetches and decrypts the access token from database
 */
export async function getGraphClientForUser(userId: string): Promise<Client> {
  const { data: account, error } = await supabaseAdmin
    .from("microsoft_accounts")
    .select("access_token_encrypted, token_expires_at")
    .eq("user_id", userId)
    .single();

  if (error || !account) {
    logger.error("Failed to fetch Microsoft account", error, { userId });
    throw new Error("Microsoft account not found");
  }

  // Check if token is expired
  const expiresAt = new Date(account.token_expires_at);
  if (expiresAt < new Date()) {
    // TODO: Implement token refresh
    logger.warn("Access token expired", { userId });
    throw new Error("Access token expired. Please re-authenticate.");
  }

  // Decrypt access token
  const accessToken = decrypt(account.access_token_encrypted);

  return createGraphClient({ accessToken });
}

/**
 * Refresh an expired access token
 * TODO: Implement token refresh flow using refresh_token
 */
export async function refreshAccessToken(userId: string): Promise<string> {
  // TODO: Implement
  throw new Error("Token refresh not yet implemented");
}
