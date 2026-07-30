import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * Fail the build on missing or malformed configuration rather than at 3am in
 * production. Server vars are stripped from the client bundle by t3-env; only
 * NEXT_PUBLIC_* values cross that boundary.
 *
 * Add each service's vars here as it is actually wired up — an unused required
 * var blocks local dev for no benefit.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().url().optional(),
    AWS_REGION: z.string().default('us-east-1'),
    COGNITO_USER_POOL_ID: z.string().optional(),
    COGNITO_CLIENT_ID: z.string().optional(),
    COGNITO_CLIENT_SECRET: z.string().optional(),
    COGNITO_DOMAIN: z.string().optional(),
    NEXTAUTH_SECRET: z.string().min(1).optional(),
    AUDIT_BUCKET_NAME: z.string().optional(),
    SYNC_QUEUE_URL: z.string().url().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    AWS_REGION: process.env.AWS_REGION,
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
    COGNITO_CLIENT_SECRET: process.env.COGNITO_CLIENT_SECRET,
    COGNITO_DOMAIN: process.env.COGNITO_DOMAIN,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    AUDIT_BUCKET_NAME: process.env.AUDIT_BUCKET_NAME,
    SYNC_QUEUE_URL: process.env.SYNC_QUEUE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  // Lets CI run typecheck/lint without a populated .env.
  skipValidation: process.env.SKIP_ENV_VALIDATION === 'true',
  emptyStringAsUndefined: true,
});
