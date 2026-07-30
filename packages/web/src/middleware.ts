import { auth } from '@/lib/auth';

/**
 * Protect all routes under /(app)/* by requiring a session. Public routes
 * (marketing, auth callbacks, health checks) are matched explicitly and bypass
 * authentication.
 */
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isPublic =
    nextUrl.pathname === '/' ||
    nextUrl.pathname.startsWith('/auth') ||
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname === '/api/health';

  if (!isLoggedIn && !isPublic) {
    return Response.redirect(new URL('/auth/signin', nextUrl));
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
