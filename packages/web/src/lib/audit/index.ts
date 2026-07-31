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
  accountId: string;
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
  'refreshToken',
  'accessToken',
  'clientSecret',
]);

function scrub(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    // Simple mask for anything that looks like a token/key.
    if (/^\s*Bearer\s+/i.test(value)) return '[redacted bearer token]';
    if (value.length > 24) return value.slice(0, 4) + '…[redacted]';
  }
  if (Array.isArray(value)) return value.map(scrub);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? '[redacted]' : scrub(v);
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
  const safeContext = scrub(context ?? {}) as Record<string, unknown>;
  // eslint-disable-next-line no-console
  console[level](JSON.stringify({ level, message, ...safeContext }));
}

/**
 * Build an audit_event row. The actual write happens inside the database
 * transaction so that the event and the mutation are atomic.
 */
export function buildAuditEvent(ctx: AuditContext, payload: AuditPayload): AuditEventInsert {
  return {
    accountId: ctx.accountId,
    actorUserId: ctx.userId || null,
    actorPlatformAdminId: ctx.actorPlatformAdminId ?? null,
    action: payload.action,
    targetType: payload.targetType,
    targetId: payload.targetId,
    before: (payload.before ? scrub(payload.before) : null) as AuditEventInsert['before'],
    after: (payload.after ? scrub(payload.after) : null) as AuditEventInsert['after'],
    justification: payload.justification ?? null,
    ip: ctx.ip ?? null,
    userAgent: ctx.userAgent ?? null,
  };
}
