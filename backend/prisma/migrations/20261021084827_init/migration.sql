-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLAYER', 'MODERATOR', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('PLAYER', 'HOUSE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "SoftCurrency" AS ENUM ('CREDITS', 'GEMS', 'TOKENS');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('DEPOSIT', 'PURCHASE', 'REWARD', 'BET_ESCROW', 'BET_PAYOUT', 'BET_REFUND', 'HOUSE_FEE', 'HOUSE_REVERSAL', 'REVERSAL', 'ADMIN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('SOFT', 'HARD');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('QUEUED', 'MATCHED', 'JOINED', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "QueueMode" AS ENUM ('RANKED_1V1', 'RANKED_FFA', 'QUICK_RACE', 'BATTLE_ROYALE', 'TOURNAMENT', 'CLAN_WARS', 'PRACTICE');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('WAITING_FOR_PLAYERS', 'LOADING', 'IN_PROGRESS', 'FINISHED', 'FINISHED_VALIDATED', 'INVALIDATED');

-- CreateEnum
CREATE TYPE "MatchOutcome" AS ENUM ('VICTORY', 'DEFEAT', 'DRAW', 'ABANDON', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "Division" AS ENUM ('BRONZE', 'ARGENT', 'OR', 'PLATINE', 'DIAMANT', 'MAITRE', 'LEGEND');

-- CreateEnum
CREATE TYPE "GameServerStatus" AS ENUM ('REGISTERED', 'RESERVED', 'DRAINING', 'OFFLINE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PROVIDER_PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'FLUTTERWAVE', 'GOOGLE_PLAY', 'APPLE_IAP', 'HUAWEI_IAP');

-- CreateEnum
CREATE TYPE "TicketItemType" AS ENUM ('TOURNAMENT', 'MATCHDAY', 'CLAN_WARS');

-- CreateEnum
CREATE TYPE "BetMarketStatus" AS ENUM ('OPEN', 'CHALLENGED', 'LOCKED', 'SETTLING', 'SETTLED', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BetStatus" AS ENUM ('PENDING', 'ACCEPTED', 'ESCROWED', 'RUNNING', 'WON', 'LOST', 'PUSH', 'REFUNDED', 'VOIDED');

-- CreateEnum
CREATE TYPE "BetResult" AS ENUM ('WIN', 'LOSS', 'PUSH', 'REFUND', 'VOID', 'CHEAT_REVERSAL');

-- CreateEnum
CREATE TYPE "DisputeReason" AS ENUM ('CHEAT_SUSPECTED', 'RESULT_MISMATCH', 'DISCONNECT_DISPUTE', 'SERVER_FAULT', 'OTHER');

-- CreateEnum
CREATE TYPE "SanctionStatus" AS ENUM ('ISSUED', 'ACTIVE', 'APPEALED', 'LIFTED', 'UPHELD');

-- CreateEnum
CREATE TYPE "SanctionType" AS ENUM ('WARN', 'CHAT_MUTE', 'BET_RESTRICTION', 'TEMP_BAN_7D', 'PERM_BAN', 'REWARD_CLAWBACK');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DENIED');

-- CreateEnum
CREATE TYPE "BettingActivationStatus" AS ENUM ('DISABLED', 'PENDING', 'ENABLED_SOFT', 'ENABLED_HARD');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PLAYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "nationalityLocked" BOOLEAN NOT NULL DEFAULT false,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "plPoints" INTEGER NOT NULL DEFAULT 0,
    "division" "Division" NOT NULL DEFAULT 'BRONZE',
    "reputation" INTEGER NOT NULL DEFAULT 50,
    "ageVerifiedAt" TIMESTAMP(3),
    "birthDateConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "kycDocumentRef" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'fr',
    "chatGlobalEnabled" BOOLEAN NOT NULL DEFAULT true,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "acceptedTermsAt" TIMESTAMP(3),
    "acceptedPrivacyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "family" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "playerId" TEXT,
    "ownerType" "OwnerType" NOT NULL DEFAULT 'PLAYER',
    "credits" INTEGER NOT NULL DEFAULT 0,
    "gems" INTEGER NOT NULL DEFAULT 0,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "hardCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "currencyKind" "SoftCurrency" NOT NULL,
    "amountSigned" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "reversalOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matchmaking_tickets" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "mode" "QueueMode" NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'QUEUED',
    "plAtQueue" INTEGER NOT NULL,
    "matchId" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "cancelReason" TEXT,

    CONSTRAINT "matchmaking_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'WAITING_FOR_PLAYERS',
    "mode" "QueueMode" NOT NULL,
    "trackId" TEXT NOT NULL,
    "weather" TEXT,
    "serverId" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "validatedAt" TIMESTAMP(3),
    "invalidatedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_players" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "position" INTEGER,
    "outcome" "MatchOutcome",
    "finishMs" INTEGER,
    "driftPoints" INTEGER NOT NULL DEFAULT 0,
    "bestLapMs" INTEGER,
    "rewardsCredits" INTEGER NOT NULL DEFAULT 0,
    "rewardsGems" INTEGER NOT NULL DEFAULT 0,
    "rewardsXp" INTEGER NOT NULL DEFAULT 0,
    "rewardsTokens" INTEGER NOT NULL DEFAULT 0,
    "plDelta" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),
    "reconnectDeadlineAt" TIMESTAMP(3),

    CONSTRAINT "match_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_payloads" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "body" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid" BOOLEAN NOT NULL DEFAULT false,
    "invalidReason" TEXT,

    CONSTRAINT "result_payloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_servers" (
    "id" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "wsUrl" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "status" "GameServerStatus" NOT NULL DEFAULT 'REGISTERED',
    "capacity" INTEGER NOT NULL DEFAULT 8,
    "activeMatches" INTEGER NOT NULL DEFAULT 0,
    "sharedSecretRef" TEXT NOT NULL,
    "lastHeartbeatAt" TIMESTAMP(3),
    "drainedAt" TIMESTAMP(3),

    CONSTRAINT "game_servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "amountCents" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "jurisdiction" TEXT NOT NULL,
    "providerRef" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "succeededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_tickets" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "kind" "TicketItemType" NOT NULL,
    "paidWith" "SoftCurrency" NOT NULL,
    "amountPaid" INTEGER NOT NULL,
    "eventRef" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signatureValid" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bet_markets" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "opponentId" TEXT,
    "matchId" TEXT,
    "tournamentRef" TEXT,
    "currency" "Currency" NOT NULL,
    "stake" INTEGER NOT NULL,
    "totalPool" INTEGER NOT NULL DEFAULT 0,
    "houseEdgeBps" INTEGER NOT NULL DEFAULT 500,
    "houseCutEstimate" INTEGER NOT NULL DEFAULT 0,
    "status" "BetMarketStatus" NOT NULL DEFAULT 'OPEN',
    "public" BOOLEAN NOT NULL DEFAULT true,
    "trackId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "disputedAt" TIMESTAMP(3),
    "disputeReason" "DisputeReason",
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bet_markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bets" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "side" INTEGER NOT NULL DEFAULT 0,
    "stake" INTEGER NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'PENDING',
    "result" "BetResult",
    "payout" INTEGER NOT NULL DEFAULT 0,
    "escrowTxId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bet_settlements" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "totalPool" INTEGER NOT NULL,
    "houseCut" INTEGER NOT NULL,
    "netPool" INTEGER NOT NULL,
    "payouts" JSONB NOT NULL,
    "residual" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT NOT NULL,
    "settledBy" TEXT,
    "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bet_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "house_balance_snapshots" (
    "id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "balanceCents" INTEGER NOT NULL,
    "escrowOutstanding" INTEGER NOT NULL,
    "cumulativeFees" INTEGER NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "house_balance_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sanctions" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "type" "SanctionType" NOT NULL,
    "status" "SanctionStatus" NOT NULL DEFAULT 'ISSUED',
    "reason" TEXT NOT NULL,
    "evidenceRef" TEXT,
    "issuedById" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "liftedAt" TIMESTAMP(3),
    "appealNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sanctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friend_relations" (
    "id" TEXT NOT NULL,
    "playerAId" TEXT NOT NULL,
    "playerBId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friend_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "creationCostGems" INTEGER NOT NULL DEFAULT 500,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clan_memberships" (
    "playerId" TEXT NOT NULL,
    "clanId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clan_memberships_pkey" PRIMARY KEY ("playerId")
);

-- CreateTable
CREATE TABLE "vehicle_ownerships" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_ownerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jurisdiction_configs" (
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "licenseAuthority" TEXT,
    "licenseStatus" "LicenseStatus" NOT NULL DEFAULT 'DENIED',
    "bettingActivation" "BettingActivationStatus" NOT NULL DEFAULT 'DISABLED',
    "dailyHardLimitCents" INTEGER,
    "monthlyHardLimitCents" INTEGER,
    "yearlyHardLimitCents" INTEGER,
    "legalNotes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jurisdiction_configs_pkey" PRIMARY KEY ("countryCode")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "players_userId_key" ON "players"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "players_username_key" ON "players"("username");

-- CreateIndex
CREATE INDEX "players_nationality_plPoints_idx" ON "players"("nationality", "plPoints");

-- CreateIndex
CREATE INDEX "players_division_plPoints_idx" ON "players"("division", "plPoints");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_family_idx" ON "refresh_tokens"("userId", "family");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_playerId_key" ON "wallets"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_idempotencyKey_key" ON "wallet_transactions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "wallet_transactions_walletId_createdAt_idx" ON "wallet_transactions"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "wallet_transactions_refType_refId_idx" ON "wallet_transactions"("refType", "refId");

-- CreateIndex
CREATE INDEX "matchmaking_tickets_mode_status_plAtQueue_idx" ON "matchmaking_tickets"("mode", "status", "plAtQueue");

-- CreateIndex
CREATE INDEX "matchmaking_tickets_playerId_status_idx" ON "matchmaking_tickets"("playerId", "status");

-- CreateIndex
CREATE INDEX "matches_status_createdAt_idx" ON "matches"("status", "createdAt");

-- CreateIndex
CREATE INDEX "match_players_playerId_idx" ON "match_players"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "match_players_matchId_playerId_key" ON "match_players"("matchId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "result_payloads_matchId_key" ON "result_payloads"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "result_payloads_nonce_key" ON "result_payloads"("nonce");

-- CreateIndex
CREATE UNIQUE INDEX "game_servers_hostname_key" ON "game_servers"("hostname");

-- CreateIndex
CREATE INDEX "game_servers_status_region_idx" ON "game_servers"("status", "region");

-- CreateIndex
CREATE UNIQUE INDEX "payments_providerRef_key" ON "payments"("providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotencyKey_key" ON "payments"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payments_playerId_status_idx" ON "payments"("playerId", "status");

-- CreateIndex
CREATE INDEX "event_tickets_playerId_kind_idx" ON "event_tickets"("playerId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_idempotencyKey_key" ON "webhook_events"("idempotencyKey");

-- CreateIndex
CREATE INDEX "webhook_events_provider_receivedAt_idx" ON "webhook_events"("provider", "receivedAt");

-- CreateIndex
CREATE INDEX "bet_markets_status_currency_trackId_idx" ON "bet_markets"("status", "currency", "trackId");

-- CreateIndex
CREATE INDEX "bet_markets_creatorId_idx" ON "bet_markets"("creatorId");

-- CreateIndex
CREATE INDEX "bet_markets_opponentId_idx" ON "bet_markets"("opponentId");

-- CreateIndex
CREATE UNIQUE INDEX "bets_escrowTxId_key" ON "bets"("escrowTxId");

-- CreateIndex
CREATE INDEX "bets_playerId_status_idx" ON "bets"("playerId", "status");

-- CreateIndex
CREATE INDEX "bets_marketId_side_idx" ON "bets"("marketId", "side");

-- CreateIndex
CREATE UNIQUE INDEX "bets_marketId_playerId_key" ON "bets"("marketId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "bet_settlements_marketId_key" ON "bet_settlements"("marketId");

-- CreateIndex
CREATE UNIQUE INDEX "bet_settlements_idempotencyKey_key" ON "bet_settlements"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "house_balance_snapshots_day_key" ON "house_balance_snapshots"("day");

-- CreateIndex
CREATE INDEX "sanctions_playerId_status_idx" ON "sanctions"("playerId", "status");

-- CreateIndex
CREATE INDEX "admin_audit_logs_actorId_createdAt_idx" ON "admin_audit_logs"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "admin_audit_logs_targetType_targetId_idx" ON "admin_audit_logs"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "friend_relations_playerAId_playerBId_key" ON "friend_relations"("playerAId", "playerBId");

-- CreateIndex
CREATE UNIQUE INDEX "clans_name_key" ON "clans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "clans_tag_key" ON "clans"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "clan_memberships_playerId_key" ON "clan_memberships"("playerId");

-- CreateIndex
CREATE INDEX "clan_memberships_clanId_idx" ON "clan_memberships"("clanId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_ownerships_playerId_vehicleId_key" ON "vehicle_ownerships"("playerId", "vehicleId");

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchmaking_tickets" ADD CONSTRAINT "matchmaking_tickets_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchmaking_tickets" ADD CONSTRAINT "matchmaking_tickets_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "game_servers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_payloads" ADD CONSTRAINT "result_payloads_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bet_markets" ADD CONSTRAINT "bet_markets_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bet_markets" ADD CONSTRAINT "bet_markets_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bet_markets" ADD CONSTRAINT "bet_markets_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "bet_markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bet_settlements" ADD CONSTRAINT "bet_settlements_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "bet_markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_relations" ADD CONSTRAINT "friend_relations_playerAId_fkey" FOREIGN KEY ("playerAId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_relations" ADD CONSTRAINT "friend_relations_playerBId_fkey" FOREIGN KEY ("playerBId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clan_memberships" ADD CONSTRAINT "clan_memberships_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clan_memberships" ADD CONSTRAINT "clan_memberships_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "clans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_ownerships" ADD CONSTRAINT "vehicle_ownerships_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
