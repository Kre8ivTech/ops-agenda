import { AuthSplitShell, CognitoBadge } from '@/components/auth/auth-shell';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <AuthSplitShell
      footer={
        <>
          <p className="m-0 text-[0.84rem] text-text-secondary">
            Remembered it?{' '}
            <a href="/auth/signin" className="font-extrabold text-signal hover:text-ink">
              Sign in
            </a>
          </p>
          <CognitoBadge />
        </>
      }
    >
      <div>
        <p className="mb-1.5 text-[0.76rem] font-extrabold uppercase text-signal">Forgot password</p>
        <h1 className="mb-2 text-[2.3rem] leading-[1.02] font-extrabold tracking-[-0.02em] text-ink">
          Reset your password.
        </h1>
        <p className="m-0 max-w-[40ch] text-[0.95rem] leading-[1.5] text-text-secondary">
          We&apos;ll email a verification code if an account exists for that address.
        </p>
      </div>
      <ForgotPasswordForm />
    </AuthSplitShell>
  );
}
