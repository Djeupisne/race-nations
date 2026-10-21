-- =============================================================================
-- Migration 0001_init — DDL initial complet (traduction SQL de schema.prisma)
-- Source de vérité : backend/prisma/schema.prisma (tables, enums, relations).
--
-- Contenu :
--   1. Tous les types ENUM PostgreSQL (miroir exact des enums Prisma),
--   2. Toutes les tables avec colonnes, défauts et contraintes UNIQUE,
--   3. Tous les index déclarés via @@index / @@unique composites,
--   4. Toutes les clés étrangères (@@relation) avec ON DELETE approprié.
--
-- Conventions :
--   - Noms de tables en snake_case (@@map), colonnes camelCase entre guillemets
--     exactement comme généré par Prisma.
--   - id = TEXT PRIMARY KEY DEFAULT uuid_generate_v4() (uuid() côté Prisma ;
--     extension pgcrypto activée ci-dessous pour que le défaut existe côté SQL
--     lors d'un replay manuel hors `prisma migrate deploy`).
--   - Json -> JSONB ; DateTime -> TIMESTAMPTZ(3) ; Int -> INTEGER ;
--     @db.Date -> DATE (HouseBalanceSnapshot.day).
--   - Les contraintes CHECK monétaires (INV-02, INV-09, INV-10…) ne sont PAS
--     ici : elles appartiennent à 0004_constraints.
--   - admin_audit_logs est créée dans 0002_audit_immutable ; webhook_events
--     dans 0003_webhook_events (migrations thématiques dédiées).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Types énumérés (alphabet des machines à états — INV-22)
-- -----------------------------------------------------------------------------

CREATE TYPE "UserRole" AS ENUM ('PLAYER', 'MODERATOR', 'ADMIN', 'SYSTEM');

CREATE TYPE "OwnerType" AS ENUM ('PLAYER', 'HOUSE', 'SYSTEM');

CREATE TYPE "SoftCurrency" AS ENUM ('CREDITS', 'GEMS', 'TOKENS');

CREATE TYPE "WalletTransactionType" AS ENUM (
  'DEPOSIT', 'PURCHASE', 'REWARD', 'BET_ESCROW', 'BET_PAYOUT', 'BET_REFUND',
  'HOUSE_FEE', 'HOUSE_REVERSAL', 'REVERSAL', 'ADMIN_ADJUSTMENT'
);

CREATE TYPE "Currency" AS ENUM ('SOFT', 'HARD');

CREATE TYPE "TicketStatus" AS ENUM (
  'QUEUED', 'MATCHED', 'JOINED', 'COMPLETED', 'CANCELLED', 'EXPIRED'
);

CREATE TYPE "QueueMode" AS ENUM (
  'RANKED_1V1', 'RANKED_FFA', 'QUICK_RACE', 'BATTLE_ROYALE',
  'TOURNAMENT', 'CLAN_WARS', 'PRACTICE'
);

CREATE TYPE "MatchStatus" AS ENUM (
  'WAITING_FOR_PLAYERS', 'LOADING', 'IN_PROGRESS', 'FINISHED',
  'FINISHED_VALIDATED', 'INVALIDATED'
);

CREATE TYPE "MatchOutcome" AS ENUM (
  'VICTORY', 'DEFEAT', 'DRAW', 'ABANDON', 'DISQUALIFIED'
);

CREATE TYPE "Division" AS ENUM (
  'BRONZE', 'ARGENT', 'OR', 'PLATINE', 'DIAMANT', 'MAITRE', 'LEGEND'
);

CREATE TYPE "GameServerStatus" AS ENUM (
  'REGISTERED', 'RESERVED', 'DRAINING', 'OFFLINE'
);

CREATE TYPE "PaymentStatus" AS ENUM (
  'CREATED', 'PROVIDER_PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED'
);

CREATE TYPE "PaymentProvider" AS ENUM (
  'STRIPE', 'FLUTTERWAVE', 'GOOGLE_PLAY', 'APPLE_IAP', 'HUAWEI_IAP'
);

CREATE TYPE "TicketItemType" AS ENUM ('TOURNAMENT', 'MATCHDAY', 'CLAN_WARS');

CREATE TYPE "BetMarketStatus" AS ENUM (
  'OPEN', 'CHALLENGED', 'LOCKED', 'SETTLING', 'SETTLED', 'DISPUTED', 'CANCELLED'
);

CREATE TYPE "BetStatus" AS ENUM (
  'PENDING', 'ACCEPTED', 'ESCROWED', 'RUNNING', 'WON', 'LOST',
  'PUSH', 'REFUNDED', 'VOIDED'
);

CREATE TYPE "BetResult" AS ENUM (
  'WIN', 'LOSS', 'PUSH', 'REFUND', 'VOID', 'CHEAT_REVERSAL'
);

CREATE TYPE "DisputeReason" AS ENUM (
  'CHEAT_SUSPECTED', 'RESULT_MISMATCH', 'DISCONNECT_DISPUTE', 'SERVER_FAULT', 'OTHER'
);

CREATE TYPE "SanctionStatus" AS ENUM (
  'ISSUED', 'ACTIVE', 'APPEALED', 'LIFTED', 'UPHELD'
);

CREATE TYPE "SanctionType" AS ENUM (
  'WARN', 'CHAT_MUTE', 'BET_RESTRICTION', 'TEMP_BAN_7D', 'PERM_BAN', 'REWARD_CLAWBACK'
);

CREATE TYPE "LicenseStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DENIED');

CREATE TYPE "BettingActivationStatus" AS ENUM (
  'DISABLED', 'PENDING', 'ENABLED_SOFT', 'ENABLED_HARD'
);

-- -----------------------------------------------------------------------------
-- 2. Identité & joueur
-- -----------------------------------------------------------------------------

CREATE TABLE "users" (
  "id"           TEXT           NOT NULL DEFAULT uuid_generate_v4(),
  "email"        TEXT           NOT NULL,
  "passwordHash" TEXT           NOT NULL,
  "role"         "UserRole"     NOT NULL DEFAULT 'PLAYER',
  "createdAt"    TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");

CREATE TABLE "players" (
  "id"                 TEXT           NOT NULL DEFAULT uuid_generate_v4(),
  "userId"             TEXT           NOT NULL,
  "username"           TEXT           NOT NULL,
  "countryCode"        TEXT           NOT NULL,
  "nationality"        TEXT           NOT NULL,
  "nationalityLocked"  BOOLEAN        NOT NULL DEFAULT false,
  "level"              INTEGER        NOT NULL DEFAULT 1,
  "xp"                 INTEGER        NOT NULL DEFAULT 0,
  "plPoints"           INTEGER        NOT NULL DEFAULT 0,
  "division"           "Division"     NOT NULL DEFAULT 'BRONZE',
  "reputation"         INTEGER        NOT NULL DEFAULT 50,
  "ageVerifiedAt"      TIMESTAMPTZ(3),
  "birthDateConfirmed" BOOLEAN        NOT NULL DEFAULT false,
  "kycDocumentRef"     TEXT,
  "preferredLanguage"  TEXT           NOT NULL DEFAULT 'fr',
  "chatGlobalEnabled"  BOOLEAN        NOT NULL DEFAULT true,
  "marketingOptIn"     BOOLEAN        NOT NULL DEFAULT false,
  "acceptedTermsAt"    TIMESTAMPTZ(3),
  "acceptedPrivacyAt"  TIMESTAMPTZ(3),
  "createdAt"          TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "players_userId_key" ON "players" ("userId");
CREATE UNIQUE INDEX "players_username_key" ON "players" ("username");
CREATE INDEX "players_nationality_plPoints_idx" ON "players" ("nationality", "plPoints"); -- leaderboards par pays (api.md §10)
CREATE INDEX "players_division_plPoints_idx" ON "players" ("division", "plPoints");

CREATE TABLE "refresh_tokens" (
  "id"        TEXT           NOT NULL DEFAULT uuid_generate_v4(),
  "userId"    TEXT           NOT NULL,
  "tokenHash" TEXT           NOT NULL,
  "family"    INTEGER        NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "revokedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens" ("tokenHash");
CREATE INDEX "refresh_tokens_userId_family_idx" ON "refresh_tokens" ("userId", "family");

-- -----------------------------------------------------------------------------
-- 3. Wallets & ledger (INV-01..INV-07)
-- -----------------------------------------------------------------------------

CREATE TABLE "wallets" (
  "id"        TEXT           NOT NULL DEFAULT uuid_generate_v4(),
  "playerId"  TEXT,
  "ownerType" "OwnerType"    NOT NULL DEFAULT 'PLAYER',
  "credits"   INTEGER        NOT NULL DEFAULT 0, -- SOFT
  "gems"      INTEGER        NOT NULL DEFAULT 0, -- SOFT
  "tokens"    INTEGER        NOT NULL DEFAULT 0, -- SOFT
  "hardCents" INTEGER        NOT NULL DEFAULT 0, -- HARD — centimes réels (INV-01)
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wallets_playerId_key" ON "wallets" ("playerId");

CREATE TABLE "wallet_transactions" (
  "id"             TEXT                    NOT NULL DEFAULT uuid_generate_v4(),
  "walletId"       TEXT                    NOT NULL,
  "type"           "WalletTransactionType" NOT NULL,
  "currencyKind"   "SoftCurrency"          NOT NULL,
  "amountSigned"   INTEGER                 NOT NULL, -- entier signé (INV-01)
  "balanceAfter"   INTEGER                 NOT NULL, -- >= 0 (CHECK 0004)
  "idempotencyKey" TEXT                    NOT NULL, -- INV-04
  "refType"        TEXT,
  "refId"          TEXT,
  "reversalOfId"   TEXT, -- chaîne de contre-écriture (INV-06)
  "createdAt"      TIMESTAMPTZ(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wallet_transactions_idempotencyKey_key" ON "wallet_transactions" ("idempotencyKey");
CREATE INDEX "wallet_transactions_walletId_createdAt_idx" ON "wallet_transactions" ("walletId", "createdAt");
CREATE INDEX "wallet_transactions_refType_refId_idx" ON "wallet_transactions" ("refType", "refId");

-- -----------------------------------------------------------------------------
-- 4. Flotte game servers + Matches & résultats (INV-25, INV-31/32)
-- -----------------------------------------------------------------------------

CREATE TABLE "game_servers" (
  "id"              TEXT               NOT NULL DEFAULT uuid_generate_v4(),
  "hostname"        TEXT               NOT NULL,
  "wsUrl"           TEXT               NOT NULL,
  "region"          TEXT               NOT NULL,
  "status"          "GameServerStatus" NOT NULL DEFAULT 'REGISTERED',
  "capacity"        INTEGER            NOT NULL DEFAULT 8,
  "activeMatches"   INTEGER            NOT NULL DEFAULT 0,
  "sharedSecretRef" TEXT               NOT NULL, -- réf KMS, jamais le secret en clair
  "lastHeartbeatAt" TIMESTAMPTZ(3),
  "drainedAt"       TIMESTAMPTZ(3),

  CONSTRAINT "game_servers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "game_servers_hostname_key" ON "game_servers" ("hostname");
CREATE INDEX "game_servers_status_region_idx" ON "game_servers" ("status", "region");

CREATE TABLE "matches" (
  "id"                TEXT          NOT NULL DEFAULT uuid_generate_v4(),
  "status"            "MatchStatus" NOT NULL DEFAULT 'WAITING_FOR_PLAYERS',
  "mode"              "QueueMode"   NOT NULL,
  "trackId"           TEXT          NOT NULL,
  "weather"           TEXT,
  "serverId"          TEXT,
  "startedAt"         TIMESTAMPTZ(3),
  "finishedAt"        TIMESTAMPTZ(3),
  "validatedAt"       TIMESTAMPTZ(3), -- gate INV-24
  "invalidatedReason" TEXT,
  "createdAt"         TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "matches_status_createdAt_idx" ON "matches" ("status", "createdAt");

CREATE TABLE "match_players" (
  "id"                  TEXT           NOT NULL DEFAULT uuid_generate_v4(),
  "matchId"             TEXT           NOT NULL,
  "playerId"            TEXT           NOT NULL,
  "position"            INTEGER,
  "outcome"             "MatchOutcome",
  "finishMs"            INTEGER, -- millisecondes entiers, jamais float
  "driftPoints"         INTEGER        NOT NULL DEFAULT 0,
  "bestLapMs"           INTEGER,
  "rewardsCredits"      INTEGER        NOT NULL DEFAULT 0, -- grille serveur (INV-32)
  "rewardsGems"         INTEGER        NOT NULL DEFAULT 0,
  "rewardsXp"           INTEGER        NOT NULL DEFAULT 0,
  "rewardsTokens"       INTEGER        NOT NULL DEFAULT 0,
  "plDelta"             INTEGER        NOT NULL DEFAULT 0, -- +25 / -20 / 0 / -30 (INV-31)
  "joinedAt"            TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "disconnectedAt"      TIMESTAMPTZ(3),
  "reconnectDeadlineAt" TIMESTAMPTZ(3), -- +30 s tolérance (INV-17)

  CONSTRAINT "match_players_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "match_players_matchId_playerId_key" ON "match_players" ("matchId", "playerId");
CREATE INDEX "match_players_playerId_idx" ON "match_players" ("playerId");

CREATE TABLE "result_payloads" (
  "id"            TEXT           NOT NULL DEFAULT uuid_generate_v4(),
  "matchId"       TEXT           NOT NULL,
  "body"          JSONB          NOT NULL, -- positions, checkpoints, vitesses max, nonce, timestamp
  "signature"     TEXT           NOT NULL, -- HMAC-SHA256 (INV-26)
  "nonce"         TEXT           NOT NULL, -- anti-replay
  "receivedAt"    TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "valid"         BOOLEAN        NOT NULL DEFAULT false,
  "invalidReason" TEXT,

  CONSTRAINT "result_payloads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "result_payloads_matchId_key" ON "result_payloads" ("matchId");
CREATE UNIQUE INDEX "result_payloads_nonce_key" ON "result_payloads" ("nonce");

-- -----------------------------------------------------------------------------
-- 5. Matchmaking — machine Ticket (INV-22)
-- -----------------------------------------------------------------------------

CREATE TABLE "matchmaking_tickets" (
  "id"           TEXT           NOT NULL DEFAULT uuid_generate_v4(),
  "playerId"     TEXT           NOT NULL,
  "mode"         "QueueMode"    NOT NULL,
  "status"       "TicketStatus" NOT NULL DEFAULT 'QUEUED',
  "plAtQueue"    INTEGER        NOT NULL,
  "matchId"      TEXT,
  "requestedAt"  TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "matchedAt"    TIMESTAMPTZ(3),
  "expiresAt"    TIMESTAMPTZ(3),
  "cancelReason" TEXT,

  CONSTRAINT "matchmaking_tickets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "matchmaking_tickets_mode_status_plAtQueue_idx" ON "matchmaking_tickets" ("mode", "status", "plAtQueue"); -- scan worker matchmaking
CREATE INDEX "matchmaking_tickets_playerId_status_idx" ON "matchmaking_tickets" ("playerId", "status");

-- -----------------------------------------------------------------------------
-- 6. Paiements (HARD money) & tickets d'événements
-- -----------------------------------------------------------------------------

CREATE TABLE "payments" (
  "id"             TEXT              NOT NULL DEFAULT uuid_generate_v4(),
  "playerId"       TEXT              NOT NULL,
  "provider"       "PaymentProvider" NOT NULL,
  "status"         "PaymentStatus"   NOT NULL DEFAULT 'CREATED',
  "amountCents"    INTEGER           NOT NULL, -- bornes 1 000–100 000 cts (CHECK 0004)
  "currencyCode"   TEXT              NOT NULL DEFAULT 'EUR',
  "jurisdiction"   TEXT              NOT NULL, -- countryCode au checkout (plafonds)
  "providerRef"    TEXT,
  "idempotencyKey" TEXT              NOT NULL, -- INV-04
  "succeededAt"    TIMESTAMPTZ(3),
  "createdAt"      TIMESTAMPTZ(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMPTZ(3)    NOT NULL,

  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_providerRef_key" ON "payments" ("providerRef");
CREATE UNIQUE INDEX "payments_idempotencyKey_key" ON "payments" ("idempotencyKey");
CREATE INDEX "payments_playerId_status_idx" ON "payments" ("playerId", "status");

CREATE TABLE "event_tickets" (
  "id"         TEXT             NOT NULL DEFAULT uuid_generate_v4(),
  "playerId"   TEXT             NOT NULL,
  "kind"       "TicketItemType" NOT NULL,
  "paidWith"   "SoftCurrency"   NOT NULL, -- CREDITS ou GEMS
  "amountPaid" INTEGER          NOT NULL, -- 500 ou 10 (entiers)
  "eventRef"   TEXT,
  "usedAt"     TIMESTAMPTZ(3),
  "createdAt"  TIMESTAMPTZ(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "event_tickets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "event_tickets_playerId_kind_idx" ON "event_tickets" ("playerId", "kind");

-- -----------------------------------------------------------------------------
-- 7. Betting — pari mutuel 1v1 (docs/betting.md)
-- -----------------------------------------------------------------------------

CREATE TABLE "bet_markets" (
  "id"               TEXT              NOT NULL DEFAULT uuid_generate_v4(),
  "creatorId"        TEXT              NOT NULL,
  "opponentId"       TEXT,
  "matchId"          TEXT,
  "tournamentRef"    TEXT,
  "currency"         "Currency"        NOT NULL,
  "stake"            INTEGER           NOT NULL, -- mises identiques (INV-10) ; CHECK stake>0 (0004)
  "totalPool"        INTEGER           NOT NULL DEFAULT 0, -- INV-08
  "houseEdgeBps"     INTEGER           NOT NULL DEFAULT 500, -- 5 % (cahier §3.10)
  "houseCutEstimate" INTEGER           NOT NULL DEFAULT 0, -- floor(totalPool*bps/10000)
  "status"           "BetMarketStatus" NOT NULL DEFAULT 'OPEN',
  "public"           BOOLEAN           NOT NULL DEFAULT true,
  "trackId"          TEXT              NOT NULL,
  "vehicleId"        TEXT,
  "disputedAt"       TIMESTAMPTZ(3), -- gel ≤ 72 h (INV-19)
  "disputeReason"    "DisputeReason",
  "cancelledAt"      TIMESTAMPTZ(3),
  "createdAt"        TIMESTAMPTZ(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMPTZ(3)    NOT NULL,

  CONSTRAINT "bet_markets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bet_markets_status_currency_trackId_idx" ON "bet_markets" ("status", "currency", "trackId"); -- GET /markets (api.md §5)
CREATE INDEX "bet_markets_creatorId_idx" ON "bet_markets" ("creatorId");
CREATE INDEX "bet_markets_opponentId_idx" ON "bet_markets" ("opponentId");

CREATE TABLE "bets" (
  "id"         TEXT        NOT NULL DEFAULT uuid_generate_v4(),
  "marketId"   TEXT        NOT NULL,
  "playerId"   TEXT        NOT NULL,
  "side"       INTEGER     NOT NULL DEFAULT 0, -- camp 0/1 (N outcomes tournoi)
  "stake"      INTEGER     NOT NULL, -- CHECK stake>0 (0004) ; == market.stake (INV-10)
  "status"     "BetStatus" NOT NULL DEFAULT 'PENDING',
  "result"     "BetResult",
  "payout"     INTEGER     NOT NULL DEFAULT 0, -- floor(stake × netPool / winningStake) (INV-09)
  "escrowTxId" TEXT, -- -> WalletTransaction BET_ESCROW (INV-15)
  "createdAt"  TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "bets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bets_escrowTxId_key" ON "bets" ("escrowTxId");
CREATE UNIQUE INDEX "bets_marketId_playerId_key" ON "bets" ("marketId", "playerId"); -- auto-pari impossible
CREATE INDEX "bets_playerId_status_idx" ON "bets" ("playerId", "status"); -- GET /bets/me
CREATE INDEX "bets_marketId_side_idx" ON "bets" ("marketId", "side"); -- winningStake au settlement

CREATE TABLE "bet_settlements" (
  "id"             TEXT           NOT NULL DEFAULT uuid_generate_v4(),
  "marketId"       TEXT           NOT NULL, -- UNIQUE = verrou anti double-settlement (INV-14)
  "totalPool"      INTEGER        NOT NULL,
  "houseCut"       INTEGER        NOT NULL, -- 0 si push (INV-16)
  "netPool"        INTEGER        NOT NULL,
  "payouts"        JSONB          NOT NULL, -- map { betId -> montant entier (cents|credits) }
  "residual"       INTEGER        NOT NULL DEFAULT 0, -- crédité House (INV-09)
  "idempotencyKey" TEXT           NOT NULL, -- settle:<marketId> (INV-04)
  "settledBy"      TEXT, -- userId admin si settlement manuel (INV-28)
  "settledAt"      TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "bet_settlements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bet_settlements_marketId_key" ON "bet_settlements" ("marketId");
CREATE UNIQUE INDEX "bet_settlements_idempotencyKey_key" ON "bet_settlements" ("idempotencyKey");

CREATE TABLE "house_balance_snapshots" (
  "id"                TEXT           NOT NULL DEFAULT uuid_generate_v4(),
  "day"               DATE           NOT NULL, -- 00:00 UTC
  "balanceCents"      INTEGER        NOT NULL,
  "escrowOutstanding" INTEGER        NOT NULL,
  "cumulativeFees"    INTEGER        NOT NULL,
  "takenAt"           TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "house_balance_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "house_balance_snapshots_day_key" ON "house_balance_snapshots" ("day");

-- -----------------------------------------------------------------------------
-- 8. Modération & sanctions
--    (admin_audit_logs : table + triggers immuables en 0002_audit_immutable)
-- -----------------------------------------------------------------------------

CREATE TABLE "sanctions" (
  "id"          TEXT             NOT NULL DEFAULT uuid_generate_v4(),
  "playerId"    TEXT             NOT NULL,
  "type"        "SanctionType"   NOT NULL,
  "status"      "SanctionStatus" NOT NULL DEFAULT 'ISSUED',
  "reason"      TEXT             NOT NULL,
  "evidenceRef" TEXT, -- lien audit/result payload (INV-18)
  "issuedById"  TEXT             NOT NULL,
  "startsAt"    TIMESTAMPTZ(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt"      TIMESTAMPTZ(3), -- TEMP_BAN_7D : +7 j
  "liftedAt"    TIMESTAMPTZ(3),
  "appealNote"  TEXT,
  "createdAt"   TIMESTAMPTZ(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMPTZ(3)   NOT NULL,

  CONSTRAINT "sanctions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sanctions_playerId_status_idx" ON "sanctions" ("playerId", "status");

-- -----------------------------------------------------------------------------
-- 9. Social (cadre minimal)
-- -----------------------------------------------------------------------------

CREATE TABLE "friend_relations" (
  "id"        TEXT           NOT NULL DEFAULT uuid_generate_v4(),
  "playerAId" TEXT           NOT NULL,
  "playerBId" TEXT           NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "friend_relations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "friend_relations_playerAId_playerBId_key" ON "friend_relations" ("playerAId", "playerBId"); -- max 200 amis (compté app)

CREATE TABLE "clans" (
  "id"               TEXT           NOT NULL DEFAULT uuid_generate_v4(),
  "name"             TEXT           NOT NULL,
  "tag"              TEXT           NOT NULL,
  "ownerId"          TEXT           NOT NULL,
  "creationCostGems" INTEGER        NOT NULL DEFAULT 500, -- CdC §8.2
  "level"            INTEGER        NOT NULL DEFAULT 1,
  "createdAt"        TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "clans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "clans_name_key" ON "clans" ("name");
CREATE UNIQUE INDEX "clans_tag_key" ON "clans" ("tag");

CREATE TABLE "clan_memberships" (
  "playerId" TEXT           NOT NULL,
  "clanId"   TEXT           NOT NULL,
  "role"     TEXT           NOT NULL DEFAULT 'MEMBER',
  "joinedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "clan_memberships_pkey" PRIMARY KEY ("playerId")
);

CREATE UNIQUE INDEX "clan_memberships_playerId_key" ON "clan_memberships" ("playerId"); -- max 50 membres (compté app)
CREATE INDEX "clan_memberships_clanId_idx" ON "clan_memberships" ("clanId");

CREATE TABLE "vehicle_ownerships" (
  "id"          TEXT           NOT NULL DEFAULT uuid_generate_v4(),
  "playerId"    TEXT           NOT NULL,
  "vehicleId"   TEXT           NOT NULL, -- réf shared/balance/vehicles.json
  "category"    TEXT           NOT NULL, -- D/C/B/A/S
  "purchasedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "vehicle_ownerships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vehicle_ownerships_playerId_vehicleId_key" ON "vehicle_ownerships" ("playerId", "vehicleId");

-- -----------------------------------------------------------------------------
-- 10. Réglementaire — licences & activation par pays (INV-20)
-- -----------------------------------------------------------------------------

CREATE TABLE "jurisdiction_configs" (
  "countryCode"           TEXT                      NOT NULL, -- ISO 3166-1 alpha-2 majuscule
  "countryName"           TEXT                      NOT NULL,
  "licenseAuthority"      TEXT, -- 'LONATO' | 'NLRC' | 'BCLB' | 'LONACI' | 'LONASE' | 'GCA' | 'ANJ' | 'UIGEA'
  "licenseStatus"         "LicenseStatus"           NOT NULL DEFAULT 'DENIED',
  "bettingActivation"     "BettingActivationStatus" NOT NULL DEFAULT 'DISABLED',
  "dailyHardLimitCents"   INTEGER,
  "monthlyHardLimitCents" INTEGER,
  "yearlyHardLimitCents"  INTEGER,
  "legalNotes"            TEXT,
  "updatedAt"             TIMESTAMPTZ(3)            NOT NULL,

  CONSTRAINT "jurisdiction_configs_pkey" PRIMARY KEY ("countryCode")
);

-- -----------------------------------------------------------------------------
-- 11. Clés étrangères (relations Prisma — onDelete Prisma par défaut : RESTRICT ;
--     SET NULL pour les références optionnelles dont la colonne est nullable)
-- -----------------------------------------------------------------------------

ALTER TABLE "players"
  ADD CONSTRAINT "players_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "refresh_tokens"
  ADD CONSTRAINT "refresh_tokens_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "wallets"
  ADD CONSTRAINT "wallets_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "wallet_transactions"
  ADD CONSTRAINT "wallet_transactions_walletId_fkey"
  FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "wallet_transactions"
  ADD CONSTRAINT "wallet_transactions_reversalOfId_fkey"
  FOREIGN KEY ("reversalOfId") REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "matchmaking_tickets"
  ADD CONSTRAINT "matchmaking_tickets_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "matchmaking_tickets"
  ADD CONSTRAINT "matchmaking_tickets_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "matches"
  ADD CONSTRAINT "matches_serverId_fkey"
  FOREIGN KEY ("serverId") REFERENCES "game_servers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "match_players"
  ADD CONSTRAINT "match_players_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "match_players"
  ADD CONSTRAINT "match_players_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "result_payloads"
  ADD CONSTRAINT "result_payloads_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "event_tickets"
  ADD CONSTRAINT "event_tickets_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bet_markets"
  ADD CONSTRAINT "bet_markets_creatorId_fkey"
  FOREIGN KEY ("creatorId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bet_markets"
  ADD CONSTRAINT "bet_markets_opponentId_fkey"
  FOREIGN KEY ("opponentId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bet_markets"
  ADD CONSTRAINT "bet_markets_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bets"
  ADD CONSTRAINT "bets_marketId_fkey"
  FOREIGN KEY ("marketId") REFERENCES "bet_markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bets"
  ADD CONSTRAINT "bets_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bets"
  ADD CONSTRAINT "bets_escrowTxId_fkey"
  FOREIGN KEY ("escrowTxId") REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bet_settlements"
  ADD CONSTRAINT "bet_settlements_marketId_fkey"
  FOREIGN KEY ("marketId") REFERENCES "bet_markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bet_settlements"
  ADD CONSTRAINT "bet_settlements_settledBy_fkey"
  FOREIGN KEY ("settledBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sanctions"
  ADD CONSTRAINT "sanctions_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sanctions"
  ADD CONSTRAINT "sanctions_issuedById_fkey"
  FOREIGN KEY ("issuedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "friend_relations"
  ADD CONSTRAINT "friend_relations_playerAId_fkey"
  FOREIGN KEY ("playerAId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "friend_relations"
  ADD CONSTRAINT "friend_relations_playerBId_fkey"
  FOREIGN KEY ("playerBId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "clans"
  ADD CONSTRAINT "clans_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "clan_memberships"
  ADD CONSTRAINT "clan_memberships_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "clan_memberships"
  ADD CONSTRAINT "clan_memberships_clanId_fkey"
  FOREIGN KEY ("clanId") REFERENCES "clans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "vehicle_ownerships"
  ADD CONSTRAINT "vehicle_ownerships_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- NOTE : webhook_events (créée intégralement en 0003_webhook_events) et
-- admin_audit_logs (table + immuabilité créées en 0002_audit_immutable, y
-- compris sa FK actorId -> users) relèvent de leurs migrations thématiques.
