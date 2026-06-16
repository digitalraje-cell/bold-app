#!/usr/bin/env bash
set -euo pipefail

if [ -f "pnpm-workspace.yaml" ]; then
  ROOT="$(pwd)"
elif [ -f "../../pnpm-workspace.yaml" ]; then
  ROOT="$(cd ../.. && pwd)"
else
  echo "Could not find pnpm-workspace.yaml"
  exit 1
fi

cd "$ROOT/apps/api"

if [ ! -f "dist/main.js" ]; then
  echo "API build output missing: apps/api/dist/main.js"
  exit 1
fi

echo "Applying database migrations..."
if ! pnpm exec prisma migrate deploy; then
  echo "migrate deploy failed; syncing schema with db push..."
  pnpm exec prisma db push --skip-generate
fi

exec node dist/main.js
