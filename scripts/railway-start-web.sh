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

cd "$ROOT"

echo "Applying database migrations..."
if ! pnpm db:migrate:deploy; then
  echo "migrate deploy failed; syncing schema with db push..."
  pnpm db:push
fi

pnpm start:web
