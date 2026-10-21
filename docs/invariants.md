# Invariants — Race Nations

> Source de vérité : `docs/cahier-des-charges.md`, `docs/game-design.md`, `docs/game-modes.md`.
> Chaque invariant est **testable** (e2e `backend/test/invariants.e2e-spec.ts` ou unitaire).
> Une violation d'un invariant `INV-xx` est un bug bloquant (P0) pour les invariants financiers/légal.

## A. Argent & Wallets

- **INV-01 — Argent = entiers uniquement.** Toutes les valeurs monétaires sont stockées et manipulées en entiers : crédits/gemmes/tokens en unités entières, HARD money en *centimes* (`amountCents: number`). Aucun `float`, aucun `Number` décimal dans le chemin monétaire. Les divisions utilisent `Math.floor` ; le résidu de division n'est jamais perdu (voir INV-05/INV-09).
- **INV-02 — Solde jamais négatif.** Pour tout wallet `w` : `balance >= 0` à tout instant observable par une transaction commitée. Débit conditionnel SQL : `UPDATE ... WHERE balance >= amount`, sinon rollback + erreur `InsufficientFunds`.
- **INV-03 — Tout mouvement d'argent passe par `wallet.repository.ts`.** Aucun service ne fait un `update` direct sur la table des balances. Chaque débit/crédit utilise `SELECT ... FOR UPDATE` (lock pessimiste sur la ligne du wallet) puis écrit une ligne dans `WalletTransaction`.
- **INV-04 — Toute transaction a une `idempotencyKey` UNIQUE.** Contrainte DB `UNIQUE(idempotencyKey)` sur `WalletTransaction`. Rejouer la même clé ne produit jamais un second mouvement ; la réponse originale est renvoyée.
- **INV-05 — Conservation de la valeur.** Pour toute transaction multi-wallet (settlement de pari, paiement, marketplace), la somme des débits égale la somme des crédits + la commission explicitement créditée au House Wallet. Test : `sum(debits) == sum(credits) + houseCut`.
- **INV-06 — Ledger append-only.** Les lignes `WalletTransaction` sont immuables (pas d'`UPDATE`/`DELETE`). Une correction se fait par contre-écriture (`REVERSAL`) liée à la transaction d'origine.
- **INV-07 — Deux sources de fonds distinctes.** SOFT (crédits/gemmes virtuels) et HARD (centimes réels) ne se mélangent jamais dans un même règlement. Un pari HARD se règle en HARD, un pari SOFT en SOFT.

## B. Paris (pari mutuel 1v1)

- **INV-08 — Modèle parimutuel strict.** Pour un marché 1v1 : `totalPool = stakeA + stakeB` ; `houseCut = floor(totalPool × houseEdgeBps / 10000)` avec `houseEdgeBps = 500` (5%) ; `netPool = totalPool - houseCut` ; `payout_gagnant = netPool` ; `payout_perdant = 0`.
- **INV-09 — Formule de payout générale.** Pour tout settlement parimutuel à N outcomes : `payout_i = floor(stake_i × netPool / winningStake)` pour chaque joueur `i` du camp gagnant ; `0` sinon. La somme des payouts crédités ≤ `netPool` ; le résidu du plancher est crédité au House Wallet (cohérence INV-05).
- **INV-10 — Mises identiques obligatoires (défi 1v1).** Un défi n'est acceptable que si `stakeB == stakeA`. Toute autre valeur → rejet `BetStakeMismatch`.
- **INV-11 — Bornes de mise.** SOFT : `10 ≤ stake ≤ 10000` crédits. HARD : `100 ≤ stake ≤ 10000` centimes (1€–100€). Paris de tournoi : `50 ≤ stake ≤ 50000` crédits. Hors bornes → `BetStakeOutOfRange`.
- **INV-12 — Limite journalière.** Somme des mises acceptées sur 24h glissantes ≤ `10000` crédits/jour (SOFT) et équivalent HARD par juridiction ; dépassement → `BetDailyLimitExceeded`.
- **INV-13 — Commission exacte et tracée.** `houseCut` est prélevé à l'unité près et crédité exclusivement au House Wallet (compte système unique, `ownerType=HOUSE`). Aucune autre entité ne peut recevoir de commission.
- **INV-14 — Pas de double settlement.** Contrainte DB `UNIQUE(marketId)` sur `BetSettlement`. Tenter de régler deux fois le même marché échoue (`BetAlreadySettled`) sans effet de bord.
- **INV-15 — Fonds immobilisés à l'acceptation.** À l'acceptation d'un pari, la mise est débitée du wallet du joueur et placée en `escrow` (mouvement ledger `BET_ESCROW`). Le settlement ne peut créditer que depuis l'escrow. Un bet `ACCEPTED` sans escrow correspondant est une violation.
- **INV-16 — Égalité = remboursement intégral.** En cas d'égalité : chaque joueur récupère sa mise, `houseCut = 0`, aucune commission encaissée.
- **INV-17 — Abandon = perte de la mise.** Le joueur qui abandonne (ou déconnecté > 30s sans reprise) est traité comme perdant ; son escrow est réglé selon INV-08/09.
- **INV-18 — Triche confirmée = remboursement + sanction.** Si fraude validée côté gagnant, le perdant est remboursé intégralement, le houseCut est reversé, et une sanction est créée via la machine à états des sanctions.
- **INV-19 — Litige = gel ≤ 72h.** Un marché en litige gèle le payout ; la résolution admin doit intervenir en ≤ 72h (sinon escalade runbook). Aucun settlement partiel pendant le gel.
- **INV-20 — Juridiction gating.** Un pari HARD n'est accepté que si le pays du joueur a une licence active (Togo d'abord, LONATO). Un pari SOFT est soumis à la matrice pays (`game-modes.md §10.5` : France/USA bloqués). Vérification serveur systématique, jamais seulement client.
- **INV-21 — Âge & réputation.** PARIS HARD : joueur ≥ 18 ans vérifié ET `reputation >= 30` (règle « réputation < 30 = pas de paris HARD ni tournois payants »). Réputation < 10 → bannissement temporaire 7j déjà déclenché par la modération.

## C. États & Transitions

- **INV-22 — Toute transition d'état passe par `assertXTransition`.** Match, Ticket, Payment, GameServer, Sanction, Bet, BetMarket : les transitions sont déclarées dans `backend/src/common/state-machines/` ; un changement d'état hors graphe autorisé lève `InvalidStateTransition` et n'est jamais persisté.
- **INV-23 — Machines à états monotones côté argent.** Un `Bet` ne peut atteindre `SETTLED`/`REFUNDED` qu'une seule fois ; un `Payment` `SUCCEEDED` est terminal ; `FAILED`/`CANCELLED` sont terminaux.
- **INV-24 — Settlement match ⟺ settlement bets.** Quand un `Match` lié à un marché passe à `FINISHED_VALIDATED`, le settlement des paris du marché est soit exécuté, soit mis en file garantie (outbox) ; il ne peut être perdu. Inversement, aucun bet n'est réglé pour un match non finalisé validé.

## D. Sécurité & Confiance

- **INV-25 — Validation serveur des résultats.** Aucun résultat de course n'est cru sur parole : vitesse max par catégorie, séquence de checkpoints obligatoire (Lomé=5, Accra=6, Lagos=7, Dakar=6, Paris=8, Tokyo=9, Abidjan=7, Nairobi=7, Casablanca=8, Dubaï=9), temps minimum théorique (records `game-design.md §3`), nonce + timestamp anti-replay. Résultat invalide → match `INVALIDATED`, paris → litige (INV-18/19).
- **INV-26 — HMAC avec comparaison temps constant.** Toute signature entrante (webhooks Stripe/Flutterwave/GameServer) est vérifiée par HMAC-SHA256 et comparée avec `crypto.timingSafeEqual`. Une comparaison `===` sur une signature est interdite.
- **INV-27 — Inputs externes validés par Zod.** Chaque endpoint valide son body/query/params via un schéma Zod (`ZodValidationPipe`). Un DTO non validé n'atteint jamais un service.
- **INV-28 — Authz par ressource.** `OwnershipGuard` sur toute mutation touchant un wallet/bet/match d'un joueur ; rôle `ADMIN` requis pour settle manuel, sanctions, opérations House Wallet. JWT + rotation de refresh token.
- **INV-29 — Horloge injectée.** Aucun `new Date()` dans le code métier : on utilise `Clock.now()` (injectable pour les tests). Les fenêtres temporelles (24h limite, 72h litige, 30s reconnexion) utilisent `Clock`.
- **INV-30 — Multi-étapes = transaction.** Toute opération qui touche ≥2 lignes critiques (ex. escrow + ledger, settlement + payouts + houseCut) s'exécute dans `prisma.$transaction` (ou `@Transactional`). Pas de semi-réussi observable.

## E. Jeu (rappels contractuels backend)

- **INV-31 — PL & divisions conformes.** Victoire classée : `+25 PL` ; défaite : `-20` ; nul : `0` ; abandon : `-30` ; cap min `0`. Seuils de division exacts du cahier des charges (Bronze 0-499 … Légende 3000+). Reset saison : `floor(pl × 0.5)`. Nationalité immuable après la 1ʳᵉ course classée.
- **INV-32 — Récompenses déterministes.** Grille position→récompenses figée (1er: 150cr/8g/120xp/5t, 2e: 90/5/80/3, 3e: 60/3/60/2, 4e-8e: 30/1/40/1, abandon: 0/0/0/0) ; bonus appliqués côté serveur uniquement (course parfaite +50% crédits arrondi inférieur, record +200, 1ʳᵉ victoire du jour +100, série de 3 victoires : +100 crédits +5 gemmes). Course rapide : 50% crédits, 0 gemme.

---

## Matrice testabilité

| INV | Test | Niveau |
|---|---|---|
| 01,02,03,04,05,06,07 | `invariants.e2e-spec.ts` + tests wallet | e2e |
| 08..19 | `betting.e2e-spec.ts`, `betting-settlement.e2e-spec.ts`, `betting-concurrency.e2e-spec.ts`, `parimutuel.spec.ts` | unit + e2e |
| 20,21 | `betting.e2e-spec.ts` (gates juridiction) | e2e |
| 22,23,24 | specs state-machines + `betting-settlement.e2e-spec.ts` | unit + e2e |
| 25..30 | `house-wallet.e2e-spec.ts`, guards/pipes unitaires | mixte |
| 31,32 | `match-settlement` e2e | e2e |
