#!/usr/bin/env node
// ECS entrypoint: assembles DATABASE_URL from the discrete RDS fields the
// task definition injects (DB_HOST/DB_PORT/DB_NAME as plain env vars,
// DB_USER/DB_PASSWORD from the RDS master Secrets Manager secret) so the
// generated password never has to be embedded in a CDK-synthesized string
// and is safely percent-encoded for use in a URL.
if (!process.env.DATABASE_URL) {
  const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
  if (DB_HOST && DB_NAME && DB_USER && DB_PASSWORD) {
    const user = encodeURIComponent(DB_USER);
    const password = encodeURIComponent(DB_PASSWORD);
    const port = DB_PORT ?? '5432';
    process.env.DATABASE_URL = `postgresql://${user}:${password}@${DB_HOST}:${port}/${DB_NAME}`;
  }
}

await import('./packages/web/server.js');
