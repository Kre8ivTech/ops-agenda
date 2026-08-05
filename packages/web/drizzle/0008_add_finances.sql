CREATE TYPE "public"."financial_account_state" AS ENUM('healthy', 'below_threshold', 'statement_balance', 'closed');--> statement-breakpoint
CREATE TYPE "public"."transaction_direction" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('contracted', 'committed', 'projected', 'deferred');--> statement-breakpoint
CREATE TABLE "financial_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"name" varchar(255) NOT NULL,
	"institution" varchar(255),
	"entity_id" uuid,
	"entity_name" varchar(255),
	"balance" varchar(20) DEFAULT '0' NOT NULL,
	"change_30d" varchar(20),
	"state" "financial_account_state" DEFAULT 'healthy' NOT NULL,
	"threshold" varchar(20),
	"kind" varchar(50) DEFAULT 'checking' NOT NULL,
	"currency" varchar(5) DEFAULT 'USD' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"financial_account_id" uuid,
	"description" varchar(500) NOT NULL,
	"amount" varchar(20) NOT NULL,
	"direction" "transaction_direction" NOT NULL,
	"status" "transaction_status" DEFAULT 'committed' NOT NULL,
	"due_on" timestamp with time zone,
	"recurrence" varchar(100),
	"entity_name" varchar(255),
	"category" varchar(100),
	"is_deferred" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "financial_account" ADD CONSTRAINT "financial_account_entity_id_entity_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transaction" ADD CONSTRAINT "financial_transaction_financial_account_id_financial_account_id_fk" FOREIGN KEY ("financial_account_id") REFERENCES "public"."financial_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "financial_account_account_idx" ON "financial_account" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "financial_account_entity_idx" ON "financial_account" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "financial_account_state_idx" ON "financial_account" USING btree ("state");--> statement-breakpoint
CREATE INDEX "financial_transaction_account_idx" ON "financial_transaction" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "financial_transaction_fin_account_idx" ON "financial_transaction" USING btree ("financial_account_id");--> statement-breakpoint
CREATE INDEX "financial_transaction_direction_idx" ON "financial_transaction" USING btree ("direction");--> statement-breakpoint
CREATE INDEX "financial_transaction_due_on_idx" ON "financial_transaction" USING btree ("due_on");