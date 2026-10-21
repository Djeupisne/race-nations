-- =============================================================================
-- Migration 0006_house_wallet — Compte House unique + snapshots de réconciliation
-- Source : docs/invariants.md (INV-13 : commission exclusivement au House
--          Wallet, compte système unique ownerType=HOUSE ; INV-05 conservation
--          de la valeur), docs/observability.md §8 (réconciliation quotidienne).
--
-- Cette migration est DATA + DDL :
--   1. DDL : contrainte d'unicité partielle garantissant qu'il n'existe AU
--      CUN second wallet HOUSE/SYSTEM (INV-13 « compte système unique ») ;
--      table house_balance_snapshots si absente ; triggers append-only sur les
--      ledger tables complémentaires.
--   2. SEED : création du wallet HOUSE (id déterministe 'house-wallet-00000000'
--      → rejouable idempotemment via ON CONFLICT DO NOTHING).
--   3. VUE de contrôle : solde House vs somme des commissions (INV-13 audit).
--
-- Le wallet HOUSE démarre à 0 dans TOUTES les devises : il ne peut être
-- crédité que par des mouvements BET_PAYOUT résiduels (residual INV-09) ou
-- HOUSE_FEE (commission INV-08/13), jamais par un dépôt direct. Les ajustements
-- admin passent par house-wallet.service.ts (opérations tracées, INV-28).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. DDL — unicité du compte House/SYSTEM (INV-13)
-- wallets.playerId IS NULL ⇔ ownerType ∈ {HOUSE, SYSTEM} (check 0004).
-- On impose : au plus UNE ligne HOUSE et au plus UNE ligne SYSTEM.
-- -----------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS "uq_wallets_single_house"
  ON "wallets" ("ownerType")
  WHERE "ownerType" = 'HOUSE';

CREATE UNIQUE INDEX IF NOT EXISTS "uq_wallets_single_system"
  ON "wallets" ("ownerType")
  WHERE "ownerType" = 'SYSTEM';

-- Table des snapshots quotidiens (si 0001_init ne l'a pas créée — idempotent).
CREATE TABLE IF NOT EXISTS "house_balance_snapshots" (
  "id"                TEXT PRIMARY KEY,
  "day"               DATE NOT NULL UNIQUE,          -- 00:00 UTC
  "balanceCents"      INTEGER NOT NULL,              -- hardCents du wallet HOUSE
  "escrowOutstanding" INTEGER NOT NULL,              -- paris ESCROWED/RUNNING non réglés
  "cumulativeFees"    INTEGER NOT NULL,              -- somme historique HOUSE_FEE+residual
  "takenAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. SEED — wallet HOUSE (id déterministe, rechargeable sans doublon)
-- UPDATE ... FROM-style upsert natif Postgres ; aucun solde initial > 0.
-- -----------------------------------------------------------------------------

INSERT INTO "wallets" (
  "id", "playerId", "ownerType",
  "credits", "gems", "tokens", "hardCents",
  "createdAt", "updatedAt"
)
VALUES (
  'house-wallet-00000000',
  NULL,
  'HOUSE',
  0, 0, 0, 0,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

-- Verrou supplémentaire : le wallet HOUSE ne doit JAMAIS porter de playerId
-- (déjà couvert par chk_wallets_owner_player_consistency en 0004, rappel SQL).

-- -----------------------------------------------------------------------------
-- 3. Append-only renforcé sur bet_settlements (INV-06 appliqué au settlement :
--    une fois insérée, une ligne de règlement est immuable — toute correction
--    passe par HOUSE_REVERSAL dans le ledger, jamais par UPDATE/DELETE).
--    Trigger réutilisé depuis 0002_audit_immutable si présent ; sinon créé ici.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION "fn_append_only_block_mutation"()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'append-only table % does not allow % (INV-06)', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_bst_append_only" ON "bet_settlements";
CREATE TRIGGER "trg_bst_append_only"
  BEFORE UPDATE OR DELETE ON "bet_settlements"
  FOR EACH ROW EXECUTE FUNCTION "fn_append_only_block_mutation"();

DROP TRIGGER IF EXISTS "trg_hbs_append_only" ON "house_balance_snapshots";
CREATE TRIGGER "trg_hbs_append_only"
  BEFORE UPDATE OR DELETE ON "house_balance_snapshots"
  FOR EACH ROW EXECUTE FUNCTION "fn_append_only_block_mutation"();

-- -----------------------------------------------------------------------------
-- 4. VUE d'audit — balance House attendue vs ledger (INV-05 / INV-13)
-- house_expected = Σ crédits House (BET_PAYOUT residual, HOUSE_REVERSAL négatifs)
-- La requête de réconciliation quotidienne (observability.md §8) compare :
--   wallets.hardCents(HOUSE)  vs  vue ci-dessous, par currencyKind.
-- Écart ≠ 0 → alerte P1 « house-balance-drift », runbook §7.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW "v_house_ledger_balance" AS
SELECT
  wt."currencyKind"                                  AS currency,
  COALESCE(SUM(wt."amountSigned"), 0)::BIGINT        AS ledger_sum,
  COUNT(*)::INTEGER                                  AS movement_count
FROM "wallet_transactions" wt
JOIN "wallets" w ON w."id" = wt."walletId"
WHERE w."ownerType" = 'HOUSE'
GROUP BY wt."currencyKind";

-- -----------------------------------------------------------------------------
-- 5. VUE d'exposition — escrows sortants par marché (jauge risque House)
-- Somme des stakes engagés sur des paris ESCROWED/RUNNING dont le marché n'est
-- pas SETTLED/CANCELLED. Utilisée par house-wallet.service.ts et le snapshot.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW "v_escrow_outstanding" AS
SELECT
  bm."currency"                                      AS currency,
  COALESCE(SUM(b."stake"), 0)::BIGINT                AS outstanding_total,
  COUNT(b."id")::INTEGER                             AS open_bets_count
FROM "bets" b
JOIN "bet_markets" bm ON bm."id" = b."marketId"
WHERE b."status" IN ('ESCROWED', 'RUNNING')
  AND bm."status" NOT IN ('SETTLED', 'CANCELLED')
GROUP BY bm."currency";

-- NOTE SOFT : les commissions SOFT (crédits/gemmes/tokens) suivent la même
-- règle INV-13 (uniquement le wallet HOUSE) ; la vue agrège par currencyKind
-- pour permettre la réconciliation séparée SOFT/HARD exigée par INV-07.
