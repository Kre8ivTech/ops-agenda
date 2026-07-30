CREATE TYPE "public"."connection_kind" AS ENUM('mail', 'calendar', 'tasks', 'bank', 'card', 'payroll', 'storage', 'social');--> statement-breakpoint
CREATE TYPE "public"."connection_status" AS ENUM('healthy', 'degraded', 'pending', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."entity_kind" AS ENUM('personal', 'llc', 'corp', 'sole_prop', 'nonprofit');--> statement-breakpoint
CREATE TYPE "public"."entity_status" AS ENUM('trading', 'dormant', 'marked_dissolve');--> statement-breakpoint
CREATE TYPE "public"."flag_state" AS ENUM('none', 'attention', 'at_risk', 'settled');--> statement-breakpoint
CREATE TYPE "public"."grant_role" AS ENUM('view', 'edit', 'admin');--> statement-breakpoint
CREATE TYPE "public"."module_name" AS ENUM('plan', 'productivity', 'finances', 'business', 'health', 'life', 'research', 'social');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('p1', 'p2', 'p3', 'fysa');--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"plan" varchar(50) DEFAULT 'trial' NOT NULL,
	"plan_period_end" timestamp with time zone,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"action" varchar(100) NOT NULL,
	"target_type" varchar(100) NOT NULL,
	"target_id" uuid NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"justification" text,
	"ip" varchar(64),
	"user_agent" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"provider" varchar(100) NOT NULL,
	"kind" "connection_kind" NOT NULL,
	"external_account_ref" varchar(255),
	"scopes" text[],
	"status" "connection_status" DEFAULT 'pending' NOT NULL,
	"last_sync_at" timestamp with time zone,
	"last_error_code" varchar(100),
	"secret_arn" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "entity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"name" varchar(255) NOT NULL,
	"kind" "entity_kind" NOT NULL,
	"ein_ref" varchar(255),
	"formation_state" varchar(100),
	"formed_on" timestamp with time zone,
	"status" "entity_status" DEFAULT 'trading' NOT NULL,
	"fiscal_year_end" char(5),
	"upkeep_annual" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "entity_grant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"user_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"module" "module_name" NOT NULL,
	"role" "grant_role" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"module" "module_name" NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"enabled_at" timestamp with time zone,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"entity_id" uuid,
	"title" varchar(500) NOT NULL,
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"priority" "priority" DEFAULT 'p3' NOT NULL,
	"due_on" timestamp with time zone,
	"owner_user_id" uuid,
	"flag_state" "flag_state" DEFAULT 'none' NOT NULL,
	"flag_reason_code" varchar(100),
	"flag_reason_text" text,
	"handled_at" timestamp with time zone,
	"handled_by" uuid,
	"source_connection_id" uuid,
	"source_external_id" varchar(255),
	"description" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"cognito_sub" varchar(255),
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"timezone" varchar(100) DEFAULT 'America/New_York' NOT NULL,
	"locale" varchar(10) DEFAULT 'en-US' NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"mfa_enrolled" boolean DEFAULT false NOT NULL,
	"last_seen_at" timestamp with time zone,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entity_grant" ADD CONSTRAINT "entity_grant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_grant" ADD CONSTRAINT "entity_grant_entity_id_entity_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_state" ADD CONSTRAINT "module_state_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_entity_id_entity_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_source_connection_id_connection_id_fk" FOREIGN KEY ("source_connection_id") REFERENCES "public"."connection"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_event_account_id_idx" ON "audit_event" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "audit_event_target_idx" ON "audit_event" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "connection_account_id_idx" ON "connection" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "entity_account_id_idx" ON "entity" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "entity_grant_account_user_idx" ON "entity_grant" USING btree ("account_id","user_id");--> statement-breakpoint
CREATE INDEX "entity_grant_entity_idx" ON "entity_grant" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "module_state_account_module_idx" ON "module_state" USING btree ("account_id","module");--> statement-breakpoint
CREATE INDEX "task_account_id_idx" ON "task" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "task_entity_id_idx" ON "task" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "task_owner_user_id_idx" ON "task" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "task_flag_state_idx" ON "task" USING btree ("flag_state");--> statement-breakpoint
CREATE INDEX "task_due_on_idx" ON "task" USING btree ("due_on");--> statement-breakpoint
CREATE INDEX "user_account_id_idx" ON "user" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" USING btree ("email");

-- Enable and force RLS on every tenant-scoped table.
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" FORCE ROW LEVEL SECURITY;
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user" FORCE ROW LEVEL SECURITY;
ALTER TABLE "entity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "entity" FORCE ROW LEVEL SECURITY;
ALTER TABLE "entity_grant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "entity_grant" FORCE ROW LEVEL SECURITY;
ALTER TABLE "module_state" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "module_state" FORCE ROW LEVEL SECURITY;
ALTER TABLE "connection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "connection" FORCE ROW LEVEL SECURITY;
ALTER TABLE "audit_event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_event" FORCE ROW LEVEL SECURITY;
ALTER TABLE "task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task" FORCE ROW LEVEL SECURITY;

-- Tenant isolation policies. Every tenant table filters by the transaction-scoped
-- app.account_id set by the application before any query. Soft-deleted rows are
-- excluded from the default USING policy but allowed in WITH CHECK so the app can
-- set deleted_at during a mutation.
CREATE POLICY tenant_account_isolation ON "account"
  USING ("id" = current_setting('app.account_id', true)::uuid)
  WITH CHECK ("id" = current_setting('app.account_id', true)::uuid);

CREATE POLICY tenant_user_isolation ON "user"
  USING ("account_id" = current_setting('app.account_id', true)::uuid)
  WITH CHECK ("account_id" = current_setting('app.account_id', true)::uuid);

CREATE POLICY tenant_entity_isolation ON "entity"
  USING ("account_id" = current_setting('app.account_id', true)::uuid AND "deleted_at" IS NULL)
  WITH CHECK ("account_id" = current_setting('app.account_id', true)::uuid);

CREATE POLICY tenant_entity_grant_isolation ON "entity_grant"
  USING ("account_id" = current_setting('app.account_id', true)::uuid AND "deleted_at" IS NULL)
  WITH CHECK ("account_id" = current_setting('app.account_id', true)::uuid);

CREATE POLICY tenant_module_state_isolation ON "module_state"
  USING ("account_id" = current_setting('app.account_id', true)::uuid)
  WITH CHECK ("account_id" = current_setting('app.account_id', true)::uuid);

CREATE POLICY tenant_connection_isolation ON "connection"
  USING ("account_id" = current_setting('app.account_id', true)::uuid AND "deleted_at" IS NULL)
  WITH CHECK ("account_id" = current_setting('app.account_id', true)::uuid);

CREATE POLICY tenant_audit_event_isolation ON "audit_event"
  USING ("account_id" = current_setting('app.account_id', true)::uuid)
  WITH CHECK ("account_id" = current_setting('app.account_id', true)::uuid);

CREATE POLICY tenant_task_isolation ON "task"
  USING ("account_id" = current_setting('app.account_id', true)::uuid AND "deleted_at" IS NULL)
  WITH CHECK ("account_id" = current_setting('app.account_id', true)::uuid);