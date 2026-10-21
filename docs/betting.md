# Race Nations — Spécification des paris (Betting Specification)

> **Version** : 1.0.0 · **Statut** : Source de vérité fonctionnelle · **Phase** : PHASE_1
> **Références** : `docs/cahier-des-charges.md` §3.10, `docs/game-modes.md` §10, `docs/invariants.md` INV-07 à INV-24.
> Ce document précise le modèle **pari mutuel 1v1 avec mise identique**, la machine à états, la formule de payout et les cas limites. Tout code betting DOIT s'y conformer.

---

## 1. Vue d'ensemble

Les paris sont des **défis 1v1 avec mise** entre deux joueurs. Format imposé par le cahier des charges :

| Paramètre | Valeur | Source |
|---|---|---|
| Format | 1v1 uniquement (mode défi) | `cahier-des-charges.md` §3.10 |
| Mises | **Identiques** (`stakeB == stakeA`) — INV-10 | §3.10, `game-modes.md` §10.1 |
| Modèle | **Parimutuel** (pool partagé) | §3.10 |
| Commission | **5%** = `houseEdgeBps = 500` (bps = basis points /10000) | §3.10 |
| Devise | SOFT (crédits virtuels) ou HARD (centimes réels) | §3.10 |
| Activation | Par pays (Togo d'abord, licence LONATO) | §3.10, `game-modes.md` §10.5 |
| Matchmaking | PL ±300 | `game-modes.md` §10.1 |
| Circuit | Aléatoire ou choisi par le créateur | §10.1 |
| Véhicule | Libre (chaque joueur choisit) | §10.1 |
| Durée | 1 course | §10.1 |

Il existe aussi un sous-mode **Paris de tournoi** (§9) : on parie sur le vainqueur d'un tournoi, cotes dynamiques parimutuelles.

### Types de devise (INV-07)

- **SOFT** : crédits du jeu (entiers). Pas de valeur réelle, non remboursable.
- **HARD** : argent réel en **centimes** (`amountCents`, entier — INV-01). Soumis à licence par juridiction (voir `docs/betting-legal.md`).
- Un marché est soit SOFT soit HARD. **Jamais mélangés dans un même règlement.**

---

## 2. Constantes de configuration

Définies dans `backend/src/config/betting.config.ts` (surcharge par env, valeurs par défaut contractuelles) :

```ts
export const BETTING_CONSTANTS = {
  /** houseEdgeBps = 500 → commission 5% (cahier §3.10) */
  HOUSE_EDGE_BPS: 500,
  /** Bornes de mise SOFT (crédits) — game-modes §10.1, INV-11 */
  SOFT_STAKE_MIN: 10,
  SOFT_STAKE_MAX: 10000,
  /** Bornes de mise HARD (centimes) = 1€–100€ — game-modes §10.1, INV-11 */
  HARD_STAKE_MIN_CENTS: 100,
  HARD_STAKE_MAX_CENTS: 10000,
  /** Paris de tournoi (crédits) — game-modes §10.6, INV-11 */
  TOURNAMENT_STAKE_MIN: 50,
  TOURNAMENT_STAKE_MAX: 50000,
  /** Fenêtre glissante limite journalière SOFT (crédits) — INV-12 */
  DAILY_SOFT_LIMIT: 10000,
  /** Écart de PL pour l'appariement des défis — game-modes §10.1 */
  PL_DELTA_MAX: 300,
  /** Tolérance de déconnexion avant abandon (ms) — game-modes §10.4, INV-17 */
  DISCONNECT_TOLERANCE_MS: 30_000,
  /** Délai max de résolution d'un litige (ms) — game-modes §10.4, INV-19 */
  DISPUTE_MAX_AGE_MS: 72 * 3600 * 1000,
  /** Réputation minimale pour parier en HARD — cahier §4.3, INV-21 */
  MIN_REPUTATION_HARD: 30,
  /** Âge minimum pour HARD (années) — roadmap Month 11+ (paris monnaie réelle) */
  MIN_AGE_HARD: 18,
} as const;
```

> ⚠️ Ces constantes sont des **contrats**. Toute modification exige une migration documentée + MAJ des tests e2e (`backend/test/betting*.e2e-spec.ts`).

---

## 3. Cycle de vie d'un pari

### 3.1 Acteurs

- **Créateur A** : publie un défi (mise, devise, circuit, expiration).
- **Accepteur B** : accepte un défi ouvert (filtré par PL ±300).
- **Système (escrow)** : immobilise les fonds à l'acceptation.
- **GameServer** : exécute la course, produit un résultat signé (HMAC).
- **ResultValidator** : valide le résultat côté serveur (INV-25).
- **BetSettlementService** : applique la formule parimutuelle et écrit le ledger.
- **House Wallet** : reçoit la commission (compte système `ownerType=HOUSE`, INV-13).

### 3.2 Séquence nominale

```
A: createChallenge(stake, currency, track?, expiresAt?)
   → BetMarket(CREATED) + Bet(A, side=CHALLENGER, status=OPEN)
B: acceptChallenge(marketId, idempotencyKey)
   → vérifs (PL±300, bornes, limites, juridiction, escrow B)
   → Bet(B, side=CHALLENGED, status=ACCEPTED), escrow A+B débités
   → BetMarket(LOCKED) → match créé → matchmaking GameServer
Match FINISHED_VALIDATED (résultat serveur validé, INV-25)
   → BetMarket(SETTLING) → settlement parimutuel (formule §4)
   → payouts gagnant/perdant + houseCut → ledger
   → BetMarket(SETTLED), Bet(WON/LOST), transactions UNIQUE(idempotencyKey)
```

Chaque étape critique s'exécute dans `prisma.$transaction` (INV-30). Les mouvements de wallet passent exclusivement par `wallet.repository.ts` avec `SELECT ... FOR UPDATE` (INV-03).

---

## 4. Formule parimutuelle (normative)

### 4.1 Cas 1v1 (défi avec mises identiques) — INV-08

Soit `S = stakeA = stakeB` (garanti par INV-10), `totalPool = stakeA + stakeB = 2S`.

```text
houseCut        = floor(totalPool × houseEdgeBps / 10000)   // bps=500 → 5%
netPool         = totalPool − houseCut
payout_gagnant  = netPool                                    // tout le net au gagnant
payout_perdant  = 0
```

Exemple (SOFT, S = 1000 crédits) :
- `totalPool = 2000`
- `houseCut = floor(2000 × 500 / 10000) = 100`
- `netPool = 1900` → gagnant reçoit **1900** ; perdant **0** ; House **+100**.
- Conservation (INV-05) : `2000 = 1900 + 100` ✔

En HARD : mêmes formules en centimes. Exemple S = 5000 c (50€) : houseCut = 500 c (5€), gagnant = 9500 c.

### 4.2 Formule générale N outcomes (tournoi / multi-camps) — INV-09

Pour un marché à `N` outcomes avec pool par outcome :

```text
totalPool    = Σ stakes (tous outcomes)
houseCut     = floor(totalPool × houseEdgeBps / 10000)
netPool      = totalPool − houseCut
winningStake = Σ stakes sur l'outcome gagnant
payout_i     = floor(stake_i × netPool / winningStake)   pour chaque i sur l'outcome gagnant
payout_i     = 0                                          sinon
residue      = netPool − Σ payout_i                       → crédité au House Wallet
```

- Division entière `Math.floor` uniquement (INV-01).
- Le résidu du plancher n'est **jamais perdu** : il revient au House (INV-09/13).
- Si `winningStake = 0` (cas dégénéré) : remboursement intégral de tous, `houseCut = 0` (équivalent égalité, INV-16).

Implémentation de référence : `backend/src/common/utils/parimutuel.ts` (+ spec `parimutuel.spec.ts`).

### 4.3 Règles d'arrondi

- Tous les `floor` s'appliquent **après** multiplication, jamais avant.
- Interdiction d'`toFixed`, d'`parseFloat`, de division flottante dans le chemin monétaire.
- La somme créditée (joueurs + house + résidu) doit égaler `totalPool` exactement — test `invariants.e2e-spec.ts`.

---

## 5. Machine à états

### 5.1 `BetMarket` (marché de pari)

```
CREATED ──accept──▶ LOCKED
CREATED ──expire──▶ CANCELLED            (remboursement intégral A, houseCut=0)
LOCKED  ──cancel(admin/système)──▶ CANCELLED (remboursement intégral A+B)
LOCKED  ──match FINISHED_VALIDATED──▶ SETTLING ──ledger ok──▶ SETTLED (terminal)
LOCKED  ──dispute ouverte──▶ DISPUTED ──admin resolve──▶ SETTLING | CANCELLED
SETTLING ──crash──▶ retry idempotent (même idempotencyKey) → SETTLED
```

Transitions déclarées dans `bet-market.state-machine.ts` ; toute transition hors graphe lève `InvalidStateTransition` (INV-22). `SETTLED` et `CANCELLED` sont terminaux.

### 5.2 `Bet` (position d'un joueur)

```
OPEN (créateur) ──accept──▶ ACCEPTED (les deux camps)
ACCEPTED ──settle win──▶ WON
ACCEPTED ──settle lose──▶ LOST
ACCEPTED ──market cancelled──▶ REFUNDED
OPEN ──market expired/cancelled──▶ CANCELLED
WON | LOST | REFUNDED | CANCELLED = terminaux (INV-23)
```

Un `Bet` ne peut atteindre un état terminal qu'**une seule fois** (contrainte DB + state machine).

### 5.3 Escrow (INV-15)

- À l'acceptation : débit `BET_ESCROW` des deux wallets vers le compte d'escrow du marché.
- Settlement : crédit depuis l'escrow uniquement.
- Annulation/expiration/égalité : `BET_REFUND` (retour intégral, `houseCut = 0`).
- Bet `ACCEPTED` sans mouvement d'escrow correspondant = violation P0.

---

## 6. Validation à l'acceptation (gate complet)

`bet-validator.service.ts` exécute, dans cet ordre, **côté serveur uniquement** :

1. **Marché existant et `CREATED`** — sinon `BetMarketNotOpen`.
2. **Mise identique** : `stakeB == stakeA` (INV-10) — sinon `BetStakeMismatch`.
3. **Bornes de mise** selon devise/mode (INV-11) — sinon `BetStakeOutOfRange`.
4. **PL compatible** : `|plB − plA| ≤ 300` (game-modes §10.1) — sinon `BetPlMismatch`.
5. **Auto-pari interdit** : `playerB != playerA`.
6. **Limite journalière glissante 24h** (INV-12, fenêtre calculée via `Clock.now()`) — sinon `BetDailyLimitExceeded`.
7. **Juridiction** : matrice pays (`game-modes.md` §10.5, détail dans `docs/betting-legal.md`) — France/USA bloqués y compris SOFT.
8. **Si HARD** : licence active du pays (Togo/LONATO), âge ≥ 18 vérifié, réputation ≥ 30 (INV-20/21).
9. **Fonds disponibles** : `balance >= stake` via SELECT FOR UPDATE — sinon `InsufficientFunds` (INV-02).
10. **Idempotence** : `idempotencyKey` UNIQUE (INV-04).

---

## 7. Cas limites (normatifs)

| Cas | Règle | Invariant |
|---|---|---|
| **Égalité** (dead heat) | Remboursement intégral des deux mises, `houseCut = 0`, bets `REFUNDED` | INV-16 |
| **Abandon** | Le joueur qui abandonne est traité comme **perdant** ; settlement normal (l'autre reçoit `netPool`) | INV-17 |
| **Déconnexion < 30s** | Reprise possible, la course continue | §10.4 |
| **Déconnexion > 30s sans reprise** | Considérée comme **abandon** → règle ci-dessus | INV-17 |
| **Triche confirmée** | Perdant remboursé intégralement, houseCut reversé, sanction créée (state machine sanctions), gagnant déchu | INV-18 |
| **Litige** | Marché `DISPUTED`, payout gelé, résolution admin ≤ **72h** (escalade runbook au-delà) ; aucun settlement partiel pendant le gel | INV-19 |
| **Résultat invalide (validation serveur KO)** | Match `INVALIDATED` → marché `DISPUTED` (traitement triche/litige) | INV-25 |
| **Expiration du défi** (personne n'accepte) | Marché `CANCELLED`, A remboursé intégralement | §5.1 |

Le settlement d'un match `FINISHED` mais non `VALIDATED` est **interdit** (INV-24) : le bet settlement attend la validation serveur.

---

## 8. Settlement & House Wallet

À l'exécution du settlement (`bet-settlement.service.ts`) :

1. Guard : `assertBetMarketTransition(LOCKED→SETTLING)` + contrainte `BetSettlement.marketId UNIQUE` (INV-14).
2. Calcul pur via `parimutuel.ts` (aucun accès DB dans la formule).
3. Dans `prisma.$transaction` :
   - `WalletTx(gagnant ← escrow, payout, key=settle:{marketId}:winner)`
   - `WalletTx(house ← escrow, houseCut, key=settle:{marketId}:house)`
   - Perdant : aucun mouvement (son escrow finance le pool)
   - Insert `BetSettlement(marketId UNIQUE, totalPool, houseCut, netPool, payouts JSON)`
   - Update `Bet` → `WON`/`LOST` via state machine
   - `BetMarket` → `SETTLED`
4. Crash-safe : rejouer la même `idempotencyKey` ne duplique rien (INV-04) ; outbox garantit INV-24.

Le **House Wallet** (`modules/house-wallet`) est un compte système unique (`ownerType=HOUSE`). Il encaisse : commissions des paris (INV-13), résidus de plancher (INV-09), commissions marketplace (10%, hors scope betting). Les opérations manuelles (retrait, ajustement) exigent le rôle `ADMIN` + audit trail (INV-28).

---

## 9. Paris de tournoi (variante)

Conformément à `game-modes.md` §10.6 :

- On parie sur **le vainqueur d'un tournoi** (N outcomes = joueurs qualifiés).
- **Cotes dynamiques** : dérivées du parimutuel (`odds_i ≈ netPool / stakeOn_i`), affichées à titre indicatif ; le payout final suit **toujours** la formule §4.2 au moment du settlement (aucune cote garantie).
- Bornes : `50 ≤ stake ≤ 50000` crédits (SOFT uniquement en v1).
- Settlement différé : à la fin du tournoi (dernier match `FINISHED_VALIDATED`), agrégé dans un `BetSettlement(marketId UNIQUE)`.
- Limite journalière : cumulée avec les défis 1v1 (même fenêtre 24h).

---

## 10. API (résumé — détail dans `docs/api.md`)

| Méthode | Route | Description |
|---|---|---|
| POST | `/v1/betting/challenges` | Créer un défi (mise, devise, circuit optionnel, expiration) |
| GET | `/v1/betting/challenges` | Liste des défis ouverts (filtrage PL ±300, devise, juridiction) |
| POST | `/v1/betting/challenges/:id/accept` | Accepter (header `Idempotency-Key`) |
| POST | `/v1/betting/challenges/:id/cancel` | Annuler (créateur, tant que `CREATED`) |
| GET | `/v1/betting/markets/:id` | Détail marché + pool + cotes implicites |
| GET | `/v1/betting/markets/:id/odds` | Cotes parimutuelles live |
| GET | `/v1/betting/bets/me` | Historique des paris du joueur |
| POST | `/v1/betting/markets/:id/dispute` | Ouvrir un litige (motif Zod-validé) |
| POST | `/v1/admin/betting/markets/:id/settle` | Settlement manuel (ADMIN, idempotent) |
| POST | `/v1/admin/betting/markets/:id/resolve-dispute` | Résolution litige (ADMIN, ≤72h) |

Toutes les entrées sont validées par Zod (INV-27) ; toutes les mutations sont authentifiées + `OwnershipGuard`/rôle ADMIN (INV-28).

---

## 11. Tests requis (couverture normative)

Unitaires (`parimutuel.spec.ts`) :
- Payout exact 1v1 : S=1000 → gagnant 1900, house 100.
- Arrondis : S=7 (totalPool=14) → houseCut=floor(0.7)=0, netPool=14, gagnant=14.
- Multi-outcomes avec résidu crédité au house ; conservation stricte.
- `winningStake=0` → remboursement intégral.

E2E (`betting.e2e-spec.ts`, `betting-settlement.e2e-spec.ts`, `betting-concurrency.e2e-spec.ts`, `house-wallet.e2e-spec.ts`, `invariants.e2e-spec.ts`) :
- Happy path create → accept → race → settle (ledger équilibré).
- Rejets : mise désalignée, hors bornes, PL > 300, limite 24h, juridiction FR/USA, réputation < 30 en HARD.
- Double settlement impossible (UNIQUE marketId) + replay idempotent.
- Concurrence : 2 accepts simultanés → un seul remporte la slot (lock ligne).
- Égalité → remboursements sans commission ; abandon → perte ; litige → gel puis résolution.
- House Wallet : somme des houseCut == solde house (audit).

---

## 12. Définition de terminé (DoD)

- [x] Formule normative §4 alignée INV-08/09.
- [x] State machines complètes §5 alignées INV-22/23.
- [x] Gate d'acceptation §6 ordonné et serveur-only.
- [x] Cas limites §7 couverts par tests §11.
- [x] Aucune valeur inventée : tout paramètre traçable vers `cahier-des-charges.md` §3.10 ou `game-modes.md` §10.
