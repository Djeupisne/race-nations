#!/usr/bin/env bash
# Race Nations — Démarrage de l'environnement de dev : Postgres + Redis (Docker) puis backend NestJS.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose"
if ! $COMPOSE version >/dev/null 2>&1; then COMPOSE="docker-compose"; fi

echo "==> 1/3 Bases de données (postgres, redis)…"
if [ -f docker-compose.yml ] && grep -qE '^\s*(postgres|db)\s*:' docker-compose.yml; then
  $COMPOSE up -d postgres redis 2>/dev/null || $COMPOSE up -d
else
  # Compose racine vide/non renseigné : fallback sur des conteneurs nommés idempotents.
  $COMPOSE up -d --name rn-postgres -e POSTGRES_USER=race -e POSTGRES_PASSWORD=race \
    -e POSTGRES_DB=race_nations -p 5432:5432 postgres:16-alpine || true
  $COMPOSE up -d --name rn-redis -p 6379:6379 redis:7-alpine || true
fi

echo "==> 2/3 Attente de disponibilité…"
for i in $(seq 1 30); do
  if (exec 3<>/dev/tcp/127.0.0.1/5432) 2>/dev/null; then exec 3>&- 3<&-; echo "   postgres:OK"; break; fi
  sleep 1; [ "$i" = 30 ] && { echo "postgres indisponible après 30s"; exit 1; }
done
for i in $(seq 1 30); do
  if (exec 3<>/dev/tcp/127.0.0.1/6379) 2>/dev/null; then exec 3>&- 3<&-; echo "   redis:OK"; break; fi
  sleep 1; [ "$i" = 30 ] && { echo "redis indisponible après 30s"; exit 1; }
done

echo "==> 3/3 Backend NestJS…"
cd "$ROOT/backend"
[ -f .env ] || cp .env.example .env 2>/dev/null || \
  printf 'DATABASE_URL=postgresql://race:race@localhost:5432/race_nations\nREDIS_URL=redis://localhost:6379\nJWT_SECRET=dev-only-secret-change-me\nPORT=3000\n' > .env
[ -d node_modules ] || npm install
npx prisma migrate deploy || npx prisma migrate dev --name init
exec npm run start:dev
