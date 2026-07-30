import { AuthSplitShell, CognitoBadge } from '@/components/auth/auth-shell';
import { SignUpForm } from '@/components/auth/signup-form';

export default function SignUpPage() {
  return (
    <AuthSplitShell
      footer={
        <>
          <p className="m-0 text-[0.84rem] text-text-secondary">
            Already have an account?{' '}
            <a href="/auth/signin" className="font-extrabold text-signal hover:text-ink">
              Sign in
            </a>
          </p>
          <CognitoBadge />
        </>
      }
    >
      <div>
        <p className="mb-1.5 text-[0.76rem] font-extrabold uppercase text-signal">Sign up</p>
        <h1 className="mb-2 text-[2.3rem] leading-[1.02] font-extrabold tracking-[-0.02em] text-ink">
          Create your Ops Agenda account.
        </h1>
        <p className="m-0 max-w-[40ch] text-[0.95rem] leading-[1.5] text-text-secondary">
          You need a valid access code to submit. After email confirmation, sign in to open
          today&apos;s brief.
        </p>
      </div>
      <SignUpForm />
    </AuthSplitShell>
  );
}
