/**
 * Race Nations — Énumérations contractuelles partagées (backend ↔ Unity ↔ admin-panel).
 *
 * Règles (docs/api-versioning.md §5) :
 *  - Input serveur : validé strict (valeur inconnue → VALIDATION_FAILED 422).
 *  - Output client : tout mapping doit prévoir un fallback "défensif" sur valeur future.
 *  - Les valeurs sont des SCREAMING_SNAKE_CASE string literals, stables à vie.
 *  - Les transitions d'état autorisées vivent dans backend/src/common/state-machines/
 *    (INV-22) ; ce fichier ne décrit QUE l'alphabet des états.
 */
import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Argent & wallets (INV-01..INV-07)                                   */
/* ------------------------------------------------------------------ */

/** SOFT = crédits/gemmes/tokens virtuels ; HARD = centimes réels. Jamais mélangés (INV-07). */
export const CurrencySchema = z.enum(['SOFT', 'HARD']);
export type Currency = z.infer<typeof CurrencySchema>;

/** Solde multi-devises — TOUJOURS entiers (INV-01), jamais négatifs (INV-02). */
export const BalancesSchema = z.object({
  credits: z.number().int().nonnegative(),
  gems: z.number().int().nonnegative(),
  tokens: z.number().int().nonnegative(),
  hardCents: z.number().int().nonnegative(),
});
export type Balances = z.infer<typeof BalancesSchema>;

/** Types du ledger append-only (INV-06). Une correction = REVERSAL lié, jamais UPDATE. */
export const WalletTransactionTypeSchema = z.enum([
  'DEPOSIT',            // entrée HARD (webhook paiement) ou SOFT (récompense)
  'PURCHASE',           // achat boutique / tickets
  'REWARD',             // récompenses de course (INV-32)
  'BET_ESCROW',         // mise immobilisée à l'acceptation (INV-15)
  'BET_PAYOUT',         // gain settlement (INV-08/09)
  'BET_REFUND',         // push / annulation / litige résolu (INV-16/18/19)
  'HOUSE_FEE',          // commission créditée au House Wallet (INV-13)
  'HOUSE_REVERSAL',     // contre-écriture d'une commission (INV-06)
  'REVERSAL',           // correction générique
  'ADMIN_ADJUSTMENT',   // ajustement admin tracé + audit
]);
export type WalletTransactionType = z.infer<typeof WalletTransactionTypeSchema>;

/* ------------------------------------------------------------------ */
/* Auth & rôles                                                        */
/* ------------------------------------------------------------------ */

export const UserRoleSchema = z.enum(['PLAYER', 'MODERATOR', 'ADMIN', 'SYSTEM']);
export type UserRole = z.infer<typeof UserRoleSchema>;

/** Le compte House est SYSTEM, ownerType HOUSE en base (INV-13). */
export const OwnerTypeSchema = z.enum(['PLAYER', 'HOUSE', 'SYSTEM']);
export type OwnerType = z.infer<typeof OwnerTypeSchema>;

/* ------------------------------------------------------------------ */
/* Matchmaking — machine Ticket (INV-22)                               */
/* QUEUED → MATCHED → JOINED → COMPLETED | CANCELLED | EXPIRED        */
/* ------------------------------------------------------------------ */

export const TicketStatusSchema = z.enum([
  'QUEUED', 'MATCHED', 'JOINED', 'COMPLETED', 'CANCELLED', 'EXPIRED',
]);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;

/** Modes de file, paramètres exacts du cahier des charges (docs/api.md §4). */
export const QueueModeSchema = z.enum([
  'RANKED_1V1', 'RANKED_FFA', 'QUICK_RACE', 'BATTLE_ROYALE', 'TOURNAMENT', 'CLAN_WARS', 'PRACTICE',
]);
export type QueueMode = z.infer<typeof QueueModeSchema>;

/* ------------------------------------------------------------------ */
/* Match — machine d'états (INV-22, INV-24, INV-25)                    */
/* WAITING_FOR_PLAYERS → LOADING → IN_PROGRESS → FINISHED              */
/*   → FINISHED_VALIDATED | INVALIDATED                                */
/* ------------------------------------------------------------------ */

export const MatchStatusSchema = z.enum([
  'WAITING_FOR_PLAYERS', 'LOADING', 'IN_PROGRESS', 'FINISHED', 'FINISHED_VALIDATED', 'INVALIDATED',
]);
export type MatchStatus = z.infer<typeof MatchStatusSchema>;

/** Issue classée d'un match pour un joueur (PL selon INV-31). */
export const MatchOutcomeSchema = z.enum(['VICTORY', 'DEFEAT', 'DRAW', 'ABANDON', 'DISQUALIFIED']);
export type MatchOutcome = z.infer<typeof MatchOutcomeSchema>;

/* ------------------------------------------------------------------ */
/* Game servers — REGISTERED → RESERVED → DRAINING → OFFLINE           */
/* ------------------------------------------------------------------ */

export const GameServerStatusSchema = z.enum(['REGISTERED', 'RESERVED', 'DRAINING', 'OFFLINE']);
export type GameServerStatus = z.infer<typeof GameServerStatusSchema>;

/* ------------------------------------------------------------------ */
/* Paiements — CREATED → PROVIDER_PENDING → SUCCEEDED | FAILED | CANCELLED */
/* SUCCEEDED / FAILED / CANCELLED terminaux (INV-23).                  */
/* ------------------------------------------------------------------ */

export const PaymentStatusSchema = z.enum([
  'CREATED', 'PROVIDER_PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED',
]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const PaymentProviderSchema = z.enum(['STRIPE', 'FLUTTERWAVE', 'GOOGLE_PLAY', 'APPLE_IAP', 'HUAWEI_IAP']);
export type PaymentProvider = z.infer<typeof PaymentProviderSchema>;

/* ------------------------------------------------------------------ */
/* Betting — machines Bet & BetMarket (INV-22/23)                      */
/* Bet    : PENDING → ACCEPTED → ESCROWED → RUNNING → WON | LOST | PUSH */
/*          | REFUNDED | VOIDED                                        */
/* Market : OPEN → CHALLENGED → LOCKED → SETTLING → SETTLED             */
/*          | DISPUTED | CANCELLED                                     */
/* ------------------------------------------------------------------ */

export const BetStatusSchema = z.enum([
  'PENDING', 'ACCEPTED', 'ESCROWED', 'RUNNING', 'WON', 'LOST', 'PUSH', 'REFUNDED', 'VOIDED',
]);
export type BetStatus = z.infer<typeof BetStatusSchema>;

export const BetMarketStatusSchema = z.enum([
  'OPEN', 'CHALLENGED', 'LOCKED', 'SETTLING', 'SETTLED', 'DISPUTED', 'CANCELLED',
]);
export type BetMarketStatus = z.infer<typeof BetMarketStatusSchema>;

/** Résultat d'un settlement (issue monétaire du bet). */
export const BetResultSchema = z.enum(['WIN', 'LOSS', 'PUSH', 'REFUND', 'VOID', 'CHEAT_REVERSAL']);
export type BetResult = z.infer<typeof BetResultSchema>;

/** Motif de litige (INV-18/19) posé par le joueur ou l'admin. */
export const DisputeReasonSchema = z.enum([
  'CHEAT_SUSPECTED', 'RESULT_MISMATCH', 'DISCONNECT_DISPUTE', 'SERVER_FAULT', 'OTHER',
]);
export type DisputeReason = z.infer<typeof DisputeReasonSchema>;

/* ------------------------------------------------------------------ */
/* Sanctions — ISSUED → ACTIVE → APPEALED → LIFTED | UPHELD            */
/* ------------------------------------------------------------------ */

export const SanctionStatusSchema = z.enum(['ISSUED', 'ACTIVE', 'APPEALED', 'LIFTED', 'UPHELD']);
export type SanctionStatus = z.infer<typeof SanctionStatusSchema>;

export const SanctionTypeSchema = z.enum([
  'WARN', 'CHAT_MUTE', 'BET_RESTRICTION', 'TEMP_BAN_7D', 'PERM_BAN', 'REWARD_CLAWBACK',
]);
export type SanctionType = z.infer<typeof SanctionTypeSchema>;

/* ------------------------------------------------------------------ */
/* Joueur — divisions (INV-31) & pays                                  */
/* ------------------------------------------------------------------ */

/** Seuils PL : Bronze 0‑499, Argent 500‑999, Or 1000‑1499, Platine 1500‑1999,
 *  Diamant 2000‑2499, Maître 2500‑2999, Légende 3000+. */
export const DivisionSchema = z.enum(['BRONZE', 'ARGENT', 'OR', 'PLATINE', 'DIAMANT', 'MAITRE', 'LEGEND']);
export type Division = z.infer<typeof DivisionSchema>;

const DIVISION_THRESHOLDS: ReadonlyArray<{ division: Division; minPl: number }> = [
  { division: 'LEGEND', minPl: 3000 },
  { division: 'MAITRE', minPl: 2500 },
  { division: 'DIAMANT', minPl: 2000 },
  { division: 'PLATINE', minPl: 1500 },
  { division: 'OR', minPl: 1000 },
  { division: 'ARGENT', minPl: 500 },
  { division: 'BRONZE', minPl: 0 },
];

/** Mapping PL → division, source unique (backend + UI). PL < 0 est clampé à BRONZE (cap min 0, INV-31). */
export function divisionFromPl(plPoints: number): Division {
  const p = Math.max(0, Math.floor(plPoints));
  for (const t of DIVISION_THRESHOLDS) if (p >= t.minPl) return t.division;
  return 'BRONZE';
}

/** ISO 3166-1 alpha-2 majuscules (validé serveur ; gating juridiction INV-20). */
export const CountryCodeSchema = z
  .string()
  .length(2)
  .regex(/^[A-Z]{2}$/);
export type CountryCode = z.infer<typeof CountryCodeSchema>;

/* ------------------------------------------------------------------ */
/* Codes d'erreur métier stables (docs/api.md §1.2)                    */
/* Ne jamais changer la signification ni le HTTP status associé.       */
/* ------------------------------------------------------------------ */

export const ErrorCodeSchema = z.enum([
  'VALIDATION_FAILED',
  'AUTH_UNAUTHENTICATED', 'TOKEN_EXPIRED', 'REFRESH_REUSED',
  'FORBIDDEN_ADMIN', 'AGE_VERIFICATION_REQUIRED', 'REPUTATION_TOO_LOW', 'JURISDICTION_BLOCKED',
  'INSUFFICIENT_FUNDS', 'IDEMPOTENCY_CONFLICT', 'INVALID_STATE_TRANSITION', 'BET_ALREADY_SETTLED',
  'BET_STAKE_MISMATCH', 'BET_STAKE_OUT_OF_RANGE', 'BET_DAILY_LIMIT_EXCEEDED',
  'RATE_LIMITED', 'NOT_FOUND', 'API_VERSION_RETIRED',
  'INTERNAL', 'SERVER_UNAVAILABLE',
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

/** Enveloppe d'erreur RFC-7807 simplifiée (mapping AppError). */
export const ApiErrorSchema = z.object({
  statusCode: z.number().int(),
  code: ErrorCodeSchema,
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  requestId: z.string(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

/* ------------------------------------------------------------------ */
/* Pagination (docs/api.md §1.3)                                        */
/* ------------------------------------------------------------------ */

export const PageRequestSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});
export type PageRequest = z.infer<typeof PageRequestSchema>;

export function pageResponseSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({ items: z.array(item), nextCursor: z.string().nullable() });
}
