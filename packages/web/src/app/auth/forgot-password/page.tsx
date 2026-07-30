import { AuthSplitShell, CognitoBadge } from '@/components/auth/auth-shell';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <AuthSplitShell
      footer={
        <>
          <p className="text-text-secondary m-0 text-[0.84rem]">
            Remembered it?{' '}
            <a href="/auth/signin" className="text-signal hover:text-ink font-extrabold">
              Sign in
            </a>
          </p>
          <CognitoBadge />
        </>
      }
    >
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">
          Forgot password
        </p>
        <h1 className="text-ink mb-2 text-[2.3rem] font-extrabold leading-[1.02] tracking-[-0.02em]">
          Reset your password.
        </h1>
        <p className="text-text-secondary m-0 max-w-[40ch] text-[0.95rem] leading-[1.5]">
          We&apos;ll email a verification code if an account exists for that address.
        </p>
      </div>
      <ForgotPasswordForm />
    </AuthSplitShell>
  );
}
