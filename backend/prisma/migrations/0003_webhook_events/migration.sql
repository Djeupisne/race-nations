-- =============================================================================
-- Migration 0003_webhook_events — Table webhook_events (idempotence provider)
-- Source : backend/prisma/schema.prisma (model WebhookEvent -> webhook_events),
--          docs/api.md §6.2 (POST /webhooks/:provider), docs/invariants.md
--          INV-04 (aucune écriture monétaire sans idempotencyKey).
--
-- Objectif :
--   1. Créer la table webhook_events (colonnes strictement conformes au
--      schéma Prisma : id, provider, providerEventId, payload, receivedAt,
--      processedAt?, status) ;
--   2. Contrainte UNIQUE sur provider_event_id : c'est la CLÉ d'IDEMPOTENCE
--      du handler de webhook — un événement provider rejoué (retry Stripe/
--      FlutterWave, double notification store) est inséré une seule fois ;
--      l'insertion en ON CONFLICT DO NOTHING + relecture garantit qu'aucun
--      crédit DEPOSIT n'est appliqué deux fois (INV-04, anti double-crédit).
--   3. Index de traitement (queue worker) et FK optionnelle vers payments.
--
-- NB : le modèle Prisma ne déclare pas de relation payment -> webhook_events
-- (le champ paymentId n'existe pas dans le schéma) ; aucune FK n'est donc
-- ajoutée ici, pour rester strictement aligné avec schema.prisma.
-- =============================================================================

CREATE TABLE "webhook_events" (
  "id"              TEXT           NOT NULL DEFAULT uuid_generate_v4(),
  "provider"        "PaymentProvider" NOT NULL, -- miroir enum du schéma (STRIPE | FLUTTERWAVE | GOOGLE_PLAY | APPLE_IAP | HUAWEI_IAP)
  "providerEventId" TEXT           NOT NULL, -- event id renvoyé par le provider
  "payload"         JSONB          NOT NULL, -- corps brut, conservé pour audit légal
  "receivedAt"      TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt"     TIMESTAMPTZ(3), -- null = en attente de traitement
  "status"          TEXT           NOT NULL DEFAULT 'RECEIVED', -- RECEIVED | PROCESSED | IGNORED | FAILED

  CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- IDEMPOTENCE (INV-04) : garantie base de données « 1 événement provider =
-- 1 ligne », même sous concurrence (deux retries simultanés du provider).
CREATE UNIQUE INDEX "webhook_events_providerEventId_key" ON "webhook_events" ("providerEventId");

-- File de traitement : événements reçus non encore traités / statuts.
CREATE INDEX "webhook_events_status_receivedAt_idx" ON "webhook_events" ("status", "receivedAt");

COMMENT ON INDEX "webhook_events_providerEventId_key" IS
  'Clé d''idempotence des webhooks de paiement (INV-04) : rejou d''un même providerEventId = no-op.';
