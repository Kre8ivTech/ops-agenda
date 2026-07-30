'use client';

import { useActionState } from 'react';

import { AuthFormError } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { confirmSignUpAction, type AuthActionState } from '@/lib/auth/actions';

const initial: AuthActionState = { ok: false };

export function ConfirmSignUpForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(confirmSignUpAction, initial);
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
        hint="Sent to your email from Cognito."
        error={errors.code?.[0]}
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Confirming…' : 'Confirm email'}
      </Button>
    </form>
  );
}
