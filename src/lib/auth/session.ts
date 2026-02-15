/**
 * Session Utilities
 * 
 * Helper functions for working with NextAuth sessions.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

/**
 * Get the current session (server-side only)
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Require authentication - redirect to sign in if not authenticated
 */
export async function requireAuth() {
  const session = await getSession();
  
  if (!session || !session.user) {
    redirect("/auth/signin");
  }
  
  return session;
}

/**
 * Get the current user ID - throw if not authenticated
 */
export async function getCurrentUserId(): Promise<string> {
  const session = await requireAuth();
  
  if (!session.user?.id) {
    throw new Error("User ID not found in session");
  }
  
  return session.user.id;
}
