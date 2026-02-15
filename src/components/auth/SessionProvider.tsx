"use client";

/**
 * Session Provider Wrapper
 * 
 * Client component that wraps the app with NextAuth SessionProvider.
 */

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { Session } from "next-auth";

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>;
}
