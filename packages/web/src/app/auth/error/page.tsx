import { ButtonLink } from '@/components/ui/button';

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-[8px] border border-border bg-risk-wash p-6">
        <h1 className="text-lg font-extrabold tracking-[-0.02em] text-risk">Authentication error</h1>
        <p className="mt-2 text-[0.95rem] leading-[1.5] text-ink">
          Something went wrong while signing you in. Please try again.
        </p>
        <ButtonLink href="/auth/signin" className="mt-6" size="medium">
          Back to sign in
        </ButtonLink>
      </div>
    </div>
  );
}
