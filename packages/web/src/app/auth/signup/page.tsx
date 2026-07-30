import { AuthSplitShell, CognitoBadge } from '@/components/auth/auth-shell';
import { SignUpForm } from '@/components/auth/signup-form';

export default function SignUpPage() {
  return (
    <AuthSplitShell
      footer={
        <>
          <p className="text-text-secondary m-0 text-[0.84rem]">
            Already have an account?{' '}
            <a href="/auth/signin" className="text-signal hover:text-ink font-extrabold">
              Sign in
            </a>
          </p>
          <CognitoBadge />
        </>
      }
    >
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Sign up</p>
        <h1 className="text-ink mb-2 text-[2.3rem] font-extrabold leading-[1.02] tracking-[-0.02em]">
          Create your Ops Agenda account.
        </h1>
        <p className="text-text-secondary m-0 max-w-[40ch] text-[0.95rem] leading-[1.5]">
          You need a valid access code to submit. After email confirmation, sign in to open
          today&apos;s brief.
        </p>
      </div>
      <SignUpForm />
    </AuthSplitShell>
  );
}
