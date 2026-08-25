ALTER TABLE "connection" ADD COLUMN "entity_id" uuid;--> statement-breakpoint
UPDATE "connection" AS "current_connection"
SET "entity_id" = (
	SELECT "entity"."id"
	FROM "entity"
	WHERE "entity"."account_id" = "current_connection"."account_id"
		AND "entity"."kind" = 'personal'
		AND "entity"."deleted_at" IS NULL
	ORDER BY "entity"."created_at" ASC
	LIMIT 1
)
WHERE "current_connection"."entity_id" IS NULL;--> statement-breakpoint
ALTER TABLE "connection" ADD CONSTRAINT "connection_entity_id_entity_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "connection_entity_id_idx" ON "connection" USING btree ("entity_id");
