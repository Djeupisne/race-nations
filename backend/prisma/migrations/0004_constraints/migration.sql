-- =============================================================================
-- Migration 0004_constraints — Contraintes d'intégrité monétaire & métier
-- Source : docs/invariants.md (INV-01, INV-02, INV-04, INV-10, INV-11, INV-14)
--          + commentaires du schéma Prisma qui référencent explicitement cette
--          migration (« CHECK balance >= 0 posés par la migration 0004 »).
--
-- Philosophie : la base est la dernière ligne de défense. Même si un bug
-- applicatif contournait wallet.repository.ts, ces contraintes empêchent :
--   - un solde négatif (INV-02),
--   - une mise nulle ou négative (INV-11),
--   - un houseCut hors bornes (INV-08/INV-13),
--   - un settlement incohérent totalPool != houseCut + netPool (INV-05),
--   - un payout supérieur à la mise × pool (INV-09),
--   - un double settlement (INV-14, en plus du UNIQUE Prisma).
--
-- Toutes les contraintes sont NOMMÉES pour être auditablement identifiables
-- et annulables individuellement dans le runbook (docs/runbook.md).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- INV-02 : Soldes de wallets jamais négatifs (colonnes entières, INV-01)
-- -----------------------------------------------------------------------------

ALTER TABLE "wallets"
  ADD CONSTRAINT "chk_wallets_credits_non_negative"
  CHECK ("credits" >= 0);

ALTER TABLE "wallets"
  ADD CONSTRAINT "chk_wallets_gems_non_negative"
  CHECK ("gems" >= 0);

ALTER TABLE "wallets"
  ADD CONSTRAINT "chk_wallets_tokens_non_negative"
  CHECK ("tokens" >= 0);

ALTER TABLE "wallets"
  ADD CONSTRAINT "chk_wallets_hardcents_non_negative"
  CHECK ("hardCents" >= 0);

-- Le wallet HOUSE/SYSTEM est le seul à ne pas avoir de playerId ; un wallet
-- PLAYER doit obligatoirement pointer vers un joueur (cohérence ownerType).
ALTER TABLE "wallets"
  ADD CONSTRAINT "chk_wallets_owner_player_consistency"
  CHECK (
    ("ownerType" = 'PLAYER' AND "playerId" IS NOT NULL)
    OR (("ownerType" = 'HOUSE' OR "ownerType" = 'SYSTEM') AND "playerId" IS NULL)
  );

-- -----------------------------------------------------------------------------
-- INV-02 / INV-06 : ledger — solde après mouvement jamais négatif
-- amountSigned != 0 : un mouvement nul n'a pas de sens comptable.
-- -----------------------------------------------------------------------------

ALTER TABLE "wallet_transactions"
  ADD CONSTRAINT "chk_wtx_balance_after_non_negative"
  CHECK ("balanceAfter" >= 0);

ALTER TABLE "wallet_transactions"
  ADD CONSTRAINT "chk_wtx_amount_non_zero"
  CHECK ("amountSigned" <> 0);

-- Un BET_PAYOUT / BET_REFUND / REWARD / DEPOSIT crédite (>0) ; un
-- BET_ESCROW / PURCHASE / HOUSE_FEE débite (<0). ADMIN_ADJUSTMENT et REVERSAL
-- peuvent aller dans les deux sens → non contraints.
ALTER TABLE "wallet_transactions"
  ADD CONSTRAINT "chk_wtx_sign_matches_type"
  CHECK (
    "type" IN ('ADMIN_ADJUSTMENT', 'REVERSAL', 'HOUSE_REVERSAL')
    OR ("type" IN ('DEPOSIT', 'REWARD', 'BET_PAYOUT', 'BET_REFUND') AND "amountSigned" > 0)
    OR ("type" IN ('PURCHASE', 'BET_ESCROW', 'HOUSE_FEE') AND "amountSigned" < 0)
  );

-- Une contre-écriture doit désigner la transaction qu'elle annule ;
-- une transaction normale ne doit pas porter reversalOfId.
ALTER TABLE "wallet_transactions"
  ADD CONSTRAINT "chk_wtx_reversal_consistency"
  CHECK (
    ("type" IN ('REVERSAL', 'HOUSE_REVERSAL') AND "reversalOfId" IS NOT NULL)
    OR ("type" NOT IN ('REVERSAL', 'HOUSE_REVERSAL') AND "reversalOfId" IS NULL)
  );

-- -----------------------------------------------------------------------------
-- INV-11 : Bornes de mise (pari mutuel 1v1, docs/betting.md §bornes)
-- stake > 0 partout (garde DB plancher) ; les bornes fines SOFT/HARD/tournoi
-- (10..10000 cr, 100..10000 cts, 50..50000 cr) sont appliquées par
-- bet-limits.service.ts car elles dépendent de market.currency et varient
-- selon juridiction — mais le plancher strict est ici.
-- -----------------------------------------------------------------------------

ALTER TABLE "bet_markets"
  ADD CONSTRAINT "chk_bmk_stake_positive"
  CHECK ("stake" > 0);

ALTER TABLE "bet_markets"
  ADD CONSTRAINT "chk_bmk_total_pool_non_negative"
  CHECK ("totalPool" >= 0);

-- houseEdgeBps : contractuel entre 0 et 2000 bps (0 %–20 %) ; valeur prod 500.
ALTER TABLE "bet_markets"
  ADD CONSTRAINT "chk_bmk_house_edge_bps_range"
  CHECK ("houseEdgeBps" >= 0 AND "houseEdgeBps" <= 2000);

-- houseCutEstimate = floor(totalPool * bps / 10000) → bornes arithmétiques.
ALTER TABLE "bet_markets"
  ADD CONSTRAINT "chk_bmk_house_cut_bounds"
  CHECK ("houseCutEstimate" >= 0 AND "houseCutEstimate" <= "totalPool");

ALTER TABLE "bets"
  ADD CONSTRAINT "chk_bet_stake_positive"
  CHECK ("stake" > 0);

ALTER TABLE "bets"
  ADD CONSTRAINT "chk_bet_side_range"
  CHECK ("side" >= 0 AND "side" <= 7); -- 1v1 = {0,1} ; tournoi N outcomes ≤ 8

-- INV-09 : payout plancher ∈ [0, stake] et jamais au-delà du netPool ;
-- borne large vérifiable en DB : payout <= stake * 100 (protection typon).
ALTER TABLE "bets"
  ADD CONSTRAINT "chk_bet_payout_non_negative"
  CHECK ("payout" >= 0);

ALTER TABLE "bets"
  ADD CONSTRAINT "chk_bet_payout_sane_ceiling"
  CHECK ("payout" <= "stake" * 100);

-- -----------------------------------------------------------------------------
-- INV-05 / INV-08 / INV-09 / INV-14 : cohérence du BetSettlement
--   totalPool = houseCut + netPool                     (conservation INV-05)
--   sum(payouts) + residual = netPool                  → contrôlé app + test e2e
--   residual >= 0 (résidu de floor crédité House)      (INV-09)
--   houseCut >= 0 ; PUSH → houseCut = 0 géré par le service (INV-16)
-- Double settlement : UNIQUE(marketId) déjà posé par 0001 via Prisma ;
-- on renforce idempotencyKey UNIQUE (INV-04) s'il manquait.
-- -----------------------------------------------------------------------------

ALTER TABLE "bet_settlements"
  ADD CONSTRAINT "chk_bst_pool_decomposition"
  CHECK ("totalPool" = "houseCut" + "netPool");

ALTER TABLE "bet_settlements"
  ADD CONSTRAINT "chk_bst_house_cut_non_negative"
  CHECK ("houseCut" >= 0);

ALTER TABLE "bet_settlements"
  ADD CONSTRAINT "chk_bst_net_pool_non_negative"
  CHECK ("netPool" >= 0);

ALTER TABLE "bet_settlements"
  ADD CONSTRAINT "chk_bst_residual_non_negative"
  CHECK ("residual" >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_bst_market" ON "bet_settlements" ("marketId");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_bst_idempotency" ON "bet_settlements" ("idempotencyKey");

-- -----------------------------------------------------------------------------
-- Paiements HARD : bornes cahier des charges 1 000 – 100 000 centimes (1€–100€)
-- et montant strictement positif.
-- -----------------------------------------------------------------------------

ALTER TABLE "payments"
  ADD CONSTRAINT "chk_pay_amount_range"
  CHECK ("amountCents" >= 1000 AND "amountCents" <= 100000);

-- -----------------------------------------------------------------------------
-- EventTicket : paiement soit 500 crédits, soit 10 gemmes (CdC §événements).
-- -----------------------------------------------------------------------------

ALTER TABLE "event_tickets"
  ADD CONSTRAINT "chk_evt_ticket_price"
  CHECK (
    ("paidWith" = 'CREDITS' AND "amountPaid" = 500)
    OR ("paidWith" = 'GEMS' AND "amountPaid" = 10)
  );

-- -----------------------------------------------------------------------------
-- Player : champs entiers bornés (réputation 0-100, division/PL cap min 0)
-- INV-31 : plPoints >= 0 ; INV-21 : reputation ∈ [0,100]
-- -----------------------------------------------------------------------------

ALTER TABLE "players"
  ADD CONSTRAINT "chk_plr_pl_non_negative"
  CHECK ("plPoints" >= 0);

ALTER TABLE "players"
  ADD CONSTRAINT "chk_plr_reputation_range"
  CHECK ("reputation" >= 0 AND "reputation" <= 100);

ALTER TABLE "players"
  ADD CONSTRAINT "chk_plr_level_positive"
  CHECK ("level" >= 1);

ALTER TABLE "players"
  ADD CONSTRAINT "chk_plr_xp_non_negative"
  CHECK ("xp" >= 0);

-- -----------------------------------------------------------------------------
-- MatchPlayer : positions 1..8, temps entiers positifs, récompenses >= 0
-- -----------------------------------------------------------------------------

ALTER TABLE "match_players"
  ADD CONSTRAINT "chk_mp_position_range"
  CHECK ("position" IS NULL OR ("position" >= 1 AND "position" <= 8));

ALTER TABLE "match_players"
  ADD CONSTRAINT "chk_mp_finish_ms_positive"
  CHECK ("finishMs" IS NULL OR "finishMs" > 0);

ALTER TABLE "match_players"
  ADD CONSTRAINT "chk_mp_rewards_non_negative"
  CHECK (
    "rewardsCredits" >= 0 AND "rewardsGems" >= 0
    AND "rewardsXp" >= 0 AND "rewardsTokens" >= 0
  );

-- -----------------------------------------------------------------------------
-- GameServer : capacité raisonnable (1..64 joueurs/processus)
-- -----------------------------------------------------------------------------

ALTER TABLE "game_servers"
  ADD CONSTRAINT "chk_gs_capacity_range"
  CHECK ("capacity" >= 1 AND "capacity" <= 64);

ALTER TABLE "game_servers"
  ADD CONSTRAINT "chk_gs_active_matches_non_negative"
  CHECK ("activeMatches" >= 0);

-- -----------------------------------------------------------------------------
-- JurisdictionConfig : plafonds HARD cohérents (daily <= monthly <= yearly)
-- -----------------------------------------------------------------------------

ALTER TABLE "jurisdiction_configs"
  ADD CONSTRAINT "chk_jc_limits_order"
  CHECK (
    ("dailyHardLimitCents" IS NULL AND "monthlyHardLimitCents" IS NULL AND "yearlyHardLimitCents" IS NULL)
    OR (
      "dailyHardLimitCents" IS NOT NULL
      AND "monthlyHardLimitCents" IS NOT NULL
      AND "yearlyHardLimitCents" IS NOT NULL
      AND "dailyHardLimitCents" > 0
      AND "dailyHardLimitCents" <= "monthlyHardLimitCents"
      AND "monthlyHardLimitCents" <= "yearlyHardLimitCents"
    )
  );

-- -----------------------------------------------------------------------------
-- HouseBalanceSnapshot : montants >= 0
-- -----------------------------------------------------------------------------

ALTER TABLE "house_balance_snapshots"
  ADD CONSTRAINT "chk_hbs_non_negative"
  CHECK ("balanceCents" >= 0 AND "escrowOutstanding" >= 0 AND "cumulativeFees" >= 0);
