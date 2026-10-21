# Race Nations — API Contract (REST + WebSocket)

> Version de base : `/api/v1` (voir `docs/api-versioning.md`). Source de vérité des DTOs : `shared/api-contracts/src/*` (schémas Zod partagés client/serveur).
> Règles transverses (rappel, garanties par les invariants `docs/invariants.md`) :
> - **INV-27** : tout body/query/param est validé par Zod (`ZodValidationPipe`) avant le service.
> - **INV-26** : les webhooks vérifient un HMAC-SHA256 comparé en temps constant (`timingSafeEqual`).
> - **INV-28** : `OwnershipGuard` sur toute ressource joueur ; rôle `ADMIN` pour settlement manuel, sanctions, House Wallet.
> - **INV-04** : toute mutation monétaire exige un header `Idempotency-Key` (UNIQUE en DB).
> - **INV-01** : l'argent voyage en **entiers** uniquement (`credits`, `gems`, `tokens` entiers ; HARD money en `amountCents`). Jamais de float dans les JSON monétaires.
> - **INV-29** : tous les timestamps sont ISO-8601 UTC, produits par `Clock.now()` côté serveur.

---

## 1. Conventions

### 1.1 En-têtes communs
| Header | Description |
|---|---|
| `Authorization: Bearer <accessToken>` | JWT (access 15 min, refresh rotatif 30 j) |
| `X-Request-Id` | UUID de corrélation (généré si absent) |
| `Idempotency-Key` | **Requis** sur toutes les mutations monétaires (POST wallet/payments/bets). Clé UNIQUE en DB ; rejouer renvoie la réponse originale (INV-04). |
| `Content-Type: application/json` | UTF-8 |

### 1.2 Format d'erreur (RFC-7807 simplifié, mapping `AppError`)
```json
{
  "statusCode": 422,
  "code": "BET_STAKE_OUT_OF_RANGE",
  "message": "Stake must be between 10 and 10000 credits.",
  "details": { "min": 10, "max": 10000, "received": 5 },
  "requestId": "…"
}
```
Codes métier stables (extraits de `backend/src/common/errors/`) :

| Code HTTP | `code` | Origine invariant |
|---|---|---|
| 401 | `AUTH_UNAUTHENTICATED`, `TOKEN_EXPIRED`, `REFRESH_REUSED` | — |
| 403 | `JURISDICTION_BLOCKED`, `AGE_VERIFICATION_REQUIRED`, `REPUTATION_TOO_LOW`, `FORBIDDEN_ADMIN` | INV-20, INV-21, INV-28 |
| 409 | `INSUFFICIENT_FUNDS`, `BET_ALREADY_SETTLED`, `IDEMPOTENCY_CONFLICT`, `INVALID_STATE_TRANSITION` | INV-02, INV-14, INV-04, INV-22 |
| 422 | `VALIDATION_FAILED`, `BET_STAKE_MISMATCH`, `BET_STAKE_OUT_OF_RANGE`, `BET_DAILY_LIMIT_EXCEEDED` | INV-10, INV-11, INV-12, INV-27 |
| 429 | `RATE_LIMITED` | — |
| 500/503 | `INTERNAL`, `SERVER_UNAVAILABLE` | — |

### 1.3 Pagination
`?limit=20&cursor=<opaque>` → `{ "items": [...], "nextCursor": "…" | null }`. Max `limit=100`.

---

## 2. Auth — `/api/v1/auth`
| Méthode | Route | Protection | Description |
|---|---|---|---|
| POST | `/register` | public | Email/pseudo/pays/nationalité (choix **définitif**, INV-31). Body : `{ email, username, password, countryCode, nationality }`. |
| POST | `/login` | public | `{ email, password }` → `{ accessToken, refreshToken, expiresIn }`. Plateformes mobiles : échange de token store (Google Play / App Store / Huawei IAP / Stripe / Flutterwave — cf. cahier §monétisation). |
| POST | `/refresh` | refreshToken | Rotation obligatoire : l'ancien refresh est révoqué (`REFRESH_REUSED` → révocation de toute la famille = détection de vol). |
| POST | `/logout` | JWT | Révoque le refresh courant. |
| POST | `/verify-age` | JWT | `{ document }` → pose `ageVerifiedAt` (prérequis paris HARD ≥ 18 ans, INV-21). |

## 3. Players — `/api/v1/players`
| Méthode | Route | Description |
|---|---|---|
| GET | `/me` | Profil : pseudo, pays, nationalité, niveau, XP, PL, division (Bronze 0‑499 … Légende 3000+), réputation, gemmes/crédits/tokens (entiers). |
| PATCH | `/me` | Champs éditables uniquement (pseudo, préférences). Nationalité **non modifiable** après 1ʳᵉ course classée (INV-31). |
| GET | `/me/stats` | Statistiques de course (victoires, records, drift points…). |
| GET | `/:id` | Profil public. |

## 4. Matches & Matchmaking — `/api/v1/matches`, `/api/v1/matchmaking`
| Méthode | Route | Description |
|---|---|---|
| POST | `/matchmaking/queue` | Entrée en file. `{ mode }` avec paramètres exacts du CdC : classée PL ±200 (→±500 après 90 s, max 120 s), rapide PL ±500 max 60 s, battle royale PL ±400 max 120 s, etc. Sortie : `{ ticketId, estimatedWaitMs }`. |
| DELETE | `/matchmaking/queue/:ticketId` | Annulation (machine à états Ticket, INV-22). |
| GET | `/matchmaking/ticket/:ticketId` | État du ticket (`QUEUED → MATCHED → JOINED → COMPLETED / CANCELLED / EXPIRED`). |
| GET | `/matches/:id` | Match : circuit, météo, véhicules, état machine (`WAITING_FOR_PLAYERS → LOADING → IN_PROGRESS → FINISHED → FINISHED_VALIDATED / INVALIDATED`). |
| GET | `/matches/:id/connect` | Credentials du game server : `{ wsUrl, roomToken, serverSignature }` (HMAC, INV-26). Reconnexion tolérée **30 s** (INV-17). |
| POST | `/matches/:id/results` | **Réservé game server** (payload HMAC signé). Le backend **re-valide** tout : checkpoints obligatoires (Lomé=5, Accra=6, Lagos=7, Dakar=6, Paris=8, Tokyo=9, Abidjan=7, Nairobi=7, Casablanca=8, Dubaï=9), vitesse max par catégorie, temps minimum théorique (records), nonce + timestamp anti-replay (INV-25). Résultat invalide → `INVALIDATED`. |
| GET | `/matches/history` | Historique paginé ; récompenses calculées **côté serveur uniquement** : grille position (1er: 150cr/8g/120xp/5t, 2e: 90/5/80/3, 3e: 60/3/60/2, 4e‑8e: 30/1/40/1, abandon: 0 — INV-32), bonus perfect +50 % floor / record +200 / 1ʳᵉ victoire du jour +100 / série de 3 : +100cr+5g ; course rapide 50 % crédits, 0 gemme. PL : +25 / ‑20 / 0 / ‑30, cap min 0 (INV-31). |

## 5. Betting — `/api/v1/betting` (pari mutuel 1v1, commission 5 %)
Modèle : `BetMarket` (marché lié à un match 1v1) + `Bet` (mise engagée). `houseEdgeBps = 500`.

| Méthode | Route | Description |
|---|---|---|
| POST | `/markets` | Créer un défi 1v1 : `{ stake, currency: "SOFT"|"HARD", trackId, vehicleId }`. Vérifications serveur : bornes INV-11 (SOFT 10–10000 cr, HARD 100–10000 cts), limite 24 h glissante INV-12, juridiction INV-20 (matrice game-modes §10.5 : France/USA bloqués, Togo LONATO d'abord), âge ≥ 18 + réputation ≥ 30 si HARD (INV-21). Market : `OPEN → CHALLENGED → LOCKED → SETTLING → SETTLED / DISPUTED / CANCELLED`. |
| GET | `/markets` | Marchés publics/jouables (filtres : devise, circuit, plage de mise). |
| GET | `/markets/:id` | Détail + pool courant `{ totalPool, houseCutEstimate, netPool }` (entiers). |
| POST | `/markets/:id/challenge` | Accepter un défi. **`stakeB == stakeA` obligatoire** (INV-10) sinon `BET_STAKE_MISMATCH`. À l'acceptation : débit wallet → escrow atomique dans `prisma.$transaction` (INV-15, INV-30) + verrouillage du match associé. |
| POST | `/markets/:id/cancel` | Annulation avant acceptation : remboursement intégral, `houseCut = 0`. |
| POST | `/markets/:id/dispute` | Litige : gel ≤ 72 h (INV-19), aucun settlement partiel pendant le gel. |
| GET | `/markets/:id/odds` | Cotes implicites live : `payout_i = floor(stake_i × netPool / winningStake)` (INV-09), rafraîchies à chaque engagement. |
| GET | `/bets/me` | Historique de mes paris + statuts bet (`PENDING → ACCEPTED → ESCROWED → RUNNING → WON / LOST / PUSH / REFUNDED / VOIDED`, machines INV-22/23). |
| POST | `/admin/markets/:id/settle` | **ADMIN only** (INV-28). Settlement manuel idempotent ; `BetSettlement.marketId` UNIQUE (INV-14). Égalité → push, remboursement intégral sans commission (INV-16). Triche confirmée → remboursement perdant + reverse houseCut + sanction (INV-18). |

Settlement automatique : déclenché par `Match → FINISHED_VALIDATED` via outbox garantie (INV-24). Conservation de valeur vérifiée : `sum(debits) == sum(credits) + houseCut` (INV-05) ; résidu de floor crédité au House (INV-09, INV-13). Abandon/déconnexion > 30 s = perdant (INV-17).

## 6. Wallet & Payments — `/api/v1/wallet`, `/api/v1/payments`
| Méthode | Route | Description |
|---|---|---|
| GET | `/wallet/balances` | `{ credits, gems, tokens, hardCents }` — tous entiers, jamais négatifs (INV-02). SOFT et HARD cloisonnés (INV-07). |
| GET | `/wallet/transactions` | Ledger append-only (INV-06) : types `DEPOSIT`, `PURCHASE`, `BET_ESCROW`, `BET_PAYOUT`, `BET_REFUND`, `REVERSAL`, `HOUSE_FEE`… montants signés, solde après. |
| POST | `/payments/checkout` | Dépôt HARD : `{ amountCents, provider: "STRIPE"|"FLUTTERWAVE", currency }`. Bornes CdC : min 1 000 cts (10 €), max 100 000 cts (1 000 €) ; plafonds mensuels/annuels par juridiction. Crée un `Payment` (`CREATED → PROVIDER_PENDING → SUCCEEDED / FAILED`, terminal après succès, INV-23). |
| POST | `/payments/tickets` | Achat de tickets (Tournois / Matchday / Clan Wars) : 500 crédits **ou** 10 gemmes → machine à états `Ticket`. |
| GET | `/payments/:id` | Statut paiement (polling client). |

## 7. Webhooks — `/api/v1/webhooks` (server-to-server)
| Route | Signature | Notes |
|---|---|---|
| POST `/stripe` | `Stripe-Signature` HMAC-SHA256, comparaison `timingSafeEqual` (INV-26) | `payment_intent.succeeded` → crédit HARD idempotent (clé = event id, INV-04). |
| POST `/flutterwave` | HMAC-SHA256 secret FLW | Idem ; vérificateur enregistré dans `verifiers/verifier.registry.ts`. |
| POST `/gameserver` | HMAC-SHA256 shared secret + nonce + timestamp (fenêtre 60 s anti-replay) | Résultats de course → pipeline validation INV-25 puis settlement INV-24. |

Règles : réponse 2xx immédiate après enqueue ; traitement asynchrone ; doublons ignorés grâce à l'idempotency key ; échec de signature → 401 + alerte observabilité.

## 8. House Wallet — `/api/v1/house` (ADMIN only)
| Méthode | Route | Description |
|---|---|---|
| GET | `/house/balance` | Solde cumulé des commissions (INV-13) + P&L par période. |
| GET | `/house/ledger` | Journal append-only des mouvements house (`HOUSE_FEE`, `HOUSE_REVERSAL`). |
| POST | `/house/reverse` | Contre-écriture d'un settlement litigieux (jamais d'UPDATE du ledger, INV-06). |

## 9. Admin & Modération — `/api/v1/admin` (rôle ADMIN)
- `GET/POST /sanctions` : ban 7 j (réputation < 10), restriction paris, retrait de récompenses ; machine à états Sanction (`ISSUED → ACTIVE → APPEALED → LIFTED / UPHELD`).
- `GET /audit` : journal d'actions admin (qui, quoi, quand — horodaté via `Clock`, INV-29).
- `GET /servers` / `POST /servers/:id/drain` : flotte game servers (`REGISTERED → DRAINING → OFFLINE`, healthcheck).

## 10. Divers
- `GET /health` : liveness/readiness (DB, Redis, queue). Non authentifié.
- `GET /leaderboards?scope=world|country|division|clan|vehicle|season` : classements du CdC (mondial PL, par pays, division, clan, véhicule, saisonnier).
- `GET /achievements` : progression ("Parieur né" = gagner 10 paris, "Drift King" = 1 M pts, etc.).

## 11. WebSocket (temps réel)
- `wss://…/ws/v1/lobby` : files matchmaking, chat (global/clans/amis/course, modéré), événements market (odds live).
- `wss://…/ws/v1/race/:matchId` : protocole RaceNet (cf. `docs/networking.md`).
- Auth WS : `Sec-WebSocket-Protocol: bearer.<accessToken>` ; heartbeat 10 s ; déconnexion > 30 s en course = traitre (INV-17).

## 12. Rate limiting (header `Retry-After` sur 429)
| Portée | Limite |
|---|---|
| Public (auth, register) | 10 req/min/IP |
| Authenticated global | 120 req/min/user |
| Betting create/challenge | 20 req/min/user |
| Results ingestion (game server) | 500 req/min/server |

## 13. Versionnage & compatibilité
- Breaking change → incrémentation majeure (`/api/v2`) avec cohabitation et fenêtre de dépréciation (header `Deprecation`). Détails : `docs/api-versioning.md`.
- Les clients Unity (DTOs C# avec `[JsonExtensionData]`) ignorent les champs inconnus → les ajouts mineurs sont toujours rétrocompatibles.
