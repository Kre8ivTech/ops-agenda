CREATE TYPE "public"."contact_state" AS ENUM('current', 'awaiting_you', 'gone_quiet', 'archived');--> statement-breakpoint
CREATE TYPE "public"."time_entry_state" AS ENUM('unbilled', 'invoiced', 'non_billable', 'written_off');--> statement-breakpoint
CREATE TABLE "contact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"name" varchar(255) NOT NULL,
	"organisation" varchar(255),
	"email" varchar(320),
	"phone" varchar(50),
	"state" "contact_state" DEFAULT 'current' NOT NULL,
	"last_touch_at" timestamp with time zone,
	"open_threads" varchar(10) DEFAULT '0',
	"open_thread_context" varchar(255),
	"is_key_relationship" boolean DEFAULT false NOT NULL,
	"source_connection_id" uuid,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "time_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"client" varchar(255) NOT NULL,
	"entity_id" uuid,
	"entity_name" varchar(255),
	"hours" varchar(10) NOT NULL,
	"billable_amount" varchar(20),
	"rate" varchar(20),
	"state" time_entry_state DEFAULT 'unbilled' NOT NULL,
	"description" text,
	"worked_on" timestamp with time zone NOT NULL,
	"task_id" uuid
);
--> statement-breakpoint
ALTER TABLE "contact" ADD CONSTRAINT "contact_source_connection_id_connection_id_fk" FOREIGN KEY ("source_connection_id") REFERENCES "public"."connection"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entry" ADD CONSTRAINT "time_entry_entity_id_entity_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entry" ADD CONSTRAINT "time_entry_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_account_idx" ON "contact" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "contact_state_idx" ON "contact" USING btree ("state");--> statement-breakpoint
CREATE INDEX "contact_last_touch_idx" ON "contact" USING btree ("last_touch_at");--> statement-breakpoint
CREATE INDEX "contact_email_idx" ON "contact" USING btree ("email");--> statement-breakpoint
CREATE INDEX "time_entry_account_idx" ON "time_entry" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "time_entry_client_idx" ON "time_entry" USING btree ("client");--> statement-breakpoint
CREATE INDEX "time_entry_worked_on_idx" ON "time_entry" USING btree ("worked_on");--> statement-breakpoint
CREATE INDEX "time_entry_state_idx" ON "time_entry" USING btree ("state");