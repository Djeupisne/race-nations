# Race Nations — Conformité légale des paris (`docs/betting-legal.md`)

> Document de référence juridique OPÉRATIONNELLE. Ce fichier n'est pas un avis juridique :
> il formalise les règles implémentées par le code (INV-10..INV-21) et la matrice de gating
> par juridiction. Toute évolution de la matrice passe par une revue légale + une migration
> `JurisdictionConfig` + la MAJ du seed `scripts/seed-prod.sh`.

---

## 1. Périmètre

Le produit propose deux régimes monétaires étanches (INV-07) :

| Régime | Devise | Nature | Pari |
|---|---|---|---|
| **SOFT** | crédits / gemmes / tokens (entiers virtuels) | Monnaie virtuelle sans valeur de rachat | Défis 1v1 entre joueurs, tournois |
| **HARD** | centimes réels (`hardCents`, entiers — INV-01) | Argent réel déposé via Stripe/Flutterwave/IAP | Paris 1v1 uniquement, sur marchés sous licence |

Le modèle économique est **pari mutuel strict** (pas de cote fixe, pas de bookmaker contre-joueur) :
la maison ne prend qu'une commission `houseEdgeBps = 500` (5 %) prélevée sur le pool (INV-08, INV-13).

## 2. Matrice de juridictions (implémentée dans `jurisdiction.service.ts` + table `jurisdiction_configs`)

Statuts d'activation (`BettingActivationStatus`) : `DISABLED` / `PENDING` / `ENABLED_SOFT` / `ENABLED_HARD`.

| Pays (ISO-3166-1) | Activation | Autorité / base légale | Notes |
|---|---|---|---|
| 🇫🇷 FR | **DISABLED** | ANJ — jeux d'argent en ligne réservés aux opérateurs agréés ; le pari sur compétitions de sport électronique non agréée est interdit | Pari SOFT également bloqué (politique produit, cf. game-modes §10.5) |
| 🇺🇸 USA | **DISABLED** | UIGEA + registre étatique | Blocage serveur systématique, jamais client-only (INV-20) |
| 🇹🇬 TG | **ENABLED_HARD** (prioritaire) | LONATO — licence en cours (statut `PENDING` tant que non délivrée) | Premier marché HARD cible (roadmap Month 11+) |
| 🇳🇬 NG | ENABLED_SOFT → HARD envisagé | NLRC | Plafonds journalier/mensuel/annuel HARD en `jurisdiction_configs` |
| 🇰🇪 KE | ENABLED_SOFT | BCLB | idem |
| 🇨🇮 CI | ENABLED_SOFT | LONACI | idem |
| 🇸🇳 SN | ENABLED_SOFT | LONASE | idem |
| 🇬🇭 GH | ENABLED_SOFT | GCA | idem |

Règles serveur inconditionnelles (code, pas configuration) :
- Un pari **HARD** exige `licenseStatus = ACTIVE` **et** `bettingActivation ∈ {ENABLED_HARD}` pour le pays de résidence du joueur (`Player.countryCode`) — sinon `JURISDICTION_BLOCKED` 403 (INV-20).
- Un pari **SOFT** est refusé si le pays est `DISABLED` (FR, USA…) — même si le pays de nationalité sportive est différent : seule la **résidence** compte.
- La juridiction est vérifiée à **chaque** étape sensible : création de marché, acceptation (challenge), settlement manuel admin. Jamais mise en cache au-delà d'une requête.

## 3. Protection des mineurs & KYC (INV-21)

Pour tout pari HARD, le serveur exige cumulativement :
1. **Âge ≥ 18 vérifié** : `Player.ageVerifiedAt != null` après le parcours `POST /auth/verify-age`
   (`documentType ∈ NATIONAL_ID | PASSPORT | DRIVERS_LICENSE`). Le document est chiffré au repos,
   référencé par `kycDocumentRef` (objet storage), **jamais stocké en clair ni loggé** (RGPD, observability.md §2).
   Défaut → `AGE_VERIFICATION_REQUIRED` 403.
2. **Réputation ≥ 30** (`MIN_REPUTATION_HARD`) : un joueur dégradé (toxicité, abandons) perd l'accès
   HARD et aux tournois payants. Défaut → `REPUTATION_TOO_LOW` 403.
3. Réputation < 10 → sanction automatique `TEMP_BAN_7D` posée par la modération (coupe-circuit).

Interdictions produit : aucun contenu publicitaire de paris envers des comptes mineurs ;
inscription soumise au consentement explicite termes + vie privée horodatés (`acceptedTermsAt`, `acceptedPrivacyAt`).

## 4. Jeu responsable

| Mesure | Implémentation |
|---|---|
| Limites de mise | INV-11 : SOFT 10–10 000 cr ; HARD 1 €–100 € (100–10 000 ct) ; tournoi 50–50 000 cr |
| Limite journalière | INV-12 : somme des mises acceptées ≤ 10 000 cr / fenêtre glissante 24 h (calcul `bet-limits.service.ts` sur ledger, pas sur compteur incrémental) |
| Plafonds HARD par juridiction | Colonnes `dailyHardLimitCents` / `monthlyHardLimitCents` / `yearlyHardLimitCents` de `jurisdiction_configs` |
| Auto-exclusion | Sanction `BET_RESTRICTION` (machine Sanction ISSUED→ACTIVE→LIFTED/UPHELD) coupant création + acceptation de pari |
| Historique transparent | `GET /betting/bets/me` + ledger append-only (INV-06) : le joueur peut auditer chaque unité misée/perçue |
| Factivité | Dépôt HARD plafonné 10 €–1 000 € par transaction (CHECK migration 0004) |

## 5. Obligations documentaires & fiscales

- **Registre des transactions** : ledger append-only + triggers d'immuabilité (migration 0002) ; snapshot quotidien House (`HouseBalanceSnapshot`) pour la réconciliation comptable (observability.md §8).
- **Audit admin** : chaque settlement manuel, reverse House, sanction est journalisé (`AdminAuditLog` : qui/quoi/quand via Clock, INV-28/29).
- **LCB/FT (HARD)** : seuils de signalement par juridiction ; KYC complet avant retrait ; conservation 5 ans des `Payment` + `WebhookEvent`.
- **TVA/fiscalité commissions** : le `houseCut` est isolé dans le House Wallet (compte SYSTEM `ownerType=HOUSE`, INV-13) — jamais mixé aux fonds joueurs (escrow séparé, INV-15).

## 6. Anti-fraude & intégrité sportive

- Validation serveur systématique des résultats avant settlement (INV-25) : séquence de checkpoints par circuit, vitesses max par catégorie, temps minimum théorique, nonce + timestamp anti-replay, HMAC-SHA256 en temps constant (INV-26).
- Triche confirmée → remboursement intégral du perdant, reverse du houseCut, sanction du fraudeur (INV-18) — flux `cheatReversal` du settlement manuel.
- Litige joueur : gel ≤ 72 h (INV-19) avec escalade obligatoire (voir `runbook.md` §4).

## 7. Checklist de lancement HARD par pays (procédure)

1. Licence délivrée → `licenseStatus = ACTIVE` en DB (migration + PR revue légale).
2. `bettingActivation = ENABLED_HARD` + plafonds journalier/mensuel/annuel renseignés.
3. Tests e2e `backend/test/betting*.e2e-spec.ts` passés avec la matrice à jour.
4. Runbook d'incident + contacts autorité de régulation publiés (`docs/runbook.md`).
5. Monitoring dédié activé : alerte `bet_hard_volume_{cc}`, garde-fou kill-switch `BETTING_HARD_ENABLED=false` (env, lu par `betting.config.ts`).

> ⚠️ Le kill-switch env désactive HARD **mondialement** en < 1 min sans redéploiement de schéma ;
> c'est la réponse incident n°1 (cf. runbook §5).
