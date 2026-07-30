'use client';

export function SignOutButton({ variant = 'default' }: { variant?: 'default' | 'ink' }) {
  const className =
    variant === 'ink'
      ? 'mt-1 text-left text-[0.74rem] font-semibold text-white/55 underline-offset-2 hover:text-white hover:underline'
      : 'mt-2 text-sm text-text-secondary underline hover:text-ink';

  return (
    <form action="/api/auth/signout" method="post">
      <button type="submit" className={className}>
        Sign out
      </button>
    </form>
  );
}
