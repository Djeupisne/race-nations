#!/usr/bin/env bash
# Race Nations — Migrations Prisma. Usage : ./scripts/migrate.sh [nom-de-migration]
# En CI/déploiement : MIGRATION_MODE=deploy ./scripts/migrate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/backend"

[ -f .env ] || cp .env.example .env 2>/dev/null || true
[ -d node_modules ] || npm ci || npm install

if [ "${MIGRATION_MODE:-dev}" = "deploy" ]; then
  echo "==> prisma migrate deploy (non interactif)"
  npx prisma migrate deploy
  npx prisma generate
else
  NAME="${1:-$(date +%Y%m%d%H%M%S)}_auto"
  echo "==> prisma migrate dev --name ${NAME}"
  npx prisma migrate dev --name "${NAME}"
fi
echo "==> Terminé."
