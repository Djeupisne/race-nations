-- =============================================================================
-- Migration 0002_audit_immutable — Journal d'audit admin APPEND-ONLY
-- Source : backend/prisma/schema.prisma (model AdminAuditLog -> admin_audit_logs),
--          docs/invariants.md INV-06 (journal immuable), docs/observability.md §8
--          (export mensuel signé), docs/moderation.md (chaîne de preuve).
--
-- Objectif :
--   1. Créer la table admin_audit_logs (colonnes strictement conformes au
--      schéma Prisma : id, actorId?, action, entityType, entityId, details,
--      ipAddress?, createdAt) + ses index ;
--   2. Rendre la table IMMUTABLE (append-only) via un trigger BEFORE
--      UPDATE OR DELETE qui lève une exception — aucune modification ni
--      suppression n'est possible, y compris par le propriétaire ; seul
--      l'INSERT est autorisé (et TRUNCATE est bloqué au niveau table).
--
-- Le modèle de correction reste celui du ledger (INV-06) : une erreur
-- d'enregistrement se compense par un NOUVEL enregistrement correctif qui
-- référence le précédent dans `details` (ex. { "corrects": "<id>" }).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table admin_audit_logs (miroir exact du model Prisma AdminAuditLog)
-- -----------------------------------------------------------------------------

CREATE TABLE "admin_audit_logs" (
  "id"         TEXT           NOT NULL DEFAULT uuid_generate_v4(),
  "actorId"    TEXT, -- userId (user système si settlement automatique — INV-28)
  "action"     TEXT           NOT NULL, -- ex. 'BET_SETTLEMENT_MANUAL', 'SANCTION_ISSUED'
  "entityType" TEXT           NOT NULL, -- ex. 'BetMarket', 'Sanction', 'Wallet'
  "entityId"   TEXT           NOT NULL,
  "details"    JSONB          NOT NULL, -- snapshot des champs pertinents (entiers uniquement)
  "ipAddress"  TEXT,
  "createdAt"  TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- Index de parcours (dashboard /admin/audit — api.md §9, export mensuel)
CREATE INDEX "admin_audit_logs_createdAt_idx" ON "admin_audit_logs" ("createdAt");
CREATE INDEX "admin_audit_logs_entityType_entityId_idx" ON "admin_audit_logs" ("entityType", "entityId");
CREATE INDEX "admin_audit_logs_actorId_createdAt_idx" ON "admin_audit_logs" ("actorId", "createdAt");

-- Clé étrangère vers users (relation Prisma actor -> User, onDelete SetNull :
-- la trace subsiste même si le compte admin est supprimé — obligation légale).
ALTER TABLE "admin_audit_logs"
  ADD CONSTRAINT "admin_audit_logs_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- 2. Immuabilité append-only (INV-06)
-- -----------------------------------------------------------------------------

-- Fonction générique « append-only » : bloque UPDATE et DELETE sur toute
-- table marquée immuable. CREATE OR REPLACE pour rester idempotente ; la
-- migration 0006_house_wallet peut la réutiliser (triggers bet_settlements /
-- house_balance_snapshots) sans la redéfinir.
CREATE OR REPLACE FUNCTION "fn_append_only_block_mutation"()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'append-only table % does not allow % (INV-06)', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

-- Trigger BEFORE : refus avant toute écriture modifiante.
DROP TRIGGER IF EXISTS "trg_admin_audit_logs_append_only" ON "admin_audit_logs";
CREATE TRIGGER "trg_admin_audit_logs_append_only"
  BEFORE UPDATE OR DELETE ON "admin_audit_logs"
  FOR EACH ROW EXECUTE FUNCTION "fn_append_only_block_mutation"();

-- Verrou collectif : bloque les UPDATE/DELETE de masse (commande unique,
-- non couverts par le trigger FOR EACH ROW en cas de plan optimisé).
DROP TRIGGER IF EXISTS "trg_admin_audit_logs_append_only_stmt" ON "admin_audit_logs";
CREATE TRIGGER "trg_admin_audit_logs_append_only_stmt"
  BEFORE UPDATE OR DELETE ON "admin_audit_logs"
  FOR EACH STATEMENT EXECUTE FUNCTION "fn_append_only_block_mutation"();

-- TRUNCATE court hors des triggers ligne/statement classiques : on retire
-- explicitement le droit de truncater la table (les INSERT restent permis).
REVOKE TRUNCATE ON "admin_audit_logs" FROM PUBLIC;

COMMENT ON TABLE "admin_audit_logs" IS
  'Journal d''audit admin append-only (INV-06) — UPDATE/DELETE bloqués par trigger ; correction par nouvel enregistrement.';
COMMENT ON FUNCTION "fn_append_only_block_mutation"() IS
  'Trigger-guard INV-06 : lève une exception sur toute tentative UPDATE/DELETE d''une table immuable.';
