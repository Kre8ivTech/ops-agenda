# Multi-stage build for the @ops-agenda/web Next.js app (standalone output).
# Built from the monorepo root so pnpm workspace resolution works correctly.

FROM node:22-alpine AS base
RUN corepack enable

# ---- deps: install with lockfile, cached separately from source changes ----
FROM base AS deps
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc* ./
COPY packages/web/package.json packages/web/package.json
COPY packages/infra/package.json packages/infra/package.json
RUN pnpm install --frozen-lockfile

# ---- builder: compile the Next.js standalone bundle ----
FROM base AS builder
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/packages/web/node_modules ./packages/web/node_modules
COPY . .
RUN pnpm --filter @ops-agenda/web build

# ---- runner: minimal image serving the standalone server ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /repo/packages/web/.next/standalone ./
COPY --from=builder /repo/packages/web/.next/static ./packages/web/.next/static
COPY --from=builder /repo/packages/web/public ./packages/web/public
COPY packages/web/scripts/bootstrap.mjs ./bootstrap.mjs

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "bootstrap.mjs"]
