# Race Nations — Observabilité

> Objectif : détecter une violation d'invariant (`docs/invariants.md`) **avant** qu'elle ne devienne un incident financier ou légal.
> Stack : Prometheus (métriques) + Loki (logs structurés JSON) + Tempo (traces OpenTelemetry) + Alertmanager.
> Corrélation : `X-Request-Id` propagé de bout en bout (HTTP → services → jobs → webhooks).

---

## 1. Principes

1. **Métriques avant les logs, logs avant les traces.** Chaque alerte P0/P1 est déclenchée par une métrique ; les logs portent le `requestId` pour le drill-down.
2. **Toute opération monétaire est traçable.** Un settlement de pari doit être reconstruisable à partir des seules métriques + ledger (`WalletTransaction`, house ledger) — cf. INV-05, INV-06, INV-13.
3. **Cardinality discipline.** Jamais d'ID joueur/marché en label de métrique ; uniquement dans les logs et traces. Labels autorisés : `route`, `code`, `currency` (SOFT|HARD), `jurisdiction` (code pays), `provider`, `outcome`.
4. **Horloge unique.** Tous les timestamps proviennent de `Clock.now()` (INV-29) en ISO-8601 UTC — la cohérence des fenêtres (24 h, 72 h, 30 s) dépend de cette horloge.
5. **Health = liveness + readiness distincts** (`GET /health`), jamais confondus avec les checks métier.

## 2. Logs structurés

Format JSON unique (pino), champs communs obligatoires :

```json
{
  "level": "info",
  "time": "2026-10-21T12:00:00.000Z",
  "service": "backend",
  "env": "prod",
  "requestId": "…",
  "userIdHash": "sha256(userId)[0:12]",
  "msg": "bet.challenge.accepted",
  "marketId": "…", "betId": "…",
  "currency": "HARD", "jurisdiction": "TG",
  "amountCents": 5000
}
```

Règles :
- **Jamais** de PII en clair (email, token, document d'identité) : hachage ou omission (RGPD, `docs/legal/gdpr.md`).
- Événements financiers à logger **obligatoirement** : `wallet.debit`, `wallet.credit`, `bet.escrow`, `bet.settled`, `bet.refunded`, `house.fee.credited`, `house.fee.reversed`, `payment.succeeded`, `webhook.signature.invalid` (niveau error + alerte, INV-26), `state.transition.denied` (INV-22), `invariant.violation` (P0).
- Log `invariant.violation` attendu sur : somme débits ≠ crédits + houseCut (INV-05), bet SETTLED sans ligne d'escrow (INV-15), double settlement refusé (INV-14), payout > netPool (INV-09).

## 3. Métriques (Prometheus)

### 3.1 HTTP / API
| Nom | Type | Labels | Notes |
|---|---|---|---|
| `http_requests_total` | counter | `route`, `method`, `status`, `code` | `code` = code métier stable (ex. `BET_STAKE_OUT_OF_RANGE`) |
| `http_request_duration_seconds` | histogram | `route`, `method` | Buckets 0.01…5 s |
| `rate_limited_total` | counter | `scope` | Cf. table §12 api.md |
| `idempotency_conflict_total` | counter | `operation` | Rejeux client (INV-04) — hausse = bug client |

### 3.2 Wallet & paiements
| Nom | Type | Labels | Signification |
|---|---|---|---|
| `wallet_movements_total` | counter | `type`, `currency`, `outcome` | type = DEPOSIT/BET_ESCROW/BET_PAYOUT/REVERSAL/HOUSE_FEE… |
| `wallet_insufficient_funds_total` | counter | `currency` | INV-02 refusés |
| `payments_by_provider_total` | counter | `provider`, `status` | STRIPE / FLUTTERWAVE |
| `webhook_processing_lag_seconds` | histogram | `provider` | réception → acknowledgment job |
| `webhook_signature_invalid_total` | counter | `provider` | Doit rester ≈ 0 ; > 0 → alerte WARN |

### 3.3 Betting (P0)
| Nom | Type | Labels | Signification |
|---|---|---|---|
| `bets_created_total` | counter | `currency`, `jurisdiction` | Marchés créés |
| `bets_challenged_total` / `bets_rejected_total` | counter | `code` | Rejets typés : mismatch, out-of-range, daily-limit, jurisdiction |
| `bet_pool_cents` | gauge | `currency` | Escrow total en cours (SOMME, pas d'ID) |
| `bets_settled_total` | counter | `currency`, `outcome` | WON/LOST/PUSH/REFUNDED/VOIDED |
| `bet_settlement_lag_seconds` | histogram | — | Match FINISHED_VALIDATED → bets SETTLED (INV-24) |
| `bet_disputes_open` | gauge | — | Litiges ouverts ; tout dépassement 72 h → P1 (INV-19) |
| `house_wallet_balance_cents` | gauge | — | Solde House (INV-13) ; monotone hors reversals |
| `invariant_violation_total` | counter | `inv` | ex. `INV-05`, `INV-14` — **tout compteur > 0 = P0** |
| `jurisdiction_blocked_total` | counter | `countryCode`, `currency` | Suivi gating (INV-20) |

### 3.4 Matchmaking & flotte
| Nom | Type | Signification |
|---|---|---|
| `matchmaking_queue_depth{mode}` | gauge | Profondeur file par mode |
| `matchmaking_wait_seconds` | histogram | Ticket QUEUED → MATCHED (SLA : classée ≤ 120 s) |
| `tickets_expired_total` / `tickets_cancelled_total` | counter | Santé du pipeline |
| `gameservers_by_state{state}` | gauge | REGISTERED/RESERVED/DRAINING/OFFLINE |
| `results_invalid_total` | counter | Rejets anti-triche (INV-25) — hausse brutale = triche organisée ou bug validation |
| `reconnect_window_exceeded_total` | counter | Déconnexions > 30 s traitées comme abandon (INV-17) |

### 3.5 Job / infra
`transactional_decorator_duration_seconds`, `prisma_pool_connections{active,idle}`, `redis_commands_duration_seconds`, `outbox_pending_jobs`, `outbox_dead_jobs_total` (> 0 → P1), `process_start_time_seconds` (détection redémarrages).

## 4. Traces (OpenTelemetry)

- Instrumentation NestJS (`@nestjs/otel`) + Prisma (middleware log) + ioredis.
- Spans clés : `POST /betting/markets/:id/challenge` (enfants : `wallet.debit`, `bet.create`, `escrow.move`, `match.reserve`) — le span parent porte l'attribut `conservation.check = debits==credits+houseCut` pour audit INV-05/INV-30.
- Sampling : 100 % des spans monétaires (wallet/betting/payments/house), 10 % ailleurs, 100 % si `status=error`.
- Trace ID corrélé au `requestId` injecté dans tous les logs.

## 5. Dashboards (Grafana)

| Dashboard | Panneaux principaux |
|---|---|
| **Money (P0)** | Conservation de valeur (somme débits − crédits − houseCut ≈ 0), House balance, escrow total, payouts/h, lag settlement |
| **Betting Funnel** | marchés créés → challengés → locked → settled ; rejets par code ; disputes ouvertes vs deadline 72 h |
| **Payments** | checkout/h par provider, webhook lag, signature invalides, reconciliations manquantes |
| **Matchmaking & Fleet** | queue depth, wait p50/p95, servers par état, results invalides |
| **API Health** | RPS, p95 latency par route, 4xx/5xx par code métier, rate limits |

## 6. Alertes

| Alerte | Condition | Severity | Runbook |
|---|---|---|---|
| InvariantViolation | `increase(invariant_violation_total[5m]) > 0` | **P0** | RB-01 (gel paris, audit ledger) |
| HouseBalanceMismatch | écart conservation ≠ 0 sur 10 min | **P0** | RB-01 |
| SettlementLagHigh | p95 `bet_settlement_lag_seconds` > 60 s | P1 | RB-02 |
| DisputeOverdue | litige ouvert > 72 h | P1 | RB-03 |
| WebhookSignatureInvalid | > 3 en 5 min | P1 | RB-04 |
| OutboxDeadJobs | `outbox_dead_jobs_total` croît | P1 | RB-02 |
| InsufficientFundsSpike | +200 % vs baseline 1 h | P2 | — |
| ResultsInvalidSpike | +300 % vs baseline | P2 | Anti-cheat review |
| ApiErrorRate | 5xx > 1 % 5 min | P1 | RB-05 |
| QueueWaitHigh | p95 matchmaking classée > 120 s 10 min | P2 | Scale fleet |

Les références RB-xx pointent vers `docs/runbook.md` (Phase 12).

## 7. SLO

| Service | SLO | Fenêtre |
|---|---|---|
| API disponibilité | 99.9 % | 30 j |
| Latence endpoints lecture | p95 < 300 ms | 30 j |
| Latence mutations monétaires | p95 < 800 ms | 30 j |
| Settlement paris (INV-24) | p95 < 30 s, 0 perte | 30 j |
| Webhooks traités | 99.99 % sous 60 s | 30 j |
| Violations d'invariant financier | 0 | continue |

## 8. Audit & rétention

- Logs financiers : rétention **10 ans** (exigence licences LONATO/NLRC — cf. `docs/betting-legal.md`), stockage froid après 90 j.
- Journal d'audit admin (`/admin/audit`) : append-only, export mensuel signé.
- Snapshots métriques House Wallet quotidiens à 00:00 UTC pour réconciliation comptable.
