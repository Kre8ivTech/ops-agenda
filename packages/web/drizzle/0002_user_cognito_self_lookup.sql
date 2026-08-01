-- Allow a signed-in Cognito principal to find their own tenant user row
-- before account_id is known (post-login session enrichment).
CREATE POLICY user_cognito_self_lookup ON "user"
  FOR SELECT
  USING (cognito_sub IS NOT NULL AND cognito_sub = current_setting('app.actor_sub', true));
