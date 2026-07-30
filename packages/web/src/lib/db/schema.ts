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
  },
  (table) => [index('connection_account_id_idx').on(table.accountId)],
);

export const auditEvent = pgTable(
  'audit_event',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    accountId: uuid('account_id').notNull(),
    actorUserId: uuid('actor_user_id'),
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

export type AccountInsert = InferInsertModel<typeof account>;
export type UserInsert = InferInsertModel<typeof user>;
export type EntityInsert = InferInsertModel<typeof entity>;
export type EntityGrantInsert = InferInsertModel<typeof entityGrant>;
export type ModuleStateInsert = InferInsertModel<typeof moduleState>;
export type ConnectionInsert = InferInsertModel<typeof connection>;
export type AuditEventInsert = InferInsertModel<typeof auditEvent>;
export type TaskInsert = InferInsertModel<typeof task>;

export type TaskSelect = typeof task.$inferSelect;
