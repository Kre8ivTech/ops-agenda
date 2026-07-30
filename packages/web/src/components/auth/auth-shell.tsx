import type { ReactNode } from 'react';

import { SignInBriefPreview } from '@/components/auth/signin-brief-preview';
import { Lockup } from '@/components/chrome/lockup';

export function AuthSplitShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section className="relative flex flex-col justify-between bg-[linear-gradient(135deg,rgba(37,114,77,0.08),transparent_32rem),linear-gradient(315deg,rgba(49,93,143,0.09),transparent_34rem),var(--paper)] px-8 py-11 sm:px-12 lg:px-[72px] lg:py-11">
        <Lockup className="text-ink" />
        <div className="my-10 flex w-full flex-col gap-[22px] lg:my-0">{children}</div>
        {footer ? (
          <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            {footer}
          </div>
        ) : (
          <div />
        )}
      </section>
      <SignInBriefPreview />
    </div>
  );
}

export function CognitoBadge() {
  return (
    <span className="inline-flex items-center gap-[7px] rounded-full border border-border bg-wash px-2.5 py-1.5 font-mono text-[11px] font-semibold text-text-secondary">
      <span className="size-1.5 rounded-full bg-signal shadow-[0_0_0_3px_var(--wash-green)]" />
      Secured by AWS Cognito
    </span>
  );
}

export function AuthBanner({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 rounded-[8px] border border-border bg-wash-green px-3.5 py-3 text-[0.85rem] leading-[1.45] text-ink">
      {children}
    </p>
  );
}

export function AuthFormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="m-0 rounded-[8px] border border-border bg-risk-wash px-3.5 py-3 text-[0.85rem] text-risk">
      {message}
    </p>
  );
}
