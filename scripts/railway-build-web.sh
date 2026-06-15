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

pnpm install --frozen-lockfile
pnpm build:web
