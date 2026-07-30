import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { sessionCookieName, unseal } from '@/lib/auth';

const PUBLIC_PATHS = new Set([
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/signup/confirm',
  '/auth/forgot-password',
  '/auth/forgot-password/reset',
  '/auth/error',
  '/api/auth/signin',
  '/api/auth/callback',
  '/api/auth/signout',
  '/api/auth/dev-login',
  '/api/health',
]);

function isPublic(path: string): boolean {
  if (PUBLIC_PATHS.has(path)) return true;
  return path.startsWith('/_next/') || /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/.test(path);
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get(sessionCookieName())?.value;
  let session: { email?: string } | null = null;

  if (sessionCookie) {
    try {
      session = await unseal<{ email?: string }>(sessionCookie);
    } catch {
      session = null;
    }
  }

  if (!session?.email) {
    const signInUrl = req.nextUrl.clone();
    signInUrl.pathname = '/auth/signin';
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
