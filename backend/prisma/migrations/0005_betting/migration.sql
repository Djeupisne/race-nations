-- =============================================================================
-- Migration 0005_betting — Tables du moteur de paris mutuels
-- Source : docs/betting.md (modèle parimutuel 1v1 + variante tournoi),
--          shared/api-contracts/src/enums.ts (BetMarketStatus, BetStatus,
--          BetResult, DisputeReason), backend/src/config/betting.config.ts.
--
-- NOTE D'ORDRE : le schéma Prisma (source de vérité des colonnes) déclare déjà
-- ces tables ; cette migration est la traduction SQL explicite et IDEMPOTENTE
-- (IF NOT EXISTS) pour les environnements où l'on rejoue l'historique sans
-- `prisma migrate deploy` (restore, DRP — cf. docs/runbook.md §4).
--
-- Cette migration ajoute en PLUS du DDL de base :
--   - les index de parcours des machines à états Bet / BetMarket,
--   - la colonne houseEdgeBps avec défaut contractuel 500 bps (INV-08),
--   - un index partiel sur les marchés litigieux pour l'escalade 72 h (INV-19),
--   - un index partiel sur les escrows sortants pour la jauge d'exposition
--     House (observability.md §8).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Types énumérés (créés seulement s'ils n'existent pas déjà — 0001_init via
-- Prisma les crée normalement ; ON CONFLICT-style guard DO $$ pour idempotence)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BetMarketStatus') THEN
    CREATE TYPE "BetMarketStatus" AS ENUM (
      'OPEN', 'CHALLENGED', 'LOCKED', 'SETTLING', 'SETTLED', 'DISPUTED', 'CANCELLED'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BetStatus') THEN
    CREATE TYPE "BetStatus" AS ENUM (
      'PENDING', 'ACCEPTED', 'ESCROWED', 'RUNNING', 'WON', 'LOST',
      'PUSH', 'REFUNDED', 'VOIDED'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BetResult') THEN
    CREATE TYPE "BetResult" AS ENUM (
      'WIN', 'LOSS', 'PUSH', 'REFUND', 'VOID', 'CHEAT_REVERSAL'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DisputeReason') THEN
    CREATE TYPE "DisputeReason" AS ENUM (
      'CHEAT_SUSPECTED', 'RESULT_MISMATCH', 'DISCONNECT_DISPUTE', 'SERVER_FAULT', 'OTHER'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Currency') THEN
    CREATE TYPE "Currency" AS ENUM ('SOFT', 'HARD');
  END IF;
END$$;

-- -----------------------------------------------------------------------------
-- bet_markets — marché de pari lié à un match 1v1 (ou tournoi N outcomes)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "bet_markets" (
  "id"              TEXT PRIMARY KEY,
  "creatorId"       TEXT NOT NULL REFERENCES "players"("id"),
  "opponentId"      TEXT REFERENCES "players"("id"),
  "matchId"         TEXT REFERENCES "matches"("id"),
  "tournamentRef"   TEXT,

  "currency"        "Currency" NOT NULL,
  "stake"           INTEGER NOT NULL,               -- mises identiques (INV-10)
  "totalPool"       INTEGER NOT NULL DEFAULT 0,     -- somme engagée (INV-08)
  "houseEdgeBps"    INTEGER NOT NULL DEFAULT 500,   -- 5 % contractuel (INV-08)
  "houseCutEstimate" INTEGER NOT NULL DEFAULT 0,    -- floor(totalPool*bps/10000)

  "status"          "BetMarketStatus" NOT NULL DEFAULT 'OPEN',
  "public"          BOOLEAN NOT NULL DEFAULT true,
  "trackId"         TEXT NOT NULL,
  "vehicleId"       TEXT,

  "disputedAt"      TIMESTAMP(3),                   -- gel ≤ 72 h (INV-19)
  "disputeReason"   "DisputeReason",
  "cancelledAt"     TIMESTAMP(3),

  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL
);

-- Le créateur ne peut pas être son propre opposant (auto-défi interdit ;
-- INV-10 couplé à UNIQUE(marketId, playerId) sur bets).
ALTER TABLE "bet_markets" DROP CONSTRAINT IF EXISTS "chk_bmk_no_self_challenge";
ALTER TABLE "bet_markets"
  ADD CONSTRAINT "chk_bmk_no_self_challenge"
  CHECK ("opponentId" IS NULL OR "opponentId" <> "creatorId");

CREATE INDEX IF NOT EXISTS "idx_bmk_status_currency_track"
  ON "bet_markets" ("status", "currency", "trackId");
CREATE INDEX IF NOT EXISTS "idx_bmk_creator" ON "bet_markets" ("creatorId");
CREATE INDEX IF NOT EXISTS "idx_bmk_opponent" ON "bet_markets" ("opponentId");

-- Escalade runbook : marchés DISPUTED dont le gel approche/dépasse 72 h (INV-19)
CREATE INDEX IF NOT EXISTS "idx_bmk_disputed_aging"
  ON "bet_markets" ("disputedAt")
  WHERE "status" = 'DISPUTED';

-- File de settlement (outbox INV-24) : marchés LOCKED en attente de règlement
CREATE INDEX IF NOT EXISTS "idx_bmk_settling_queue"
  ON "bet_markets" ("updatedAt")
  WHERE "status" IN ('LOCKED', 'SETTLING');

-- -----------------------------------------------------------------------------
-- bets — position d'un joueur sur un marché
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "bets" (
  "id"         TEXT PRIMARY KEY,
  "marketId"   TEXT NOT NULL REFERENCES "bet_markets"("id"),
  "playerId"   TEXT NOT NULL REFERENCES "players"("id"),

  "side"       INTEGER NOT NULL DEFAULT 0,          -- camp 0/1 (N tournoi)
  "stake"      INTEGER NOT NULL,
  "status"     "BetStatus" NOT NULL DEFAULT 'PENDING',
  "result"     "BetResult",
  "payout"     INTEGER NOT NULL DEFAULT 0,          -- floor(stake*netPool/winningStake) (INV-09)
  "escrowTxId" TEXT UNIQUE,                         -- → WalletTransaction BET_ESCROW (INV-15)

  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL
);

-- Une double position / auto-pari sur le même marché est impossible.
CREATE UNIQUE INDEX IF NOT EXISTS "uq_bet_market_player" ON "bets" ("marketId", "playerId");
CREATE INDEX IF NOT EXISTS "idx_bet_player_status" ON "bets" ("playerId", "status");
CREATE INDEX IF NOT EXISTS "idx_bet_market_side" ON "bets" ("marketId", "side");

-- Suivi des escrows ouverts (paris ESCROWED/RUNNING non réglés) — jauge
-- d'exposition House dans observability.md §8 / house-wallet.service.ts.
CREATE INDEX IF NOT EXISTS "idx_bet_escrow_outstanding"
  ON "bets" ("marketId")
  WHERE "status" IN ('ESCROWED', 'RUNNING');

-- -----------------------------------------------------------------------------
-- bet_settlements — règlement d'un marché (INSERT unique = verrou INV-14)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "bet_settlements" (
  "id"             TEXT PRIMARY KEY,
  "marketId"       TEXT NOT NULL UNIQUE,            -- INV-14 anti double-settlement
  "totalPool"      INTEGER NOT NULL,
  "houseCut"       INTEGER NOT NULL,                -- 0 si PUSH (INV-16)
  "netPool"        INTEGER NOT NULL,
  "payouts"        JSONB NOT NULL,                  -- { "<betId>": <int> } entiers
  "residual"       INTEGER NOT NULL DEFAULT 0,      -- résidu de floor → House (INV-09)
  "idempotencyKey" TEXT NOT NULL UNIQUE,            -- 'settle:<marketId>' (INV-04)
  "settledBy"      TEXT,                             -- userId admin si manuel (INV-28)
  "settledAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- payouts doit être un objet JSON (mapping betId → montant entier).
ALTER TABLE "bet_settlements" DROP CONSTRAINT IF EXISTS "chk_bst_payouts_is_object";
ALTER TABLE "bet_settlements"
  ADD CONSTRAINT "chk_bst_payouts_is_object"
  CHECK (jsonb_typeof("payouts") = 'object');

-- -----------------------------------------------------------------------------
-- jurisdiction_configs — gating légal par pays (INV-20, docs/betting-legal.md)
-- Seed de production : scripts/seed-prod.sh (matrice game-modes.md §10.5)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LicenseStatus') THEN
    CREATE TYPE "LicenseStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DENIED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BettingActivationStatus') THEN
    CREATE TYPE "BettingActivationStatus" AS ENUM (
      'DISABLED', 'PENDING', 'ENABLED_SOFT', 'ENABLED_HARD'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "jurisdiction_configs" (
  "countryCode"           TEXT PRIMARY KEY,          -- ISO 3166-1 alpha-2 majuscule
  "countryName"           TEXT NOT NULL,
  "licenseAuthority"      TEXT,                       -- LONATO | NLRC | BCLB | LONACI | LONASE | GCA | ANJ | UIGEA
  "licenseStatus"         "LicenseStatus" NOT NULL DEFAULT 'DENIED',
  "bettingActivation"     "BettingActivationStatus" NOT NULL DEFAULT 'DISABLED',
  "dailyHardLimitCents"   INTEGER,
  "monthlyHardLimitCents" INTEGER,
  "yearlyHardLimitCents"  INTEGER,
  "legalNotes"            TEXT,
  "updatedAt"             TIMESTAMP(3) NOT NULL
);

-- Deux joueurs d'un même pays peuvent parier l'un contre l'autre ; le gating
-- (jurisdiction.service.ts) exige que CHAQUE côté ait le niveau d'activation
-- requis. Index de lookup par activation pour le panneau admin.
CREATE INDEX IF NOT EXISTS "idx_jc_activation"
  ON "jurisdiction_configs" ("bettingActivation");
