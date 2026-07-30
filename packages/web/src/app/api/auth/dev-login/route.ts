import { DEV_SESSION, isDevAuthBypassEnabled, sanitizeReturnTo, setSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Local-only session mint. Disabled unless NODE_ENV=development and
 * AUTH_DEV_BYPASS=true. Never enable in production.
 */
export async function GET(request: Request) {
  if (!isDevAuthBypassEnabled()) {
    return new Response('Not found', { status: 404 });
  }

  await setSessionCookie(DEV_SESSION);

  const { searchParams } = new URL(request.url);
  const safe = sanitizeReturnTo(searchParams.get('returnTo'));

  return Response.redirect(new URL(safe, request.url));
}
