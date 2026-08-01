CREATE TYPE "public"."ai_agent_type" AS ENUM('agent', 'subagent', 'skill');--> statement-breakpoint
CREATE TYPE "public"."ai_model_provider" AS ENUM('anthropic', 'openai', 'aws_bedrock', 'google', 'azure', 'local');--> statement-breakpoint
CREATE TYPE "public"."ai_prompt_kind" AS ENUM('system', 'template', 'guardrail', 'few_shot');--> statement-breakpoint
CREATE TYPE "public"."integration_provider" AS ENUM('stripe', 'aws_bedrock', 'office365', 'google_workspace', 'plaid', 'openai', 'anthropic', 'sendgrid', 'twilio', 'custom');--> statement-breakpoint
CREATE TABLE "ai_agent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "ai_agent_type" NOT NULL,
	"description" text,
	"system_prompt_id" uuid,
	"model_id" uuid,
	"config" jsonb,
	"parent_agent_id" uuid,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_model" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "ai_model_provider" NOT NULL,
	"model_id" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"context_window" varchar(20),
	"max_output" varchar(20),
	"cost_per_1k_input" varchar(20),
	"cost_per_1k_output" varchar(20),
	"credential_id" uuid,
	"capabilities" jsonb,
	"enabled" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_prompt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"kind" "ai_prompt_kind" NOT NULL,
	"content" text NOT NULL,
	"version" varchar(20) DEFAULT '1.0.0' NOT NULL,
	"model_id" uuid,
	"enabled" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid,
	"user_id" uuid,
	"agent_id" uuid,
	"model_id" uuid,
	"input_tokens" varchar(20) NOT NULL,
	"output_tokens" varchar(20) NOT NULL,
	"cost_usd" varchar(20),
	"latency_ms" varchar(20),
	"success" boolean DEFAULT true NOT NULL,
	"error_code" varchar(100),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_credential" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"label" varchar(255) NOT NULL,
	"encrypted_payload" text NOT NULL,
	"iv" varchar(64) NOT NULL,
	"auth_tag" varchar(64) NOT NULL,
	"metadata" jsonb,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_tested_at" timestamp with time zone,
	"last_test_result" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "ai_agent" ADD CONSTRAINT "ai_agent_system_prompt_id_ai_prompt_id_fk" FOREIGN KEY ("system_prompt_id") REFERENCES "public"."ai_prompt"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_agent" ADD CONSTRAINT "ai_agent_model_id_ai_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_model"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_model" ADD CONSTRAINT "ai_model_credential_id_integration_credential_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."integration_credential"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_log" ADD CONSTRAINT "ai_usage_log_agent_id_ai_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agent"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_log" ADD CONSTRAINT "ai_usage_log_model_id_ai_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_model"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_agent_slug_idx" ON "ai_agent" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "ai_agent_type_idx" ON "ai_agent" USING btree ("type");--> statement-breakpoint
CREATE INDEX "ai_agent_parent_idx" ON "ai_agent" USING btree ("parent_agent_id");--> statement-breakpoint
CREATE INDEX "ai_model_provider_idx" ON "ai_model" USING btree ("provider");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_model_provider_model_id_idx" ON "ai_model" USING btree ("provider","model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_prompt_slug_version_idx" ON "ai_prompt" USING btree ("slug","version");--> statement-breakpoint
CREATE INDEX "ai_prompt_kind_idx" ON "ai_prompt" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "ai_usage_log_account_idx" ON "ai_usage_log" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "ai_usage_log_agent_idx" ON "ai_usage_log" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "ai_usage_log_model_idx" ON "ai_usage_log" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "ai_usage_log_created_at_idx" ON "ai_usage_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "integration_credential_provider_idx" ON "integration_credential" USING btree ("provider");