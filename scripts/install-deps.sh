#!/usr/bin/env bash
set -euo pipefail

LOG=".logs/pnpm-install.log"
mkdir -p ".logs"

echo "Installing dependencies with pnpm..."

if pnpm install \
  --frozen-lockfile \
  --reporter=append-only \
  --loglevel=error \
  --no-color \
  >"$LOG" 2>&1; then
  echo "pnpm install succeeded"
else
  echo "pnpm install failed"
  echo "----- Last 120 lines -----"
  tail -120 "$LOG"
  exit 1
fi
