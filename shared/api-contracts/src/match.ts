/**
 * Race Nations — Contrats Match & Matchmaking (docs/api.md §4).
 * Miroir exact des modèles Prisma `Match`, `MatchPlayer`, `MatchmakingTicket`,
 * `ResultPayload` (backend/prisma/schema.prisma) et des machines d'états
 * (backend/src/common/state-machines/match.state-machine.ts, INV-22).
 *
 * Règles :
 *  - Toutes les durées sont en MILLISECONDES entières (INV-01 appliqué au temps de course).
 *  - Timestamps ISO-8601 UTC produits par Clock.now() serveur (INV-29).
 *  - Inputs `.strict()` validés par ZodValidationPipe (INV-27) ; outputs défensifs.
 */
import { z } from 'zod';
import {
  DivisionSchema,
  MatchOutcomeSchema,
  MatchStatusSchema,
  QueueModeSchema,
  TicketStatusSchema,
} from './enums';

/* --------------------------- Matchmaking ticket --------------------------- */

/** POST /matchmaking/queue — entrée en file. PL au moment du queue pris côté serveur. */
export const EnqueueInputSchema = z
  .object({
    mode: QueueModeSchema,
    /** Optionnel : piste préférée (mode PRACTICE uniquement). */
    preferredTrackId: z.string().min(1).max(64).optional(),
  })
  .strict();
export type EnqueueInput = z.infer<typeof EnqueueInputSchema>;

/** GET /matchmaking/status — état de mes tickets actifs. */
export const TicketDtoSchema = z.object({
  id: z.string().uuid(),
  playerId: z.string().uuid(),
  mode: QueueModeSchema,
  status: TicketStatusSchema,
  plAtQueue: z.number().int().nonnegative(),
  matchId: z.string().uuid().nullable(),
  requestedAt: z.string().datetime({ offset: true }),
  matchedAt: z.string().datetime({ offset: true }).nullable(),
  expiresAt: z.string().datetime({ offset: true }).nullable(),
  /** Position estimée dans la file (worker matchmaking), null si MATCHED+. */
  queuePosition: z.number().int().nonnegative().nullable(),
});
export type TicketDto = z.infer<typeof TicketDtoSchema>;

/* ------------------------------- Match ---------------------------------- */

/** Participation d'un joueur (MatchPlayer) — récompenses calculées SERVEUR (INV-32). */
export const MatchPlayerDtoSchema = z.object({
  playerId: z.string().uuid(),
  username: z.string(),
  nationality: z.string().length(2),
  position: z.number().int().min(1).max(8).nullable(),
  outcome: MatchOutcomeSchema.nullable(),
  finishMs: z.number().int().nonnegative().nullable(),
  bestLapMs: z.number().int().nonnegative().nullable(),
  driftPoints: z.number().int().nonnegative(),
  rewards: z.object({
    credits: z.number().int().nonnegative(),
    gems: z.number().int().nonnegative(),
    xp: z.number().int().nonnegative(),
    tokens: z.number().int().nonnegative(),
  }),
  plDelta: z.number().int(), // +25 / -20 / 0 / -30 (INV-31)
  disconnectedAt: z.string().datetime({ offset: true }).nullable(),
  reconnectDeadlineAt: z.string().datetime({ offset: true }).nullable(), // +30 s (INV-17)
});
export type MatchPlayerDto = z.infer<typeof MatchPlayerDtoSchema>;

/** GET /matches/:id — vue complète d'un match. */
export const MatchDtoSchema = z.object({
  id: z.string().uuid(),
  status: MatchStatusSchema,
  mode: QueueModeSchema,
  trackId: z.string(),
  weather: z.string().nullable(),
  serverId: z.string().nullable(),
  startedAt: z.string().datetime({ offset: true }).nullable(),
  finishedAt: z.string().datetime({ offset: true }).nullable(),
  validatedAt: z.string().datetime({ offset: true }).nullable(), // gate settlement bets (INV-24)
  invalidatedReason: z.string().nullable(),
  players: z.array(MatchPlayerDtoSchema),
  betMarketIds: z.array(z.string().uuid()),
  createdAt: z.string().datetime({ offset: true }),
});
export type MatchDto = z.infer<typeof MatchDtoSchema>;

/** Vue liste allégée (GET /matches). */
export const MatchSummaryDtoSchema = z.object({
  id: z.string().uuid(),
  status: MatchStatusSchema,
  mode: QueueModeSchema,
  trackId: z.string(),
  playerCount: z.number().int().min(0).max(8),
  createdAt: z.string().datetime({ offset: true }),
});
export type MatchSummaryDto = z.infer<typeof MatchSummaryDtoSchema>;

/* ------------------------- Join / reconnect ------------------------------ */

/** POST /matches/:id/join — rejoindre un match WAITING_FOR_PLAYERS/LOADING. */
export const JoinMatchInputSchema = z
  .object({
    ticketId: z.string().uuid().optional(),
  })
  .strict();
export type JoinMatchInput = z.infer<typeof JoinMatchInputSchema>;

/** POST /matches/:id/reconnect — dans la fenêtre de 30 s sinon traité abandon (INV-17). */
export const ReconnectInputSchema = z
  .object({
    matchId: z.string().uuid(),
    /** Nonce/session WS fourni à l'entrée en course — preuve d'identité de session. */
    sessionNonce: z.string().min(16).max(128),
  })
  .strict();
export type ReconnectInput = z.infer<typeof ReconnectInputSchema>;

/* --------------------- Result payload (game-server) ---------------------- */

/**
 * Une ligne de classement dans le payload signé du game server.
 * `checkpoints` = séquence ordonnée des checkpoints franchis — longueur imposée
 * par circuit (Lomé=5, Accra=6, Lagos=7, Dakar=6, Paris=8, Tokyo=9, Abidjan=7,
 * Nairobi=7, Casablanca=8, Dubaï=9 — docs/invariants.md INV-25).
 */
export const ResultRowSchema = z
  .object({
    playerId: z.string().uuid(),
    position: z.number().int().min(1).max(8),
    finishMs: z.number().int().nonnegative(),
    bestLapMs: z.number().int().nonnegative(),
    driftPoints: z.number().int().nonnegative(),
    maxSpeedKmh: z.number().int().nonnegative(), // entier km/h — borné par catégorie véhicule (INV-25)
    perfectRace: z.boolean().default(false),
    checkpoints: z.array(z.number().int().nonnegative()).min(1).max(16),
    disconnectedMs: z.number().int().nonnegative().default(0), // cumul > 30 000 → ABANDON (INV-17)
  })
  .strict();
export type ResultRow = z.infer<typeof ResultRowSchema>;

/** Corps brut du résultat (avant signature) — hashé pour audit anti-triche. */
export const RaceResultBodySchema = z
  .object({
    matchId: z.string().uuid(),
    serverId: z.string().uuid(),
    nonce: z.string().min(16).max(128), // UNIQUE côté ResultPayload — anti-replay (INV-25)
    timestampMs: z.number().int().positive(), // horodatage serveur de jeu, fenêtre ±60 s
    rows: z.array(ResultRowSchema).min(1).max(8),
  })
  .strict();
export type RaceResultBody = z.infer<typeof RaceResultBodySchema>;

/** POST /webhooks/gameserver — enveloppe transport (signature HMAC dans les headers, INV-26). */
export const GameServerResultEnvelopeSchema = z
  .object({
    body: RaceResultBodySchema,
    /** hex HMAC-SHA256(secret, `${timestampMs}.${canonicalJson(body)}`) — re-vérifié serveur. */
    signature: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export type GameServerResultEnvelope = z.infer<typeof GameServerResultEnvelopeSchema>;

/** Réponse du pipeline de validation (INV-25) : accepté → FINISHED_VALIDATED + settlement (INV-24). */
export const ResultValidationDtoSchema = z.object({
  matchId: z.string().uuid(),
  accepted: z.boolean(),
  matchStatus: MatchStatusSchema,
  invalidReason: z.string().nullable(),
  settlementQueued: z.boolean(), // true si bets liés mis en outbox (INV-24)
});
export type ResultValidationDto = z.infer<typeof ResultValidationDtoSchema>;

/* ----------------------------- Leaderboards ------------------------------ */

export const LeaderboardScopeSchema = z.enum(['world', 'country', 'division', 'clan', 'vehicle', 'season']);
export type LeaderboardScope = z.infer<typeof LeaderboardScopeSchema>;

export const LeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  playerId: z.string().uuid(),
  username: z.string(),
  nationality: z.string().length(2),
  division: DivisionSchema,
  plPoints: z.number().int().nonnegative(),
  metric: z.number().int(), // valeur ordonnée selon scope (PL, pts drift, records…)
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
