import { exchangeCode, setSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    return Response.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(errorDescription ?? error)}`, request.url),
    );
  }

  if (!code || !state) {
    return Response.redirect(new URL('/auth/error?error=missing_params', request.url));
  }

  try {
    const { session, returnTo } = await exchangeCode(code, state);
    await setSessionCookie(session);
    return Response.redirect(new URL(returnTo, request.url));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return Response.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
