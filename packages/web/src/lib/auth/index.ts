import NextAuth from 'next-auth';
import Cognito from 'next-auth/providers/cognito';
import { env } from '../env';

/**
 * NextAuth.js configuration using Amazon Cognito as the identity provider.
 *
 * Session data is stored in an httpOnly, Secure, SameSite=Lax cookie. The
 * account_id and user_id claims are added to the JWT/session in callbacks after
 * the user is looked up in the application database.
 *
 * @see https://next-auth.js.org/providers/cognito
 */
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    Cognito({
      clientId: env.COGNITO_CLIENT_ID ?? '',
      clientSecret: env.COGNITO_CLIENT_SECRET ?? '',
      issuer: env.COGNITO_USER_POOL_ID
        ? `https://cognito-idp.${env.AWS_REGION}.amazonaws.com/${env.COGNITO_USER_POOL_ID}`
        : undefined,
    }),
  ],
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 60, // 30 minutes idle
    updateAge: 5 * 60, // refresh every 5 minutes on interaction
  },
  cookies: {
    sessionToken: {
      name: `__Host-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
      },
    },
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist Cognito tokens / claims to the JWT. Do not put access tokens in
      // the client. account_id / user_id are populated later by onboarding/sign-in
      // Server Actions once the Cognito sub is linked to a tenant row.
      if (account && profile) {
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        // These are placeholders until the sign-in action links the account.
        accountId: token.accountId as string | undefined,
        userId: token.userId as string | undefined,
        role: token.role as string | undefined,
      };
      return session;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // eslint-disable-next-line no-console
      console.log('signIn event', { email: user.email, isNewUser, provider: account?.provider });
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});
