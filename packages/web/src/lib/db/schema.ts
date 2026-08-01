import { relations, sql } from 'drizzle-orm';
import type { InferInsertModel } from 'drizzle-orm';
import {
  boolean,
  char,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const priorityEnum = pgEnum('priority', ['p1', 'p2', 'p3', 'fysa']);
export const flagStateEnum = pgEnum('flag_state', ['none', 'attention', 'at_risk', 'settled']);
export const entityKindEnum = pgEnum('entity_kind', [
  'personal',
  'llc',
  'corp',
  'sole_prop',
  'nonprofit',
]);
export const entityStatusEnum = pgEnum('entity_status', ['trading', 'dormant', 'marked_dissolve']);
export const connectionKindEnum = pgEnum('connection_kind', [
  'mail',
  'calendar',
  'tasks',
  'bank',
  'card',
  'payroll',
  'storage',
  'social',
]);
export const connectionStatusEnum = pgEnum('connection_status', [
  'healthy',
  'degraded',
  'pending',
  'revoked',
]);
export const moduleNameEnum = pgEnum('module_name', [
  'plan',
  'productivity',
  'finances',
  'business',
  'health',
  'life',
  'research',
  'social',
]);
export const grantRoleEnum = pgEnum('grant_role', ['view', 'edit', 'admin']);

const tenantBase = {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  accountId: uuid('account_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
};

/**
 * Platform operators (Kre8ivTech staff) who can view and manage every tenant
 * account, independent of the per-account `user` table. This table has no
 * `account_id` and is not tenant data — RLS grants read access to any
 * authenticated app connection (membership itself is the gate: rows are only
 * ever written by trusted operators via direct database access, never through
 * app-facing mutations), which lets other tables' RLS policies check platform
 * admin status without a chicken-and-egg dependency on tenant context.
 */
export const platformAdmin = pgTable(
  'platform_admin',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    cognitoSub: varchar('cognito_sub', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [uniqueIndex('platform_admin_cognito_sub_idx').on(table.cognitoSub)],
);

export const account = pgTable('account', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  plan: varchar('plan', { length: 50 }).notNull().default('trial'),
  planPeriodEnd: timestamp('plan_period_end', { withTimezone: true }),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const user = pgTable(
  'user',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    accountId: uuid('account_id')
      .notNull()
      .references(() => account.id),
    cognitoSub: varchar('cognito_sub', { length: 255 }),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }),
    timezone: varchar('timezone', { length: 100 }).notNull().default('America/New_York'),
    locale: varchar('locale', { length: 10 }).notNull().default('en-US'),
    role: varchar('role', { length: 50 }).notNull().default('member'),
    mfaEnrolled: boolean('mfa_enrolled').notNull().default(false),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('user_account_id_idx').on(table.accountId),
    index('user_email_idx').on(table.email),
  ],
);

export const entity = pgTable(
  'entity',
  {
    ...tenantBase,
    name: varchar('name', { length: 255 }).notNull(),
    kind: entityKindEnum('kind').notNull(),
    einRef: varchar('ein_ref', { length: 255 }),
    formationState: varchar('formation_state', { length: 100 }),
    formedOn: timestamp('formed_on', { withTimezone: true }),
    status: entityStatusEnum('status').notNull().default('trading'),
    fiscalYearEnd: char('fiscal_year_end', { length: 5 }),
    upkeepAnnual: varchar('upkeep_annual', { length: 50 }),
  },
  (table) => [index('entity_account_id_idx').on(table.accountId)],
);

export const entityGrant = pgTable(
  'entity_grant',
  {
    ...tenantBase,
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id),
    entityId: uuid('entity_id')
      .notNull()
      .references(() => entity.id),
    module: moduleNameEnum('module').notNull(),
    role: grantRoleEnum('role').notNull(),
  },
  (table) => [
    index('entity_grant_account_user_idx').on(table.accountId, table.userId),
    index('entity_grant_entity_idx').on(table.entityId),
  ],
);

export const moduleState = pgTable(
  'module_state',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    accountId: uuid('account_id')
      .notNull()
      .references(() => account.id),
    module: moduleNameEnum('module').notNull(),
    enabled: boolean('enabled').notNull().default(false),
    enabledAt: timestamp('enabled_at', { withTimezone: true }),
    disabledAt: timestamp('disabled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('module_state_account_module_idx').on(table.accountId, table.module)],
);

export const connection = pgTable(
  'connection',
  {
    ...tenantBase,
    provider: varchar('provider', { length: 100 }).notNull(),
    kind: connectionKindEnum('kind').notNull(),
    externalAccountRef: varchar('external_account_ref', { length: 255 }),
    scopes: text('scopes').array(),
    status: connectionStatusEnum('status').notNull().default('pending'),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    lastErrorCode: varchar('last_error_code', { length: 100 }),
    secretArn: varchar('secret_arn', { length: 255 }),
    /** Encrypted OAuth access token (AES-256-GCM, same key as integrations). */
    accessTokenEnc: text('access_token_enc'),
    /** Encrypted OAuth refresh token. */
    refreshTokenEnc: text('refresh_token_enc'),
    /** IV for token decryption. */
    tokenIv: varchar('token_iv', { length: 64 }),
    /** Auth tag for token verification. */
    tokenAuthTag: varchar('token_auth_tag', { length: 64 }),
    /** When the access token expires. */
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    /** IMAP/POP host for non-OAuth connections. */
    imapHost: varchar('imap_host', { length: 255 }),
    imapPort: varchar('imap_port', { length: 10 }),
    imapSecurity: varchar('imap_security', { length: 10 }),
  },
  (table) => [index('connection_account_id_idx').on(table.accountId)],
);

/**
 * Tracks in-flight OAuth authorization flows. Created when a user clicks
 * "Connect" and consumed when the callback returns. Short-lived (5 min TTL).
 */
export const oauthState = pgTable(
  'oauth_state',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    accountId: uuid('account_id').notNull(),
    userId: uuid('user_id').notNull(),
    provider: varchar('provider', { length: 100 }).notNull(),
    state: varchar('state', { length: 255 }).notNull(),
    codeVerifier: varchar('code_verifier', { length: 255 }),
    /** What kinds of connection this auth flow is for. */
    kinds: text('kinds').array(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('oauth_state_state_idx').on(table.state),
  ],
);

export const auditEvent = pgTable(
  'audit_event',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    accountId: uuid('account_id').notNull(),
    actorUserId: uuid('actor_user_id'),
    actorPlatformAdminId: uuid('actor_platform_admin_id').references(() => platformAdmin.id),
    action: varchar('action', { length: 100 }).notNull(),
    targetType: varchar('target_type', { length: 100 }).notNull(),
    targetId: uuid('target_id').notNull(),
    before: jsonb('before'),
    after: jsonb('after'),
    justification: text('justification'),
    ip: varchar('ip', { length: 64 }),
    userAgent: text('user_agent'),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_event_account_id_idx').on(table.accountId),
    index('audit_event_target_idx').on(table.targetType, table.targetId),
  ],
);

export const task = pgTable(
  'task',
  {
    ...tenantBase,
    entityId: uuid('entity_id').references(() => entity.id),
    title: varchar('title', { length: 500 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('open'),
    priority: priorityEnum('priority').notNull().default('p3'),
    dueOn: timestamp('due_on', { withTimezone: true }),
    ownerUserId: uuid('owner_user_id').references(() => user.id),
    flagState: flagStateEnum('flag_state').notNull().default('none'),
    flagReasonCode: varchar('flag_reason_code', { length: 100 }),
    flagReasonText: text('flag_reason_text'),
    handledAt: timestamp('handled_at', { withTimezone: true }),
    handledBy: uuid('handled_by'),
    sourceConnectionId: uuid('source_connection_id').references(() => connection.id),
    sourceExternalId: varchar('source_external_id', { length: 255 }),
    description: text('description'),
  },
  (table) => [
    index('task_account_id_idx').on(table.accountId),
    index('task_entity_id_idx').on(table.entityId),
    index('task_owner_user_id_idx').on(table.ownerUserId),
    index('task_flag_state_idx').on(table.flagState),
    index('task_due_on_idx').on(table.dueOn),
  ],
);

export const accountRelations = relations(account, ({ many }) => ({
  users: many(user),
  entities: many(entity),
  moduleStates: many(moduleState),
  connections: many(connection),
}));

export const userRelations = relations(user, ({ one }) => ({
  account: one(account, { fields: [user.accountId], references: [account.id] }),
}));

export const entityRelations = relations(entity, ({ one }) => ({
  account: one(account, { fields: [entity.accountId], references: [account.id] }),
}));

export type PlatformAdminInsert = InferInsertModel<typeof platformAdmin>;
export type AccountInsert = InferInsertModel<typeof account>;
export type UserInsert = InferInsertModel<typeof user>;
export type EntityInsert = InferInsertModel<typeof entity>;
export type EntityGrantInsert = InferInsertModel<typeof entityGrant>;
export type ModuleStateInsert = InferInsertModel<typeof moduleState>;
export type ConnectionInsert = InferInsertModel<typeof connection>;
export type AuditEventInsert = InferInsertModel<typeof auditEvent>;
export type TaskInsert = InferInsertModel<typeof task>;

export type TaskSelect = typeof task.$inferSelect;

// ===========================================================================
// Platform-level tables (no account_id — operator-only)
// ===========================================================================

// ---------------------------------------------------------------------------
// Integration Credentials — encrypted API keys for platform services
// ---------------------------------------------------------------------------

export const integrationProviderEnum = pgEnum('integration_provider', [
  'stripe',
  'aws_bedrock',
  'office365',
  'google_workspace',
  'plaid',
  'openai',
  'anthropic',
  'sendgrid',
  'twilio',
  'custom',
]);

export const integrationCredential = pgTable(
  'integration_credential',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    provider: integrationProviderEnum('provider').notNull(),
    label: varchar('label', { length: 255 }).notNull(),
    /** Encrypted blob — contains the JSON-serialized key material, encrypted at rest via AES-256-GCM. */
    encryptedPayload: text('encrypted_payload').notNull(),
    /** Initialization vector for decryption. */
    iv: varchar('iv', { length: 64 }).notNull(),
    /** Auth tag for AES-GCM verification. */
    authTag: varchar('auth_tag', { length: 64 }).notNull(),
    /** Non-sensitive metadata: region, environment, scopes, etc. */
    metadata: jsonb('metadata'),
    /** Whether this credential is active and should be used. */
    enabled: boolean('enabled').notNull().default(true),
    /** Last time the credential was validated/tested. */
    lastTestedAt: timestamp('last_tested_at', { withTimezone: true }),
    lastTestResult: varchar('last_test_result', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by'),
  },
  (table) => [
    index('integration_credential_provider_idx').on(table.provider),
  ],
);

// ---------------------------------------------------------------------------
// AI Prompts — system prompts, templates, guardrails
// ---------------------------------------------------------------------------

export const aiPromptKindEnum = pgEnum('ai_prompt_kind', [
  'system',
  'template',
  'guardrail',
  'few_shot',
]);

export const aiPrompt = pgTable(
  'ai_prompt',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    slug: varchar('slug', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    kind: aiPromptKindEnum('kind').notNull(),
    content: text('content').notNull(),
    /** Semver-style version for prompt iteration. */
    version: varchar('version', { length: 20 }).notNull().default('1.0.0'),
    /** Model this prompt is primarily designed for (optional). */
    modelId: uuid('model_id'),
    enabled: boolean('enabled').notNull().default(true),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('ai_prompt_slug_version_idx').on(table.slug, table.version),
    index('ai_prompt_kind_idx').on(table.kind),
  ],
);

// ---------------------------------------------------------------------------
// AI Models — registered LLM models available to the platform
// ---------------------------------------------------------------------------

export const aiModelProviderEnum = pgEnum('ai_model_provider', [
  'anthropic',
  'openai',
  'aws_bedrock',
  'google',
  'azure',
  'local',
]);

export const aiModel = pgTable(
  'ai_model',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    provider: aiModelProviderEnum('provider').notNull(),
    modelId: varchar('model_id', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    /** Max context window in tokens. */
    contextWindow: varchar('context_window', { length: 20 }),
    /** Max output tokens. */
    maxOutput: varchar('max_output', { length: 20 }),
    /** Cost per 1K input tokens (USD string for precision). */
    costPer1kInput: varchar('cost_per_1k_input', { length: 20 }),
    /** Cost per 1K output tokens. */
    costPer1kOutput: varchar('cost_per_1k_output', { length: 20 }),
    /** Which integration credential to use for this model. */
    credentialId: uuid('credential_id').references(() => integrationCredential.id),
    capabilities: jsonb('capabilities'),
    enabled: boolean('enabled').notNull().default(true),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('ai_model_provider_idx').on(table.provider),
    uniqueIndex('ai_model_provider_model_id_idx').on(table.provider, table.modelId),
  ],
);

// ---------------------------------------------------------------------------
// AI Agents — agents and sub-agents configuration
// ---------------------------------------------------------------------------

export const aiAgentTypeEnum = pgEnum('ai_agent_type', [
  'agent',
  'subagent',
  'skill',
]);

export const aiAgent = pgTable(
  'ai_agent',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    slug: varchar('slug', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    type: aiAgentTypeEnum('type').notNull(),
    description: text('description'),
    /** System prompt reference. */
    systemPromptId: uuid('system_prompt_id').references(() => aiPrompt.id),
    /** Primary model to use. */
    modelId: uuid('model_id').references(() => aiModel.id),
    /** JSON config: temperature, tools, max_tokens, etc. */
    config: jsonb('config'),
    /** Parent agent for sub-agents. */
    parentAgentId: uuid('parent_agent_id'),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('ai_agent_slug_idx').on(table.slug),
    index('ai_agent_type_idx').on(table.type),
    index('ai_agent_parent_idx').on(table.parentAgentId),
  ],
);

// ---------------------------------------------------------------------------
// AI Usage Logs — token consumption tracking
// ---------------------------------------------------------------------------

export const aiUsageLog = pgTable(
  'ai_usage_log',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    /** Which account made the request (nullable for platform-level calls). */
    accountId: uuid('account_id'),
    userId: uuid('user_id'),
    agentId: uuid('agent_id').references(() => aiAgent.id),
    modelId: uuid('model_id').references(() => aiModel.id),
    /** Input tokens consumed. */
    inputTokens: varchar('input_tokens', { length: 20 }).notNull(),
    /** Output tokens consumed. */
    outputTokens: varchar('output_tokens', { length: 20 }).notNull(),
    /** Total cost in USD (string for precision). */
    costUsd: varchar('cost_usd', { length: 20 }),
    /** Latency in milliseconds. */
    latencyMs: varchar('latency_ms', { length: 20 }),
    /** Whether the request succeeded. */
    success: boolean('success').notNull().default(true),
    errorCode: varchar('error_code', { length: 100 }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('ai_usage_log_account_idx').on(table.accountId),
    index('ai_usage_log_agent_idx').on(table.agentId),
    index('ai_usage_log_model_idx').on(table.modelId),
    index('ai_usage_log_created_at_idx').on(table.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// Type exports for new tables
// ---------------------------------------------------------------------------

export type IntegrationCredentialInsert = InferInsertModel<typeof integrationCredential>;
export type IntegrationCredentialSelect = typeof integrationCredential.$inferSelect;
export type AiPromptInsert = InferInsertModel<typeof aiPrompt>;
export type AiPromptSelect = typeof aiPrompt.$inferSelect;
export type AiModelInsert = InferInsertModel<typeof aiModel>;
export type AiModelSelect = typeof aiModel.$inferSelect;
export type AiAgentInsert = InferInsertModel<typeof aiAgent>;
export type AiAgentSelect = typeof aiAgent.$inferSelect;
export type AiUsageLogInsert = InferInsertModel<typeof aiUsageLog>;
export type AiUsageLogSelect = typeof aiUsageLog.$inferSelect;
