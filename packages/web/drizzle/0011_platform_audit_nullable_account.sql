-- Platform operator audit events (integration credentials, etc.) are not
-- scoped to a tenant. Prefer nullable account_id over a synthetic account.
ALTER TABLE "audit_event" ALTER COLUMN "account_id" DROP NOT NULL;
--> statement-breakpoint
-- Allow active platform admins to insert/read platform-scoped audit rows
-- (account_id IS NULL) when app.actor_sub matches an unrevoked platform_admin.
CREATE POLICY platform_audit_event_isolation ON "audit_event"
  USING (
    "account_id" IS NULL
    AND EXISTS (
      SELECT 1 FROM "platform_admin" pa
      WHERE pa.cognito_sub = current_setting('app.actor_sub', true)
        AND pa.revoked_at IS NULL
    )
  )
  WITH CHECK (
    "account_id" IS NULL
    AND "actor_platform_admin_id" IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM "platform_admin" pa
      WHERE pa.cognito_sub = current_setting('app.actor_sub', true)
        AND pa.revoked_at IS NULL
        AND pa.id = "actor_platform_admin_id"
    )
  );
