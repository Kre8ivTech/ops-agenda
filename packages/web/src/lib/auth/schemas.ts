import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(12, 'Use at least 12 characters.')
  .regex(/[a-z]/, 'Include a lowercase letter.')
  .regex(/[A-Z]/, 'Include an uppercase letter.')
  .regex(/[0-9]/, 'Include a digit.')
  .regex(/[^A-Za-z0-9]/, 'Include a symbol.');

export const signUpSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter your name.').max(120),
    email: z.string().trim().email('Enter a valid work email.').max(254),
    password: passwordSchema,
    confirmPassword: z.string(),
    accessCode: z.string().trim().min(1, 'Enter your access code.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const confirmSignUpSchema = z.object({
  email: z.string().trim().email('Enter a valid work email.').max(254),
  code: z.string().trim().min(1, 'Enter the verification code.'),
});

export const signInSchema = z.object({
  email: z.string().trim().email('Enter a valid work email.').max(254),
  password: z.string().min(1, 'Enter your password.'),
  returnTo: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid work email.').max(254),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().email('Enter a valid work email.').max(254),
    code: z.string().trim().min(1, 'Enter the verification code.'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ConfirmSignUpInput = z.infer<typeof confirmSignUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
