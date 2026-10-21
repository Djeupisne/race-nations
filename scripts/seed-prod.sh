#!/usr/bin/env bash
# Race Nations — Seed des données de base en production : pays + achievements de base + config.
# Idempotent : s'appuie sur prisma/seed.ts (upsert) — relançable sans dupliquer.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/backend"

if [ "${NODE_ENV:-production}" != "development" ]; then
  echo "⚠  Seed PROD sur DATABASE_URL=$(grep -o 'postgresql://[^@]*' .env 2>/dev/null | sed 's/postgresql:\/\///' || echo '<non défini>')…"
  [ "${CONFIRM_PROD_SEED:-}" = "yes" ] || { echo "Posez CONFIRM_PROD_SEED=yes pour confirmer."; exit 1; }
fi

[ -d node_modules ] || npm ci
npx prisma generate

if [ -f prisma/seed.ts ]; then
  npx ts-node prisma/seed.ts
elif [ -f dist/seed.js ]; then
  node dist/seed.js
else
  echo "ERREUR : aucun point d'entrée de seed trouvé (prisma/seed.ts attendu : pays + achievements de base)." >&2
  exit 1
fi
echo "==> Seed terminé (pays, achievements de base, feature flags par défaut)."
