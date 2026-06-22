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

if command -v corepack >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@9.15.0 --activate
fi

# Railway sets NODE_ENV=production, which skips devDependencies required for build.
export NEXT_PUBLIC_APP_VERSION="$(node -p "require('./apps/web/package.json').version")"
export NEXT_PUBLIC_BUILD_TIMESTAMP="$(date -u +%Y-%m-%d)"
export NEXT_PUBLIC_BUILD_ID="${NEXT_PUBLIC_APP_VERSION}-${NEXT_PUBLIC_BUILD_TIMESTAMP}-$(git rev-parse --short HEAD 2>/dev/null || echo local)"
NODE_ENV=development pnpm install --frozen-lockfile
pnpm build:web
