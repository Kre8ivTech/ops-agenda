'use client';

import { useActionState } from 'react';

import { AuthFormError } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { signInAction, type AuthActionState } from '@/lib/auth/actions';

const initial: AuthActionState = { ok: false };

export function SignInForm({ returnTo }: { returnTo?: string }) {
  const [state, action, pending] = useActionState(signInAction, initial);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="grid gap-3.5">
      <AuthFormError message={state.message} />
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      <TextField
        label="Work email"
        type="email"
        name="email"
        autoComplete="username"
        required
        error={errors.email?.[0]}
        data-testid="signin-email"
      />
      <TextField
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        required
        className="tracking-[0.18em]"
        error={errors.password?.[0]}
        labelAside={
          <a
            href="/auth/forgot-password"
            className="text-text-secondary hover:text-signal text-[0.78rem] font-semibold"
            data-testid="forgot-password-link"
          >
            Forgot?
          </a>
        }
        data-testid="signin-password"
      />

      <label className="text-text-secondary flex cursor-pointer items-center gap-2 text-[0.85rem]">
        <span className="relative inline-flex size-4 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            name="keepSignedIn"
            defaultChecked
            className="peer absolute inset-0 cursor-pointer opacity-0"
            aria-label="Keep me signed in on this device"
          />
          <span
            className="bg-wash peer-checked:bg-signal peer-focus-visible:outline-signal grid size-4 place-items-center rounded text-[10px] font-black text-transparent peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2"
            aria-hidden
          >
            ✓
          </span>
        </span>
        Keep me signed in on this device
      </label>

      <Button type="submit" className="w-full" disabled={pending} data-testid="sign-in-submit">
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
