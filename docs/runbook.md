# Race Nations — Runbook d'opérations (`docs/runbook.md`)

> Destinataires : astreinte SRE + backend on-call. Chaque procédure cite l'invariant concerné
> (`docs/invariants.md`). En cas de doute financier : **ARRÊTER LE FLUX, pas la réconciliation**
> (kill-switch §5) — aucune écriture manuelle en base n'est admise sur les tables monétaires
> (INV-03/INV-06 : le ledger est la seule vérité, une correction = `REVERSAL` via API admin).

---

## 1. Service & endpoints

| Sonde | URL | Sémantique |
|---|---|---|
| Liveness | `GET /health/live` | Process vivant (pas de dépendance) |
| Readiness | `GET /health/ready` | DB ping + Redis ping + fleet ≥ 1 serveur REGISTERED |
| Métriques | `GET /metrics` (Prometheus, réseau interne) | http_request_duration, wallet_ops_total, bet_settlement_total{outcome}, lock_wait_ms |
| Logs | JSON structurés stdout (requestId corrélé, observability.md §1) | PII masquées, jamais de token/secret (observability.md §2) |

Déploiement : `scripts/dev-up.sh` (local), images Docker backend/admin-panel/game-server, migrations `scripts/migrate.sh` (**toujours avant** le rollout du code qui les consomme — schéma additif uniquement, docs/api-versioning.md §4).

## 2. Alertes critiques (page 24/7)

| Alerte | Signal | Gravité |
|---|---|---|
| `MoneyConservationMismatch` | job réconciliation : `sum(debits) != sum(credits) + houseCut` sur fenêtre (INV-05) | **P0** |
| `DoubleSettlementAttempt` | P29 violation UNIQUE(marketId) > 0 en 5 min (INV-14) | **P0** |
| `NegativeBalanceAttempt` | CHECK balance≥0 violé côté DB (INV-02) | **P0** |
| `WebhookSignatureFailSpike` | > 10 % de 401 sur /webhooks/* en 5 min (INV-26) | P1 |
| `DisputeAging` | litige ouvert > 60 h (approche gel 72 h INV-19) | P1 |
| `SettlementOutboxLag` | marchés FINISHED_VALIDATED non réglés > 5 min (INV-24) | P1 |
| `WalletLockContention` | avg SELECT FOR UPDATE wait > 250 ms (INV-03) | P1 |
| `FleetCapacityLow` | serveurs REGISTERED < seuil plancher de charge | P1 |

## 3. Playbooks courants

### 3.1 Marché bloqué en SETTLING (crash entre escrow et payouts)
Symptôme : `BetMarket.status = SETTLING` depuis > 5 min sans ligne `BetSettlement`.
1. Vérifier l'absence de settlement : `SELECT * FROM bet_settlements WHERE market_id = …` (lecture seule).
2. Relancer idempotent : `POST /api/v1/betting/admin/markets/:id/settle` (ADMIN, header `Idempotency-Key: settle:<marketId>`).
   Le service est idempotent (INV-04/INV-14) : rejouer ne crée JAMAIS un second mouvement ; si déjà réglé → 409 `BET_ALREADY_SETTLED` sans effet de bord.
3. Si échec répété : journaliser l'incident, passer le marché en `DISPUTED` (gel payouts, INV-19) et escalader §4.

### 3.2 Webhook paiement perdu/dupliqué
- Doublon provider : ignoré par `UNIQUE(idempotencyKey)` sur WebhookEvent (INV-04) — attendu, non incident.
- Signature invalide persistante : vérifier rotation du secret provider ; **ne jamais** désactiver la vérification (INV-26). Event rejeté = `signatureValid=false`, alerte P1.
- Dépôt crédité manquant : retrouver le `Payment` par `providerRef` ; si `SUCCEEDED` sans ledger `DEPOSIT` → rejouer le webhook depuis le dashboard provider (même event.id → même clé → replay strict ou crédit unique selon état).

### 3.3 Résultat de course suspect (anti-triche)
1. Ne PAS valider : laisser le match en `FINISHED` (non validé) → les paris liés ne sont pas réglés (INV-24 interdit tout settlement sur match non finalisé validé).
2. `result-validator.service.ts` expose le rapport : checkpoints hors séquence, vitesse > plafond catégorie, finishMs < temps théorique minimum (INV-25).
3. Validation humaine admin → soit `FINISHED_VALIDATED` (settlement normal), soit `INVALIDATED` (paris → `DISPUTED`, remboursement après résolution, INV-18/19).

### 3.4 Litige (dispute) à résoudre ≤ 72 h (INV-19)
File de travail : `GET /api/v1/admin/disputes?status=DISPUTED` (tri par `disputedAt` ascendant).
Issues possibles et effets monétaires (tous via API admin, jamais SQL) :
- Fraude confirmée gagnant → settle avec `cheatReversal=true` : perdant remboursé intégralement, houseCut reversé, sanction créée (INV-18).
- Égalité réelle → `winningBetIds=[]` → push : remboursements intégraux, houseCut=0 (INV-16).
- Match invalidé → marché `CANCELLED` : tous les bets `REFUNDED` via ledger `BET_REFUND` (INV-15 retour escrow).
Au-delà de 72 h : escalade responsable betting + P1 `DisputeAging` tenue jusqu'à résolution.

## 4. Escalade

| Niveau | Qui | Délai |
|---|---|---|
| On-call backend/SRE | astreinte primaire | 15 min (P0), 1 h (P1) |
| Lead backend + Compliance (si HARD) | page secondaire | 30 min (P0) |
| Legal/DPO (fuite KYC, régulateur) | hors horaire compris | immédiat si données personnelles exposées |

Incident P0 financier : ouvrir une fiche `INC-<date>-<slug>`, figer le périmètre (kill-switch §5), **ne rien corriger en base** avant réconciliation documentée.

## 5. Kill-switch & déclanchement

Env lu par `backend/src/config/betting.config.ts` (rechargement chaud, sans redeploy) :

| Variable | Effet | Usage |
|---|---|---|
| `BETTING_HARD_ENABLED=false` | Refuse toute création/acceptation HARD (403 JURISDICTION_BLOCKED générique) ; les marchés HARD existants passent en `DISPUTED` (gel, pas de perte) | Fraude de masse, faille settlement, exigence régulateur |
| `BETTING_SOFT_ENABLED=false` | Idem SOFT | Abus, exploit economics |
| `MATCHMAKING_PAUSED=true` | Worker matchmaking stoppe l'appariement (files conservées) | Fleet saturée, bug settlement cascade |
| `PAYMENTS_DEPOSITS_PAUSED=true` | Checkout HARD refusé ; webhooks toujours traités (pas de dépôt perdu) | Provider compromis |

Procédure incident financier type :
1. `BETTING_HARD_ENABLED=false` (+SOFT si l'invariant touché est commun) — < 1 min.
2. Geler les marchés en vol : batch admin `DISPUTED` (aucun payout partiel, INV-19).
3. Réconcilier : job `house-wallet` snapshot vs ledger ; écarts listés marché par marché.
4. Corriger par `POST /api/v1/house/reverse` (contre-écriture liée, INV-06) + settlement manuel idempotent des marchés fautifs.
5. Post-mortem obligatoire (INV violé, cause racine, garde-fou ajouté en test e2e `invariants.e2e-spec.ts`).

## 6. Opérations planifiées

- **Snapshot House quotidien** (00:05 UTC) : `HouseBalanceSnapshot` — échec = P1 (réconciliation impossible).
- **Rotation secrets** game-servers (trimestrielle) : double-signature pendant fenêtre de overlap (verifiers acceptent secret N et N+1).
- **Réindex leaderboards** : worker dédié, off-peak.
- **VACUUM/analyse** ledger : mensuel, read-replica d'abord (append-only, pas de verrou applicatif).
- **DR** : RPO 5 min (WAL streaming), RTO 30 min ; restauration testée trimestriellement incluant rejeu des webhooks providers (idempotence INV-04 = sécurité du rejeu).

## 7. Contacts & références

- Contrat d'API : `docs/api.md` · Modèle paris : `docs/betting.md` · Légal : `docs/betting-legal.md` · Observabilité : `docs/observability.md` · Invariants : `docs/invariants.md` (la table de la vérité en cas de conflit doc/code).
