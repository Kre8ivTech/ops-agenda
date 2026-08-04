CREATE TABLE "email_draft" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"content" text NOT NULL,
	"status" varchar(30) DEFAULT 'pending_review' NOT NULL,
	"source_context" text,
	"model_id" varchar(255),
	"attempt" varchar(5) DEFAULT '1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_extraction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"kind" varchar(50) NOT NULL,
	"title" varchar(500) NOT NULL,
	"deadline" timestamp with time zone,
	"owner" varchar(255),
	"confidence" varchar(10) NOT NULL,
	"reasoning" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"linked_task_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_thread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"connection_id" uuid,
	"external_thread_id" varchar(500) NOT NULL,
	"subject" varchar(1000) NOT NULL,
	"participants" text,
	"message_count" varchar(10) DEFAULT '1' NOT NULL,
	"last_message_at" timestamp with time zone NOT NULL,
	"days_since_reply" varchar(10),
	"priority" varchar(10),
	"signal_tag" varchar(50),
	"signal_detail" text,
	"rank_score" varchar(10),
	"handled_at" timestamp with time zone,
	"handled_by" uuid,
	"snoozed_until" timestamp with time zone,
	"web_link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_draft" ADD CONSTRAINT "email_draft_thread_id_email_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."email_thread"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_extraction" ADD CONSTRAINT "email_extraction_thread_id_email_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."email_thread"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_thread" ADD CONSTRAINT "email_thread_connection_id_connection_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connection"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_draft_account_idx" ON "email_draft" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "email_draft_thread_idx" ON "email_draft" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "email_extraction_account_idx" ON "email_extraction" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "email_extraction_thread_idx" ON "email_extraction" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "email_extraction_status_idx" ON "email_extraction" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_thread_account_idx" ON "email_thread" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "email_thread_priority_idx" ON "email_thread" USING btree ("priority");--> statement-breakpoint
CREATE UNIQUE INDEX "email_thread_external_id_idx" ON "email_thread" USING btree ("account_id","external_thread_id");