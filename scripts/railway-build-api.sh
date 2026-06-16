#!/usr/bin/env bash
set -euo pipefail

# Resolve monorepo root whether Railway root is "/" or "apps/api"
if [ -f "pnpm-workspace.yaml" ]; then
  ROOT="$(pwd)"
elif [ -f "../../pnpm-workspace.yaml" ]; then
  ROOT="$(cd ../.. && pwd)"
else
  echo "Could not find pnpm-workspace.yaml"
  exit 1
fi

cd "$ROOT"

if command -v corepack >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@9.15.0 --activate
fi

# Railway sets NODE_ENV=production, which skips devDependencies required for build.
NODE_ENV=development pnpm install --frozen-lockfile
pnpm build:api
