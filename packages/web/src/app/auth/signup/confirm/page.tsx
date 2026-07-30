import { AuthSplitShell, CognitoBadge } from '@/components/auth/auth-shell';
import { ConfirmSignUpForm } from '@/components/auth/confirm-signup-form';

export default async function ConfirmSignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email = '' } = await searchParams;

  return (
    <AuthSplitShell
      footer={
        <>
          <p className="m-0 text-[0.84rem] text-text-secondary">
            Wrong email?{' '}
            <a href="/auth/signup" className="font-extrabold text-signal hover:text-ink">
              Start over
            </a>
          </p>
          <CognitoBadge />
        </>
      }
    >
      <div>
        <p className="mb-1.5 text-[0.76rem] font-extrabold uppercase text-signal">Confirm</p>
        <h1 className="mb-2 text-[2.3rem] leading-[1.02] font-extrabold tracking-[-0.02em] text-ink">
          Check your email for a code.
        </h1>
        <p className="m-0 max-w-[40ch] text-[0.95rem] leading-[1.5] text-text-secondary">
          Enter the verification code Cognito sent. Then you can sign in.
        </p>
      </div>
      <ConfirmSignUpForm email={email} />
    </AuthSplitShell>
  );
}
