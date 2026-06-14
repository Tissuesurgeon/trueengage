# TrueEngage backend — build from repository root:
#   docker build -f apps/backend/Dockerfile -t trueengage-backend .
#
# Railway: Root Directory = repo root, Dockerfile path = apps/backend/Dockerfile

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl wget
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/
COPY packages/shared/package.json packages/shared/
COPY packages/ai-engine/package.json packages/ai-engine/
COPY packages/campaign-engine/package.json packages/campaign-engine/
COPY packages/execution-engine/package.json packages/execution-engine/
COPY packages/smart-account-engine/package.json packages/smart-account-engine/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY packages/shared packages/shared
COPY packages/ai-engine packages/ai-engine
COPY packages/campaign-engine packages/campaign-engine
COPY packages/execution-engine packages/execution-engine
COPY packages/smart-account-engine packages/smart-account-engine
COPY apps/backend apps/backend
RUN pnpm turbo run build --filter=@trueengage/backend...
WORKDIR /app/apps/backend
RUN pnpm exec prisma generate
WORKDIR /app
RUN pnpm deploy --filter @trueengage/backend --prod /prod/backend

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache wget

COPY --from=build /prod/backend ./
COPY --from=build /app/apps/backend/prisma ./prisma
COPY apps/backend/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-4000}/health" || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
