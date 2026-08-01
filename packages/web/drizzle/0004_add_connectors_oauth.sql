CREATE TABLE "oauth_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(100) NOT NULL,
	"state" varchar(255) NOT NULL,
	"code_verifier" varchar(255),
	"kinds" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"consumed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "connection" ADD COLUMN "access_token_enc" text;--> statement-breakpoint
ALTER TABLE "connection" ADD COLUMN "refresh_token_enc" text;--> statement-breakpoint
ALTER TABLE "connection" ADD COLUMN "token_iv" varchar(64);--> statement-breakpoint
ALTER TABLE "connection" ADD COLUMN "token_auth_tag" varchar(64);--> statement-breakpoint
ALTER TABLE "connection" ADD COLUMN "token_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "connection" ADD COLUMN "imap_host" varchar(255);--> statement-breakpoint
ALTER TABLE "connection" ADD COLUMN "imap_port" varchar(10);--> statement-breakpoint
ALTER TABLE "connection" ADD COLUMN "imap_security" varchar(10);--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_state_state_idx" ON "oauth_state" USING btree ("state");