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
  searchParams: Promise<{
    callbackUrl?: string;
    returnTo?: string;
    registered?: string;
    reset?: string;
  }>;
}) {
  const params = await searchParams;
  const returnTo = params.returnTo ?? params.callbackUrl;
  const signInHref = cognitoStartHref(returnTo);
  const localPreviewHref = `/api/auth/dev-login?returnTo=${encodeURIComponent(
    returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/dashboard',
  )}`;
  const showLocalPreview = isDevAuthBypassEnabled();

  return (
    <div className="flex min-h-full flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section className="relative flex flex-col justify-between bg-[linear-gradient(135deg,rgba(37,114,77,0.08),transparent_32rem),linear-gradient(315deg,rgba(49,93,143,0.09),transparent_34rem),var(--paper)] px-8 py-11 sm:px-12 lg:px-[72px] lg:py-11">
        <Lockup className="text-ink" />

        <div className="my-10 flex w-full flex-col gap-[22px] lg:my-0">
          <div>
            <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Sign in</p>
            <h1 className="text-ink mb-2 text-[2.3rem] font-extrabold leading-[1.02] tracking-[-0.02em]">
              Your day, already prioritized.
            </h1>
            <p className="text-text-secondary m-0 max-w-[40ch] text-[0.95rem] leading-[1.5]">
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
                  className="text-text-secondary hover:text-signal text-[0.78rem] font-semibold"
                  data-testid="forgot-password-link"
                >
                  Forgot?
                </a>
              }
            />

            <label className="text-text-secondary flex cursor-pointer items-center gap-2 text-[0.85rem]">
              <span className="relative inline-flex size-4 shrink-0 items-center justify-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="peer absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Keep me signed in on this device"
                />
                <span
                  className="bg-wash peer-checked:bg-signal peer-focus-visible:outline-signal grid size-4 place-items-center rounded text-[10px] font-black text-transparent peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2"
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
            <span className="bg-border h-px flex-1" />
            <span className="text-text-secondary text-[0.72rem] font-extrabold uppercase">or</span>
            <span className="bg-border h-px flex-1" />
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
            <p className="text-text-secondary m-0 text-[0.78rem] leading-[1.45]">
              Grants read-only access to mail and calendar metadata —{' '}
              <strong className="text-ink font-bold">Mail.Read</strong>,{' '}
              <strong className="text-ink font-bold">Calendars.Read</strong>. Message bodies are
              never stored.
            </p>
          </div>
        </div>

        <div className="border-border flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-text-secondary m-0 text-[0.84rem]">
            No account yet?{' '}
            <a href="/auth/signup" className="text-signal hover:text-ink font-extrabold">
              Sign up
            </a>
          </p>
          <span className="border-border bg-wash text-text-secondary inline-flex items-center gap-[7px] rounded-full border px-2.5 py-1.5 font-mono text-[11px] font-semibold">
            <span className="bg-signal size-1.5 rounded-full shadow-[0_0_0_3px_var(--wash-green)]" />
            Secured by AWS Cognito
          </span>
        </div>
      </section>

      <SignInBriefPreview />
    </div>
  );
}
