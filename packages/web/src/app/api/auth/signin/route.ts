import { createSignInUrl } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get('returnTo') ?? '/dashboard';
  const signInUrl = await createSignInUrl(returnTo);
  return Response.redirect(signInUrl);
}
