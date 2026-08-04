CREATE TYPE "public"."email_signal" AS ENUM('action_required', 'follow_up', 'waiting', 'fyi', 'newsletter', 'none');--> statement-breakpoint
CREATE TABLE "calendar_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"connection_id" uuid,
	"external_id" varchar(500) NOT NULL,
	"title" varchar(500) NOT NULL,
	"location" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"organizer" varchar(320),
	"attendee_count" varchar(10),
	"response_status" varchar(20),
	"calendar_name" varchar(255),
	"calendar_color" varchar(20),
	"prep_suggestion" text,
	"has_conflict" boolean DEFAULT false NOT NULL,
	"conflict_with" uuid,
	"web_link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"connection_id" uuid,
	"external_id" varchar(500) NOT NULL,
	"from_address" varchar(320) NOT NULL,
	"from_name" varchar(255),
	"subject" varchar(1000) NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"has_attachments" boolean DEFAULT false NOT NULL,
	"signal" "email_signal" DEFAULT 'none' NOT NULL,
	"signal_confidence" varchar(10),
	"signal_reason" text,
	"rank_score" varchar(10),
	"suggested_task_title" varchar(500),
	"detected_deadline" timestamp with time zone,
	"handled_at" timestamp with time zone,
	"handled_by" uuid,
	"web_link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_connection_id_connection_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connection"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_message" ADD CONSTRAINT "email_message_connection_id_connection_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connection"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_event_account_idx" ON "calendar_event" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "calendar_event_connection_idx" ON "calendar_event" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "calendar_event_start_at_idx" ON "calendar_event" USING btree ("start_at");--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_event_external_id_idx" ON "calendar_event" USING btree ("account_id","external_id");--> statement-breakpoint
CREATE INDEX "email_message_account_idx" ON "email_message" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "email_message_connection_idx" ON "email_message" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "email_message_received_at_idx" ON "email_message" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "email_message_signal_idx" ON "email_message" USING btree ("signal");--> statement-breakpoint
CREATE UNIQUE INDEX "email_message_external_id_idx" ON "email_message" USING btree ("account_id","external_id");