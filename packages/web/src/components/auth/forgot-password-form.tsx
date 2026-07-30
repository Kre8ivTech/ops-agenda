'use client';

import { useActionState } from 'react';

import { AuthFormError } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { forgotPasswordAction, type AuthActionState } from '@/lib/auth/actions';

const initial: AuthActionState = { ok: false };

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initial);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="grid gap-3.5">
      <AuthFormError message={state.message} />
      <TextField
        label="Work email"
        type="email"
        name="email"
        autoComplete="email"
        required
        error={errors.email?.[0]}
        data-testid="forgot-email"
      />
      <Button type="submit" className="w-full" disabled={pending} data-testid="forgot-submit">
        {pending ? 'Sending…' : 'Send reset code'}
      </Button>
    </form>
  );
}
