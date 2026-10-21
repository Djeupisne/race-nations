/**
 * Race Nations — Version du contrat d'API partagée.
 *
 * Règles (docs/api-versioning.md) :
 *  - API_MAJOR est aligné sur le préfixe de route (/api/v1).
 *  - Toute modification de shared/api-contracts incrmente AU MOINS la mineure.
 *  - Un breaking change exige API_MAJOR + 1 et le label PR `major-bump`.
 *  - CI (`contracts-diff`) refuse suppressions/renommages/types changés sans major-bump.
 */

export const API_MAJOR = 1 as const;
export const API_MINOR = 0 as const;
export const API_PATCH = 0 as const;

/** Version sémantique complète du contrat, ex. "1.0.0". */
export const API_SEMVER = `${API_MAJOR}.${API_MINOR}.${API_PATCH}` as const;

/** Préfixe de route HTTP dérivé de la majeure, ex. "/api/v1". */
export const API_PREFIX = `/api/v${API_MAJOR}` as const;

/** Préfixe WebSocket, ex. "/ws/v1". */
export const WS_PREFIX = `/ws/v${API_MAJOR}` as const;

/**
 * Version du protocole RaceNet (game server ↔ backend/client).
 * Négociée au handshake WS (minProtocol/maxProtocol), cf. docs/api-versioning.md §8.
 */
export const RACENET_PROTOCOL_VERSION = 1 as const;

/** Version du schéma des payloads webhook game-server. */
export const GAMESERVER_WEBHOOK_SCHEMA_VERSION = 1 as const;

/** Types littéraux exportés pour allow-listing TypeScript strict. */
export type ApiMajor = typeof API_MAJOR;
export type RacenetProtocol = typeof RACENET_PROTOCOL_VERSION;

/** En-têtes de versionnage renvoyés par toutes les réponses API. */
export const API_HEADERS = {
  VERSION: 'X-API-Version',
  BUILD: 'X-API-Build',
  DEPRECATION: 'Deprecation',
  SUNSET: 'Sunset',
  REQUEST_ID: 'X-Request-Id',
  IDEMPOTENCY_KEY: 'Idempotency-Key',
} as const;

/** Compare deux versions sémantiques "a.b.c" ; <0 si a<b, 0 égal, >0 si a>b. */
export function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number(n));
  const pb = b.split('.').map((n) => Number(n));
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** Un client vN peut parler à un serveur vM si les majeures sont égales. */
export function isCompatible(clientMajor: number, serverMajor: number): boolean {
  return clientMajor === serverMajor;
}
