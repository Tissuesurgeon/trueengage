#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "[trueengage-backend] applying database schema..."
  npx prisma db push --skip-generate --schema=./prisma/schema.prisma
else
  echo "[trueengage-backend] DATABASE_URL not set — skipping prisma db push"
fi

exec node dist/index.js
