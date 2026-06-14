#!/bin/sh
set -e

PRISMA_CLI="./node_modules/prisma/build/index.js"

if [ -n "$DATABASE_URL" ]; then
  echo "[trueengage-backend] applying database schema..."
  node "$PRISMA_CLI" db push --skip-generate
else
  echo "[trueengage-backend] DATABASE_URL not set — skipping prisma db push"
fi

exec node dist/index.js
