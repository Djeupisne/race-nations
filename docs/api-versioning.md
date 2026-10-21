# Race Nations — Versionnage de l'API

> L'API publique vit sous `/api/v1`. Ce document définit les règles de compatibilité, le cycle de dépréciation et la stratégie de migration des clients (Unity, admin-panel Next.js, game servers).
> Source de vérité des DTOs : `shared/api-contracts/src/*` (schémas Zod partagés client/serveur, cf. INV-27).

---

## 1. Modèle de versionnement

**URI path versioning** (`/api/vN`) pour la version **majeure**, combiné à un **header sémantique** pour les versions mineures :

| Élément | Véhicule | Exemple |
|---|---|---|
| Majeure | Path | `/api/v1/betting/markets` |
| Mineure | Header réponse `X-API-Version` + contrat `shared/api-contracts/src/version.ts` | `1.4.0` |
| Build | Header `X-API-Build` (date UTC) | `2026-10-21` |

Choix du path pour la majeure : simple à router (reverse proxy), visible dans les logs/métriques (`route` label sans cardinalité additionnelle), et compatible avec WebSocket (`/ws/v1/lobby`).

## 2. Règles de compatibilité (SemVer appliqué au contrat)

### Patch (1.0.x) — toujours compatible
- Corrections de bug, messages d'erreur, métriques internes.

### Mineure (1.x.0) — rétrocompatible **strictement**
AUTORISÉS sans bump majeur :
- **Ajout** de champs en réponse (les clients Unity déclarent `[JsonExtensionData]` → ils ignorent les inconnus ; les clients Zod utilisent `.passthrough()`/optional).
- **Ajout** d'endpoint, de route WS, de `code` d'erreur métier (documenté dans `docs/api.md §1.2`).
- **Ajout** de valeur énumérée *uniquement si* tous les clients traitent déjà les valeurs inconnues par fallback explicite (cf. §5).

INTERDITS en mineure (= breaking) :
- Suppression/renommage de champ ou endpoint ; changement de type (notamment `int → float` : **jamais**, cf. INV-01).
- Durcissement d'une validation (nouvelle borne, champ requis) ; relaxation d'une authz.
- Changement de sémantique d'un champ existant, même si le type reste identique.
- Modification d'un comportement monétaire (formule payout, houseCut) — ces changements passent par feature flag + doc légale, jamais silencieusement.

### Majeure (2.0.0)
- Toute rupture ci-dessus. Cohabitation `/api/v1` + `/api/v2` pendant toute la fenêtre de dépréciation.

## 3. Cycle de vie d'une version

| Phase | Durée | Comportement serveur |
|---|---|---|
| Current | indéfini | normal |
| Deprecated | ≥ 180 j (clients mobiles : ≥ 270 j pour couvrir les mises à jour store) | réponses avec headers de dépréciation (§4) + entrée CHANGELOG |
| Sunset | J+0 après fin dépréciation | `410 Gone`, code `API_VERSION_RETIRED`, message pointant vers la doc de migration |

Règle : **au plus 2 majeures actives** simultanément. Une majeure ne peut être sunsetée que si < 1 % du trafic quotidien y passe encore (mesuré via `http_requests_total{api_version}`).

## 4. Headers de dépréciation (RFC 9745 / draft deprecate-header)

Toute réponse d'une version dépréciée porte :

```
Deprecation: @1767225600          # timestamp Unix de sunset (ou "true" legacy)
Sunset: Tue, 01 Dec 2026 00:00:00 GMT
Link: </docs/migrations/v1-to-v2.md>; rel="deprecation"
Warning: 299 - "API v1 deprecated, migrate to v2 before 2026-12-01"
X-API-Version: 1.4.0
```

Les SDK Unity et `admin-panel/src/lib/api.ts` logguent un warning dès qu'ils reçoivent `Deprecation` ou `Warning: 299`.

## 5. Énumérations & valeurs inconnues

- Les enums de contrat (`shared/api-contracts/src/enums.ts`) sont validés côté serveur par Zod `.strict()` sur l'**input** (une valeur inconnue en requête = `VALIDATION_FAILED` 422).
- Côté **output**, les clients doivent gérer une valeur future : mapping défensif obligatoire (`default:` / switch exhaustif avec fallback), jamais d'exception sur valeur inconnue.
- Les enums monétaires (`Currency`, `BetStatus`, `WalletTransactionType`) sont considérés **stables** : une nouvelle valeur est un événement mineur annoncé dans le CHANGELOG.

## 6. Pagination, erreurs, idempotence — garanties transverses

Inchangées entre mineures (définies dans `docs/api.md §1`) :
- Erreur = `{ statusCode, code, message, details, requestId }` ; les `code` métier sont stables et ne changent jamais de signification ni de HTTP status.
- Pagination curseur opaque : le format du curseur n'est **pas** contractuel (peut changer en patch).
- Mutations monétaires : header `Idempotency-Key` requis (INV-04) — ce contrat ne sera jamais retiré d'une majeure.

## 7. Processus de changement

1. PR modifiant `shared/api-contracts/src/*` → incrémente `API_SEMVER` dans `version.ts` et ajoute une entrée `CHANGELOG.md` (`Added/Changed/Deprecated/Removed`, étiquetée Breaking si majeure).
2. CI : job `contracts-diff` compare le schéma Zod exporté vs la dernière release taguée ; **toute suppression/renommage/change de type échoue la CI** sauf si le PR porte le label `major-bump`.
3. `major-bump` exige : RFC de migration approuvée, page `docs/migrations/vN-to-vN+1.md`, plan de rollout client (stores mobiles = goulôt, cf. fenêtre §3).
4. Release tag : `api-v1.4.0` (majeure+mineure), générée automatiquement depuis `version.ts`.

## 8. Versionnage interne (non public)

| Surface | Règle |
|---|---|
| Webhooks entrants (Stripe/Flutterwave/GameServer) | Pinning provider côté backend ; payload GameServer inclut `protocolVersion` validé ; breaking game-server → nouvelle route `/webhooks/gameserver/v2` |
| Protocole RaceNet (WS `/ws/v1/race`) | Handshake negotiate `minProtocol/maxProtocol` ; mismatch → close code 4406 + message d'update forcé (clients Unity) |
| Événements outbox/jobs | Schéma interne versionné par champ `v`, migrations de données au déploiement |

## 9. Checklist de release mineure

- [ ] `API_SEMVER` incrémenté (mineure) + CHANGELOG rempli
- [ ] Aucun test e2e de contrat v1 cassé (`backend/test/invariants.e2e-spec.ts` vert)
- [ ] Champs ajoutés optionnels côté input, tolérés côté client Unity (`[JsonExtensionData]` vérifié)
- [ ] Dashboards observabilité : pas de nouvelle cardinalité interdite (`docs/observability.md §1.3`)
- [ ] Si dépréciation : headers actifs + annonce communauté + date sunset figée
