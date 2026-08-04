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
// Email Messages — metadata only, never bodies/attachments
// ---------------------------------------------------------------------------

export const emailSignalEnum = pgEnum('email_signal', [
  'action_required',
  'follow_up',
  'waiting',
  'fyi',
  'newsletter',
  'none',
]);

export const emailMessage = pgTable(
  'email_message',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    accountId: uuid('account_id').notNull(),
    connectionId: uuid('connection_id').references(() => connection.id),
    /** Provider's unique message ID. */
    externalId: varchar('external_id', { length: 500 }).notNull(),
    /** Email metadata — never bodies. */
    fromAddress: varchar('from_address', { length: 320 }).notNull(),
    fromName: varchar('from_name', { length: 255 }),
    subject: varchar('subject', { length: 1000 }).notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
    isRead: boolean('is_read').notNull().default(false),
    hasAttachments: boolean('has_attachments').notNull().default(false),
    /** AI-derived signals */
    signal: emailSignalEnum('signal').notNull().default('none'),
    signalConfidence: varchar('signal_confidence', { length: 10 }),
    signalReason: text('signal_reason'),
    /** Priority ranking (lower = more important). */
    rankScore: varchar('rank_score', { length: 10 }),
    /** Suggested task title if action_required. */
    suggestedTaskTitle: varchar('suggested_task_title', { length: 500 }),
    /** Deadline detected in metadata/subject. */
    detectedDeadline: timestamp('detected_deadline', { withTimezone: true }),
    /** Was this handled/dismissed by the user? */
    handledAt: timestamp('handled_at', { withTimezone: true }),
    handledBy: uuid('handled_by'),
    /** Provider URL to open in the original mail client. */
    webLink: text('web_link'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('email_message_account_idx').on(table.accountId),
    index('email_message_connection_idx').on(table.connectionId),
    index('email_message_received_at_idx').on(table.receivedAt),
    index('email_message_signal_idx').on(table.signal),
    uniqueIndex('email_message_external_id_idx').on(table.accountId, table.externalId),
  ],
);

// ---------------------------------------------------------------------------
// Email Threads — groups messages by conversation
// ---------------------------------------------------------------------------

export const emailThread = pgTable(
  'email_thread',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    accountId: uuid('account_id').notNull(),
    connectionId: uuid('connection_id').references(() => connection.id),
    /** Provider conversation/thread ID. */
    externalThreadId: varchar('external_thread_id', { length: 500 }).notNull(),
    subject: varchar('subject', { length: 1000 }).notNull(),
    /** Most recent participant emails (comma-separated). */
    participants: text('participants'),
    messageCount: varchar('message_count', { length: 10 }).notNull().default('1'),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull(),
    /** Days since user last replied. */
    daysSinceReply: varchar('days_since_reply', { length: 10 }),
    /** AI-assigned priority. */
    priority: varchar('priority', { length: 10 }),
    /** Signal tag: due_out, blocking, waiting_on_you, at_risk, none. */
    signalTag: varchar('signal_tag', { length: 50 }),
    signalDetail: text('signal_detail'),
    /** Rank score (lower = higher priority). */
    rankScore: varchar('rank_score', { length: 10 }),
    /** Whether user has handled/dismissed this thread. */
    handledAt: timestamp('handled_at', { withTimezone: true }),
    handledBy: uuid('handled_by'),
    /** Snooze until. */
    snoozedUntil: timestamp('snoozed_until', { withTimezone: true }),
    webLink: text('web_link'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('email_thread_account_idx').on(table.accountId),
    index('email_thread_priority_idx').on(table.priority),
    uniqueIndex('email_thread_external_id_idx').on(table.accountId, table.externalThreadId),
  ],
);

// ---------------------------------------------------------------------------
// Email Extractions — AI-derived commitments from threads
// ---------------------------------------------------------------------------

export const emailExtraction = pgTable(
  'email_extraction',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    accountId: uuid('account_id').notNull(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => emailThread.id),
    /** What was extracted: due_out, commitment, question, decision_needed. */
    kind: varchar('kind', { length: 50 }).notNull(),
    /** The extracted commitment/action. */
    title: varchar('title', { length: 500 }).notNull(),
    /** Detected deadline. */
    deadline: timestamp('deadline', { withTimezone: true }),
    /** Who owns it: 'you', 'them', or a name. */
    owner: varchar('owner', { length: 255 }),
    /** AI confidence 0-100. */
    confidence: varchar('confidence', { length: 10 }).notNull(),
    /** AI reasoning for the extraction. */
    reasoning: text('reasoning'),
    /** Status: pending, accepted, dismissed. */
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    /** If accepted, the task that was created from this. */
    linkedTaskId: uuid('linked_task_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('email_extraction_account_idx').on(table.accountId),
    index('email_extraction_thread_idx').on(table.threadId),
    index('email_extraction_status_idx').on(table.status),
  ],
);

// ---------------------------------------------------------------------------
// Email Drafts — AI-suggested replies (never auto-sent)
// ---------------------------------------------------------------------------

export const emailDraft = pgTable(
  'email_draft',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    accountId: uuid('account_id').notNull(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => emailThread.id),
    /** The generated reply text. */
    content: text('content').notNull(),
    /** Status: pending_review, approved, discarded, sent_externally. */
    status: varchar('status', { length: 30 }).notNull().default('pending_review'),
    /** What data was used to generate this. */
    sourceContext: text('source_context'),
    /** AI model + version used. */
    modelId: varchar('model_id', { length: 255 }),
    /** Generation attempt number (for regenerate). */
    attempt: varchar('attempt', { length: 5 }).notNull().default('1'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('email_draft_account_idx').on(table.accountId),
    index('email_draft_thread_idx').on(table.threadId),
  ],
);

export type EmailThreadInsert = InferInsertModel<typeof emailThread>;
export type EmailThreadSelect = typeof emailThread.$inferSelect;
export type EmailExtractionInsert = InferInsertModel<typeof emailExtraction>;
export type EmailExtractionSelect = typeof emailExtraction.$inferSelect;
export type EmailDraftInsert = InferInsertModel<typeof emailDraft>;
export type EmailDraftSelect = typeof emailDraft.$inferSelect;

// ---------------------------------------------------------------------------
// Calendar Events — synced from connected providers
// ---------------------------------------------------------------------------

export const calendarEvent = pgTable(
  'calendar_event',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    accountId: uuid('account_id').notNull(),
    connectionId: uuid('connection_id').references(() => connection.id),
    /** Provider's unique event ID. */
    externalId: varchar('external_id', { length: 500 }).notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    /** Location or video link. */
    location: text('location'),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }).notNull(),
    isAllDay: boolean('is_all_day').notNull().default(false),
    /** Organizer name/email. */
    organizer: varchar('organizer', { length: 320 }),
    /** Attendee count. */
    attendeeCount: varchar('attendee_count', { length: 10 }),
    /** User's RSVP status. */
    responseStatus: varchar('response_status', { length: 20 }),
    /** Calendar name/color for multi-calendar display. */
    calendarName: varchar('calendar_name', { length: 255 }),
    calendarColor: varchar('calendar_color', { length: 20 }),
    /** AI-derived prep signals */
    prepSuggestion: text('prep_suggestion'),
    /** Conflict flag (set if overlapping with another event). */
    hasConflict: boolean('has_conflict').notNull().default(false),
    conflictWith: uuid('conflict_with'),
    /** Provider URL. */
    webLink: text('web_link'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('calendar_event_account_idx').on(table.accountId),
    index('calendar_event_connection_idx').on(table.connectionId),
    index('calendar_event_start_at_idx').on(table.startAt),
    uniqueIndex('calendar_event_external_id_idx').on(table.accountId, table.externalId),
  ],
);

// ---------------------------------------------------------------------------
// Type exports for email/calendar tables
// ---------------------------------------------------------------------------

export type EmailMessageInsert = InferInsertModel<typeof emailMessage>;
export type EmailMessageSelect = typeof emailMessage.$inferSelect;
export type CalendarEventInsert = InferInsertModel<typeof calendarEvent>;
export type CalendarEventSelect = typeof calendarEvent.$inferSelect;

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

// ===========================================================================
// Productivity — Time Tracking
// ===========================================================================

export const timeEntryStateEnum = pgEnum('time_entry_state', [
  'unbilled',
  'invoiced',
  'non_billable',
  'written_off',
]);

export const timeEntry = pgTable(
  'time_entry',
  {
    ...tenantBase,
    /** Client name or project label. */
    client: varchar('client', { length: 255 }).notNull(),
    /** Which entity this time is billed under. */
    entityId: uuid('entity_id').references(() => entity.id),
    entityName: varchar('entity_name', { length: 255 }),
    /** Duration in decimal hours (e.g., 1.5 = 90 min). */
    hours: varchar('hours', { length: 10 }).notNull(),
    /** Billable dollar amount (hours × rate). */
    billableAmount: varchar('billable_amount', { length: 20 }),
    /** Hourly rate used for this entry. */
    rate: varchar('rate', { length: 20 }),
    /** Billing state. */
    state: timeEntryStateEnum('state').notNull().default('unbilled'),
    /** Description of work performed. */
    description: text('description'),
    /** Date the work was performed. */
    workedOn: timestamp('worked_on', { withTimezone: true }).notNull(),
    /** Optional: linked task. */
    taskId: uuid('task_id').references(() => task.id),
  },
  (table) => [
    index('time_entry_account_idx').on(table.accountId),
    index('time_entry_client_idx').on(table.client),
    index('time_entry_worked_on_idx').on(table.workedOn),
    index('time_entry_state_idx').on(table.state),
  ],
);

export type TimeEntryInsert = InferInsertModel<typeof timeEntry>;
export type TimeEntrySelect = typeof timeEntry.$inferSelect;

// ===========================================================================
// Productivity — Contacts (CRM-light)
// ===========================================================================

export const contactStateEnum = pgEnum('contact_state', [
  'current',
  'awaiting_you',
  'gone_quiet',
  'archived',
]);

export const contact = pgTable(
  'contact',
  {
    ...tenantBase,
    /** Person's full name. */
    name: varchar('name', { length: 255 }).notNull(),
    /** Organisation / company. */
    organisation: varchar('organisation', { length: 255 }),
    /** Primary email address. */
    email: varchar('email', { length: 320 }),
    /** Phone number. */
    phone: varchar('phone', { length: 50 }),
    /** Relationship state. */
    state: contactStateEnum('state').notNull().default('current'),
    /** Date of last interaction (email or meeting). */
    lastTouchAt: timestamp('last_touch_at', { withTimezone: true }),
    /** Number of open email threads with this person. */
    openThreads: varchar('open_threads', { length: 10 }).default('0'),
    /** Topic/context of the open thread(s). */
    openThreadContext: varchar('open_thread_context', { length: 255 }),
    /** Whether this is a key relationship (starred). */
    isKeyRelationship: boolean('is_key_relationship').notNull().default(false),
    /** Source: which connection this contact was discovered from. */
    sourceConnectionId: uuid('source_connection_id').references(() => connection.id),
    /** Notes. */
    notes: text('notes'),
  },
  (table) => [
    index('contact_account_idx').on(table.accountId),
    index('contact_state_idx').on(table.state),
    index('contact_last_touch_idx').on(table.lastTouchAt),
    index('contact_email_idx').on(table.email),
  ],
);

export type ContactInsert = InferInsertModel<typeof contact>;
export type ContactSelect = typeof contact.$inferSelect;
