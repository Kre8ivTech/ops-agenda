import type { ReactNode } from 'react';

/**
 * The presentational pieces of the auth screens. The split shell itself stays
 * in `packages/web` because it composes app-specific content; these three are
 * pure and shared.
 */

export function CognitoBadge() {
  return (
    <span className="border-border bg-wash text-text-secondary inline-flex items-center gap-[7px] rounded-full border px-2.5 py-1.5 font-mono text-[11px] font-semibold">
      <span className="bg-signal size-1.5 rounded-full shadow-[0_0_0_3px_var(--wash-green)]" />
      Secured by AWS Cognito
    </span>
  );
}

export function AuthBanner({ children }: { children: ReactNode }) {
  return (
    <p className="border-border bg-wash-green text-ink m-0 rounded-[8px] border px-3.5 py-3 text-[0.85rem] leading-[1.45]">
      {children}
    </p>
  );
}

export function AuthFormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="border-border bg-risk-wash text-risk m-0 rounded-[8px] border px-3.5 py-3 text-[0.85rem]">
      {message}
    </p>
  );
}
