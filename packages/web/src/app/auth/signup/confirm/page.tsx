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
          <p className="text-text-secondary m-0 text-[0.84rem]">
            Wrong email?{' '}
            <a href="/auth/signup" className="text-signal hover:text-ink font-extrabold">
              Start over
            </a>
          </p>
          <CognitoBadge />
        </>
      }
    >
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Confirm</p>
        <h1 className="text-ink mb-2 text-[2.3rem] font-extrabold leading-[1.02] tracking-[-0.02em]">
          Check your email for a code.
        </h1>
        <p className="text-text-secondary m-0 max-w-[40ch] text-[0.95rem] leading-[1.5]">
          Enter the verification code Cognito sent. Then you can sign in.
        </p>
      </div>
      <ConfirmSignUpForm email={email} />
    </AuthSplitShell>
  );
}
