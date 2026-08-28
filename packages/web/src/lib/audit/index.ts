import { AuditEventInsert } from '@/lib/db/schema';

/**
 * Field allow-list for structured logging. Any attempt to log a key that is
 * not in this list is rejected in development and dropped in production.
 */
const ALLOWED_LOG_FIELDS = new Set([
  'requestId',
  'path',
  'method',
  'statusCode',
  'durationMs',
  'userAgent',
  'tenantId',
  'userId',
  'action',
  'targetType',
  'targetId',
]);

export interface AuditContext {
  requestId?: string;
  /**
   * Tenant account for tenant-scoped mutations. Omit / null for platform
   * operator events (integration credentials, etc.).
   */
  accountId?: string | null;
  userId: string;
  /** Set when a platform admin acts on a tenant on the operator's behalf. */
  actorPlatformAdminId?: string;
  ip?: string;
  userAgent?: string;
}

export interface AuditPayload {
  action: string;
  targetType: string;
  targetId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  justification?: string;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'secret',
  'token',
  'authorization',
  'cookie',
  'refreshtoken',
  'accesstoken',
  'clientsecret',
  'encryptedpayload',
  'ciphertext',
  'authtag',
  'iv',
  'api_key',
  'apikey',
  'auth_token',
  'authtoken',
  'secret_access_key',
  'secretaccesskey',
  'webhook_secret',
  'webhooksecret',
]);

/** Scrub secrets from audit before/after payloads. Exported for unit tests. */
export function scrubAuditValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    // Simple mask for anything that looks like a token/key.
    if (/^\s*Bearer\s+/i.test(value)) return '[redacted bearer token]';
    if (value.length > 24) return value.slice(0, 4) + '…[redacted]';
  }
  if (Array.isArray(value)) return value.map(scrubAuditValue);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const normalized = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      out[k] =
        SENSITIVE_KEYS.has(normalized) || SENSITIVE_KEYS.has(k.toLowerCase())
          ? '[redacted]'
          : scrubAuditValue(v);
    }
    return out;
  }
  return value;
}

/**
 * Structured logger that only accepts allow-listed fields. Any object passed as
 * the first argument must have keys in ALLOWED_LOG_FIELDS; otherwise it throws
 * in development and drops the message in production.
 */
export function appLog(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  context?: Record<string, unknown>,
): void {
  if (context) {
    for (const key of Object.keys(context)) {
      if (!ALLOWED_LOG_FIELDS.has(key)) {
        if (process.env.NODE_ENV === 'development') {
          throw new Error(`Disallowed log field: ${key}`);
        }
        delete context[key];
      }
    }
  }
  const safeContext = scrubAuditValue(context ?? {}) as Record<string, unknown>;
  // eslint-disable-next-line no-console
  console[level](JSON.stringify({ level, message, ...safeContext }));
}

/**
 * Build an audit_event row. The actual write happens inside the database
 * transaction so that the event and the mutation are atomic.
 */
export function buildAuditEvent(ctx: AuditContext, payload: AuditPayload): AuditEventInsert {
  return {
    accountId: ctx.accountId ?? null,
    actorUserId: ctx.userId || null,
    actorPlatformAdminId: ctx.actorPlatformAdminId ?? null,
    action: payload.action,
    targetType: payload.targetType,
    targetId: payload.targetId,
    before: (payload.before ? scrubAuditValue(payload.before) : null) as AuditEventInsert['before'],
    after: (payload.after ? scrubAuditValue(payload.after) : null) as AuditEventInsert['after'],
    justification: payload.justification ?? null,
    ip: ctx.ip ?? null,
    userAgent: ctx.userAgent ?? null,
  };
}
