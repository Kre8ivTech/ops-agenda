'use client';

import { useActionState } from 'react';

import { AuthFormError } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { signUpAction, type AuthActionState } from '@/lib/auth/actions';

const initial: AuthActionState = { ok: false };

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, initial);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="grid gap-3.5">
      <AuthFormError message={state.message} />
      <TextField
        label="Full name"
        name="name"
        autoComplete="name"
        required
        error={errors.name?.[0]}
      />
      <TextField
        label="Work email"
        type="email"
        name="email"
        autoComplete="email"
        required
        error={errors.email?.[0]}
      />
      <TextField
        label="Password"
        type="password"
        name="password"
        autoComplete="new-password"
        required
        hint="12+ characters with upper, lower, digit, and symbol."
        error={errors.password?.[0]}
      />
      <TextField
        label="Confirm password"
        type="password"
        name="confirmPassword"
        autoComplete="new-password"
        required
        error={errors.confirmPassword?.[0]}
      />
      <TextField
        label="Access code"
        name="accessCode"
        autoComplete="off"
        required
        hint="Required to create an account."
        error={errors.accessCode?.[0]}
        data-testid="signup-access-code"
      />
      <Button type="submit" className="w-full" disabled={pending} data-testid="signup-submit">
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
