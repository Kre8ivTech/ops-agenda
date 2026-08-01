import { createHmac } from 'node:crypto';

import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  SignUpCommand,
  type CognitoIdentityProviderServiceException,
} from '@aws-sdk/client-cognito-identity-provider';

import { env } from '@/lib/env';

const client = new CognitoIdentityProviderClient({ region: env.AWS_REGION });

function requireClientId(): string {
  const id = env.COGNITO_CLIENT_ID;
  if (!id) throw new Error('COGNITO_CLIENT_ID is not configured');
  return id;
}

function secretHash(username: string): string | undefined {
  const secret = env.COGNITO_CLIENT_SECRET;
  if (!secret) return undefined;
  const clientId = requireClientId();
  return createHmac('sha256', secret).update(`${username}${clientId}`).digest('base64');
}

export type CognitoUserErrorCode =
  | 'username_exists'
  | 'code_mismatch'
  | 'expired_code'
  | 'invalid_password'
  | 'limit_exceeded'
  | 'invalid_parameter'
  | 'not_authorized'
  | 'user_not_confirmed'
  | 'mfa_required'
  | 'generic';

export class CognitoUserError extends Error {
  constructor(
    public readonly code: CognitoUserErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'CognitoUserError';
  }
}

function mapCognitoError(err: unknown): CognitoUserError {
  const name =
    err && typeof err === 'object' && 'name' in err
      ? String((err as CognitoIdentityProviderServiceException).name)
      : '';

  switch (name) {
    case 'UsernameExistsException':
      return new CognitoUserError('username_exists', 'An account with that email already exists.');
    case 'CodeMismatchException':
      return new CognitoUserError('code_mismatch', 'That verification code is not correct.');
    case 'ExpiredCodeException':
      return new CognitoUserError(
        'expired_code',
        'That verification code has expired. Request a new one.',
      );
    case 'InvalidPasswordException':
      return new CognitoUserError(
        'invalid_password',
        'Password does not meet the requirements (12+ chars, upper, lower, digit, symbol).',
      );
    case 'LimitExceededException':
    case 'TooManyRequestsException':
      return new CognitoUserError(
        'limit_exceeded',
        'Too many attempts. Wait a minute and try again.',
      );
    case 'InvalidParameterException':
      return new CognitoUserError('invalid_parameter', 'Check the form fields and try again.');
    case 'NotAuthorizedException':
      return new CognitoUserError('not_authorized', 'That request could not be completed.');
    case 'UserNotConfirmedException':
      return new CognitoUserError('user_not_confirmed', 'Confirm your email before signing in.');
    default:
      return new CognitoUserError('generic', 'Something went wrong. Try again.');
  }
}

export async function cognitoSignIn(input: {
  email: string;
  password: string;
}): Promise<{ idToken: string; accessToken: string; refreshToken?: string }> {
  const clientId = requireClientId();
  const username = input.email.toLowerCase();
  const hash = secretHash(username);
  try {
    const result = await client.send(
      new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: clientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: input.password,
          ...(hash ? { SECRET_HASH: hash } : {}),
        },
      }),
    );

    if (result.ChallengeName) {
      if (result.ChallengeName === 'SOFTWARE_TOKEN_MFA' || result.ChallengeName === 'SMS_MFA') {
        throw new CognitoUserError(
          'mfa_required',
          'Multi-factor authentication is required for this account. MFA challenge UI is not available yet.',
        );
      }
      throw new CognitoUserError(
        'generic',
        'Additional verification is required before you can sign in.',
      );
    }

    const auth = result.AuthenticationResult;
    if (!auth?.IdToken || !auth.AccessToken) {
      throw new CognitoUserError('generic', 'Authentication did not return tokens.');
    }

    return {
      idToken: auth.IdToken,
      accessToken: auth.AccessToken,
      refreshToken: auth.RefreshToken,
    };
  } catch (err) {
    if (err instanceof CognitoUserError) throw err;
    throw mapCognitoError(err);
  }
}

export async function cognitoSignUp(input: {
  email: string;
  password: string;
  name: string;
}): Promise<void> {
  const clientId = requireClientId();
  const username = input.email.toLowerCase();
  try {
    await client.send(
      new SignUpCommand({
        ClientId: clientId,
        Username: username,
        Password: input.password,
        SecretHash: secretHash(username),
        UserAttributes: [
          { Name: 'email', Value: username },
          { Name: 'name', Value: input.name },
        ],
      }),
    );
  } catch (err) {
    throw mapCognitoError(err);
  }
}

export async function cognitoConfirmSignUp(input: { email: string; code: string }): Promise<void> {
  const clientId = requireClientId();
  const username = input.email.toLowerCase();
  try {
    await client.send(
      new ConfirmSignUpCommand({
        ClientId: clientId,
        Username: username,
        ConfirmationCode: input.code.trim(),
        SecretHash: secretHash(username),
      }),
    );
  } catch (err) {
    throw mapCognitoError(err);
  }
}

export async function cognitoForgotPassword(input: { email: string }): Promise<void> {
  const clientId = requireClientId();
  const username = input.email.toLowerCase();
  try {
    await client.send(
      new ForgotPasswordCommand({
        ClientId: clientId,
        Username: username,
        SecretHash: secretHash(username),
      }),
    );
  } catch (err) {
    // preventUserExistenceErrors on the app client collapses unknown users;
    // still swallow existence-leaking failures into a no-op for callers.
    const mapped = mapCognitoError(err);
    if (mapped.code === 'not_authorized' || mapped.code === 'generic') return;
    throw mapped;
  }
}

export async function cognitoConfirmForgotPassword(input: {
  email: string;
  code: string;
  password: string;
}): Promise<void> {
  const clientId = requireClientId();
  const username = input.email.toLowerCase();
  try {
    await client.send(
      new ConfirmForgotPasswordCommand({
        ClientId: clientId,
        Username: username,
        ConfirmationCode: input.code.trim(),
        Password: input.password,
        SecretHash: secretHash(username),
      }),
    );
  } catch (err) {
    throw mapCognitoError(err);
  }
}
