'use server';

import { redirect } from 'next/navigation';

import { sanitizeReturnTo, setSessionCookie, verifyIdToken, type Session } from '@/lib/auth';
import { isValidAccessCode } from '@/lib/auth/access-code';
import {
  CognitoUserError,
  cognitoConfirmForgotPassword,
  cognitoConfirmSignUp,
  cognitoForgotPassword,
  cognitoSignIn,
  cognitoSignUp,
} from '@/lib/auth/cognito-user';
import { resolveSessionTenant } from '@/lib/auth/resolve-session';
import {
  confirmSignUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from '@/lib/auth/schemas';

export type AuthActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function fieldErrorsFromZod(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}): Record<string, string[]> {
  const flat = error.flatten().fieldErrors;
  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(flat)) {
    if (value?.length) out[key] = value;
  }
  return out;
}

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formString(formData, 'email'),
    password: formString(formData, 'password'),
    returnTo: formString(formData, 'returnTo') || undefined,
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  let idToken: string;
  try {
    ({ idToken } = await cognitoSignIn({
      email: parsed.data.email,
      password: parsed.data.password,
    }));
  } catch (err) {
    if (err instanceof CognitoUserError) {
      if (err.code === 'not_authorized') {
        return { ok: false, message: 'Incorrect email or password.' };
      }
      if (err.code === 'user_not_confirmed') {
        return {
          ok: false,
          message: err.message,
          fieldErrors: {
            email: ['Confirm your email before signing in.'],
          },
        };
      }
      return { ok: false, message: err.message };
    }
    return { ok: false, message: 'Something went wrong. Try again.' };
  }

  const payload = await verifyIdToken(idToken);
  const email =
    typeof payload.email === 'string'
      ? payload.email
      : ((payload.preferred_username as string) ?? parsed.data.email.toLowerCase());

  const base: Session = {
    sub: payload.sub as string,
    email,
    name: (payload.name as string | undefined) ?? email,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
  };

  const { session, isPlatformAdmin } = await resolveSessionTenant(base);
  await setSessionCookie(session);

  if (session.accountId) {
    redirect(sanitizeReturnTo(parsed.data.returnTo));
  }

  redirect(isPlatformAdmin ? '/admin' : '/onboarding');
}

export async function signUpAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    name: formString(formData, 'name'),
    email: formString(formData, 'email'),
    password: formString(formData, 'password'),
    confirmPassword: formString(formData, 'confirmPassword'),
    accessCode: formString(formData, 'accessCode'),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  if (!isValidAccessCode(parsed.data.accessCode)) {
    return {
      ok: false,
      fieldErrors: { accessCode: ['That access code is not valid.'] },
    };
  }

  try {
    await cognitoSignUp({
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
    });
  } catch (err) {
    if (err instanceof CognitoUserError) {
      if (err.code === 'username_exists') {
        return { ok: false, fieldErrors: { email: [err.message] } };
      }
      if (err.code === 'invalid_password') {
        return { ok: false, fieldErrors: { password: [err.message] } };
      }
      return { ok: false, message: err.message };
    }
    return { ok: false, message: 'Something went wrong. Try again.' };
  }

  redirect(`/auth/signup/confirm?email=${encodeURIComponent(parsed.data.email.toLowerCase())}`);
}

export async function confirmSignUpAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = confirmSignUpSchema.safeParse({
    email: formString(formData, 'email'),
    code: formString(formData, 'code'),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  try {
    await cognitoConfirmSignUp(parsed.data);
  } catch (err) {
    if (err instanceof CognitoUserError) {
      if (err.code === 'code_mismatch' || err.code === 'expired_code') {
        return { ok: false, fieldErrors: { code: [err.message] } };
      }
      return { ok: false, message: err.message };
    }
    return { ok: false, message: 'Something went wrong. Try again.' };
  }

  redirect('/auth/signin?registered=1');
}

export async function forgotPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formString(formData, 'email'),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  try {
    await cognitoForgotPassword({ email: parsed.data.email });
  } catch (err) {
    if (err instanceof CognitoUserError && err.code === 'limit_exceeded') {
      return { ok: false, message: err.message };
    }
    // Always continue — do not leak whether the email exists.
  }

  redirect(
    `/auth/forgot-password/reset?email=${encodeURIComponent(parsed.data.email.toLowerCase())}`,
  );
}

export async function resetPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    email: formString(formData, 'email'),
    code: formString(formData, 'code'),
    password: formString(formData, 'password'),
    confirmPassword: formString(formData, 'confirmPassword'),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  try {
    await cognitoConfirmForgotPassword({
      email: parsed.data.email,
      code: parsed.data.code,
      password: parsed.data.password,
    });
  } catch (err) {
    if (err instanceof CognitoUserError) {
      if (err.code === 'code_mismatch' || err.code === 'expired_code') {
        return { ok: false, fieldErrors: { code: [err.message] } };
      }
      if (err.code === 'invalid_password') {
        return { ok: false, fieldErrors: { password: [err.message] } };
      }
      return { ok: false, message: err.message };
    }
    return { ok: false, message: 'Something went wrong. Try again.' };
  }

  redirect('/auth/signin?reset=1');
}
