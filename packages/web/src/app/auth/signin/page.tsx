import { AuthBanner } from '@/components/auth/auth-shell';
import { SignInBriefPreview } from '@/components/auth/signin-brief-preview';
import { Lockup } from '@/components/chrome/lockup';
import { ButtonLink } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { isDevAuthBypassEnabled } from '@/lib/auth';

function MicrosoftMark() {
  return (
    <span className="grid shrink-0 grid-cols-2 grid-rows-2 gap-0.5" aria-hidden>
      <span className="size-[9px] bg-[#f25022]" />
      <span className="size-[9px] bg-[#7fba00]" />
      <span className="size-[9px] bg-[#00a4ef]" />
      <span className="size-[9px] bg-[#ffb900]" />
    </span>
  );
}

function cognitoStartHref(returnTo?: string): string {
  if (!returnTo || returnTo.startsWith('//') || !returnTo.startsWith('/')) {
    return '/api/auth/signin';
  }
  return `/api/auth/signin?returnTo=${encodeURIComponent(returnTo)}`;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; returnTo?: string; registered?: string; reset?: string }>;
}) {
  const params = await searchParams;
  const returnTo = params.returnTo ?? params.callbackUrl;
  const signInHref = cognitoStartHref(returnTo);
  const localPreviewHref = `/api/auth/dev-login?returnTo=${encodeURIComponent(
    returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
      ? returnTo
      : '/dashboard',
  )}`;
  const showLocalPreview = isDevAuthBypassEnabled();

  return (
    <div className="flex min-h-full flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section className="relative flex flex-col justify-between bg-[linear-gradient(135deg,rgba(37,114,77,0.08),transparent_32rem),linear-gradient(315deg,rgba(49,93,143,0.09),transparent_34rem),var(--paper)] px-8 py-11 sm:px-12 lg:px-[72px] lg:py-11">
        <Lockup className="text-ink" />

        <div className="my-10 flex w-full flex-col gap-[22px] lg:my-0">
          <div>
            <p className="mb-1.5 text-[0.76rem] font-extrabold uppercase text-signal">Sign in</p>
            <h1 className="mb-2 text-[2.3rem] leading-[1.02] font-extrabold tracking-[-0.02em] text-ink">
              Your day, already prioritized.
            </h1>
            <p className="m-0 max-w-[40ch] text-[0.95rem] leading-[1.5] text-text-secondary">
              Sign in to open today&apos;s brief. Your mail, tasks and calendar are already scanned.
            </p>
          </div>

          {params.registered === '1' ? (
            <AuthBanner>Account confirmed. Sign in to continue.</AuthBanner>
          ) : null}
          {params.reset === '1' ? (
            <AuthBanner>Password updated. Sign in with your new password.</AuthBanner>
          ) : null}

          {/*
            Fields match the design handoff for visual fidelity. Credentials are
            entered on Cognito Hosted UI — Sign in navigates to /api/auth/signin
            and never POSTs a password to this app.
          */}
          <div className="grid gap-3.5">
            <TextField
              label="Work email"
              type="email"
              name="email"
              autoComplete="username"
              defaultValue="dana.whitfield@northgate.co"
            />
            <TextField
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              defaultValue="0123456789ab"
              className="tracking-[0.18em]"
              labelAside={
                <a
                  href="/auth/forgot-password"
                  className="text-[0.78rem] font-semibold text-text-secondary hover:text-signal"
                  data-testid="forgot-password-link"
                >
                  Forgot?
                </a>
              }
            />

            <label className="flex cursor-pointer items-center gap-2 text-[0.85rem] text-text-secondary">
              <span className="relative inline-flex size-4 shrink-0 items-center justify-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="peer absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Keep me signed in on this device"
                />
                <span
                  className="grid size-4 place-items-center rounded bg-wash text-[10px] font-black text-transparent peer-checked:bg-signal peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-signal"
                  aria-hidden
                >
                  ✓
                </span>
              </span>
              Keep me signed in on this device
            </label>

            <ButtonLink href={signInHref} className="w-full" data-testid="sign-in-cognito">
              Sign in
            </ButtonLink>
            {showLocalPreview ? (
              <ButtonLink
                href={localPreviewHref}
                variant="secondary"
                className="w-full"
                data-testid="local-preview"
              >
                Local preview (no Cognito)
              </ButtonLink>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[0.72rem] font-extrabold uppercase text-text-secondary">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid gap-2.5">
            <ButtonLink
              href={signInHref}
              variant="secondary"
              className="w-full"
              data-testid="sign-in-microsoft"
            >
              <MicrosoftMark />
              Continue with Microsoft 365
            </ButtonLink>
            <p className="m-0 text-[0.78rem] leading-[1.45] text-text-secondary">
              Grants read-only access to mail and calendar metadata —{' '}
              <strong className="font-bold text-ink">Mail.Read</strong>,{' '}
              <strong className="font-bold text-ink">Calendars.Read</strong>. Message bodies are
              never stored.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 text-[0.84rem] text-text-secondary">
            No account yet?{' '}
            <a href="/auth/signup" className="font-extrabold text-signal hover:text-ink">
              Sign up
            </a>
          </p>
          <span className="inline-flex items-center gap-[7px] rounded-full border border-border bg-wash px-2.5 py-1.5 font-mono text-[11px] font-semibold text-text-secondary">
            <span className="size-1.5 rounded-full bg-signal shadow-[0_0_0_3px_var(--wash-green)]" />
            Secured by AWS Cognito
          </span>
        </div>
      </section>

      <SignInBriefPreview />
    </div>
  );
}
