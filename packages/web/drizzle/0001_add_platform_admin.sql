CREATE TABLE "platform_admin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cognito_sub" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "audit_event" ADD COLUMN "actor_platform_admin_id" uuid;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "cognito_sub" varchar(255);--> statement-breakpoint
CREATE UNIQUE INDEX "platform_admin_cognito_sub_idx" ON "platform_admin" USING btree ("cognito_sub");--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actor_platform_admin_id_platform_admin_id_fk" FOREIGN KEY ("actor_platform_admin_id") REFERENCES "public"."platform_admin"("id") ON DELETE no action ON UPDATE no action;