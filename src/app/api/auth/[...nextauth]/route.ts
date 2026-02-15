/**
 * NextAuth.js API Route Handler
 * 
 * Handles all authentication flows including:
 * - Microsoft OAuth 2.0
 * - Session management
 * - Token encryption and storage
 */

import NextAuth, { NextAuthOptions } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { supabaseAdmin } from "@/lib/supabase/server";
import { encrypt } from "@/lib/utils/encryption";
import { logger } from "@/lib/utils/logger";
import { env } from "@/lib/env";

export const authOptions: NextAuthOptions = {
  providers: [
    MicrosoftEntraID({
      clientId: env.MICROSOFT_CLIENT_ID,
      clientSecret: env.MICROSOFT_CLIENT_SECRET,
      tenantId: env.MICROSOFT_TENANT_ID,
      authorization: {
        params: {
          scope: "openid profile email offline_access Mail.Read Calendars.Read",
        },
      },
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (!account || !user.email) {
          logger.error("Sign in failed: missing account or email");
          return false;
        }

        // Check if user exists
        const { data: existingUser } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("email", user.email)
          .single();

        let userId: string;

        if (!existingUser) {
          // Create new user
          const { data: newUser, error: userError } = await supabaseAdmin
            .from("users")
            .insert({
              email: user.email,
              name: user.name,
              onboarding_completed: false,
            })
            .select("id")
            .single();

          if (userError || !newUser) {
            logger.error("Failed to create user", userError);
            return false;
          }

          userId = newUser.id;
          logger.info("Created new user", { userId, email: user.email });
        } else {
          userId = existingUser.id;
        }

        // Encrypt and store OAuth tokens
        if (account.provider === "microsoft-entra-id") {
          const accessTokenEncrypted = encrypt(account.access_token || "");
          const refreshTokenEncrypted = encrypt(account.refresh_token || "");
          const expiresAt = new Date(Date.now() + (account.expires_in || 3600) * 1000);

          // Upsert Microsoft account
          const { error: accountError } = await supabaseAdmin
            .from("microsoft_accounts")
            .upsert(
              {
                user_id: userId,
                microsoft_user_id: account.providerAccountId,
                email: user.email,
                access_token_encrypted: accessTokenEncrypted,
                refresh_token_encrypted: refreshTokenEncrypted,
                token_expires_at: expiresAt.toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: "user_id",
              }
            );

          if (accountError) {
            logger.error("Failed to store Microsoft account", accountError);
            return false;
          }

          logger.info("Stored Microsoft OAuth tokens", { userId });
        }

        // Log successful sign in
        await supabaseAdmin.from("audit_logs").insert({
          user_id: userId,
          action: "user.signin",
          resource_type: "auth",
          resource_id: userId,
          metadata: {
            provider: account.provider,
            ip_address: null, // TODO: Extract from request headers
          },
        });

        return true;
      } catch (error) {
        logger.error("Sign in callback error", error);
        return false;
      }
    },

    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.userId = user.id;
      }

      // Return token if not expired
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        return token;
      }

      // TODO: Implement token refresh logic
      // For now, return existing token
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    newUser: "/dashboard", // Redirect new users to dashboard (onboarding will trigger)
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
