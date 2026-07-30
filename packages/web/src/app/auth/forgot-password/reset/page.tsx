import { AuthSplitShell, CognitoBadge } from '@/components/auth/auth-shell';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default async function ResetPasswordPage({
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
            Didn&apos;t get a code?{' '}
            <a href="/auth/forgot-password" className="font-extrabold text-signal hover:text-ink">
              Resend
            </a>
          </p>
          <CognitoBadge />
        </>
      }
    >
      <div>
        <p className="mb-1.5 text-[0.76rem] font-extrabold uppercase text-signal">New password</p>
        <h1 className="mb-2 text-[2.3rem] leading-[1.02] font-extrabold tracking-[-0.02em] text-ink">
          Choose a new password.
        </h1>
        <p className="m-0 max-w-[40ch] text-[0.95rem] leading-[1.5] text-text-secondary">
          Enter the code from your email and a password that meets the policy.
        </p>
      </div>
      <ResetPasswordForm email={email} />
    </AuthSplitShell>
  );
}
