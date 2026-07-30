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
          <p className="text-text-secondary m-0 text-[0.84rem]">
            Didn&apos;t get a code?{' '}
            <a href="/auth/forgot-password" className="text-signal hover:text-ink font-extrabold">
              Resend
            </a>
          </p>
          <CognitoBadge />
        </>
      }
    >
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">New password</p>
        <h1 className="text-ink mb-2 text-[2.3rem] font-extrabold leading-[1.02] tracking-[-0.02em]">
          Choose a new password.
        </h1>
        <p className="text-text-secondary m-0 max-w-[40ch] text-[0.95rem] leading-[1.5]">
          Enter the code from your email and a password that meets the policy.
        </p>
      </div>
      <ResetPasswordForm email={email} />
    </AuthSplitShell>
  );
}
