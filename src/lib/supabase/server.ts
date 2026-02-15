/**
 * Supabase Client — Server-Side
 * 
 * Use this client in API routes and server components.
 * Includes service role key for admin operations (bypasses RLS).
 */

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Admin client with service role key — BYPASSES ROW LEVEL SECURITY
 * Use with caution! Only for admin operations.
 */
export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Standard server client — respects RLS
 * Use for authenticated user operations on the server.
 */
export const supabaseServer = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
