'use client';

import { useActionState } from 'react';

import { AuthFormError } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { resetPasswordAction, type AuthActionState } from '@/lib/auth/actions';

const initial: AuthActionState = { ok: false };

export function ResetPasswordForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initial);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="grid gap-3.5">
      <AuthFormError message={state.message} />
      <TextField
        label="Work email"
        type="email"
        name="email"
        autoComplete="email"
        defaultValue={email}
        required
        error={errors.email?.[0]}
      />
      <TextField
        label="Verification code"
        name="code"
        autoComplete="one-time-code"
        inputMode="numeric"
        required
        error={errors.code?.[0]}
      />
      <TextField
        label="New password"
        type="password"
        name="password"
        autoComplete="new-password"
        required
        hint="12+ characters with upper, lower, digit, and symbol."
        error={errors.password?.[0]}
      />
      <TextField
        label="Confirm new password"
        type="password"
        name="confirmPassword"
        autoComplete="new-password"
        required
        error={errors.confirmPassword?.[0]}
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  );
}
