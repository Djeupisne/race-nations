"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardEntrySchema = exports.LeaderboardScopeSchema = exports.ResultValidationDtoSchema = exports.GameServerResultEnvelopeSchema = exports.RaceResultBodySchema = exports.ResultRowSchema = exports.ReconnectInputSchema = exports.JoinMatchInputSchema = exports.MatchSummaryDtoSchema = exports.MatchDtoSchema = exports.MatchPlayerDtoSchema = exports.TicketDtoSchema = exports.EnqueueInputSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
exports.EnqueueInputSchema = zod_1.z
    .object({
    mode: enums_1.QueueModeSchema,
    preferredTrackId: zod_1.z.string().min(1).max(64).optional(),
})
    .strict();
exports.TicketDtoSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    playerId: zod_1.z.string().uuid(),
    mode: enums_1.QueueModeSchema,
    status: enums_1.TicketStatusSchema,
    plAtQueue: zod_1.z.number().int().nonnegative(),
    matchId: zod_1.z.string().uuid().nullable(),
    requestedAt: zod_1.z.string().datetime({ offset: true }),
    matchedAt: zod_1.z.string().datetime({ offset: true }).nullable(),
    expiresAt: zod_1.z.string().datetime({ offset: true }).nullable(),
    queuePosition: zod_1.z.number().int().nonnegative().nullable(),
});
exports.MatchPlayerDtoSchema = zod_1.z.object({
    playerId: zod_1.z.string().uuid(),
    username: zod_1.z.string(),
    nationality: zod_1.z.string().length(2),
    position: zod_1.z.number().int().min(1).max(8).nullable(),
    outcome: enums_1.MatchOutcomeSchema.nullable(),
    finishMs: zod_1.z.number().int().nonnegative().nullable(),
    bestLapMs: zod_1.z.number().int().nonnegative().nullable(),
    driftPoints: zod_1.z.number().int().nonnegative(),
    rewards: zod_1.z.object({
        credits: zod_1.z.number().int().nonnegative(),
        gems: zod_1.z.number().int().nonnegative(),
        xp: zod_1.z.number().int().nonnegative(),
        tokens: zod_1.z.number().int().nonnegative(),
    }),
    plDelta: zod_1.z.number().int(),
    disconnectedAt: zod_1.z.string().datetime({ offset: true }).nullable(),
    reconnectDeadlineAt: zod_1.z.string().datetime({ offset: true }).nullable(),
});
exports.MatchDtoSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    status: enums_1.MatchStatusSchema,
    mode: enums_1.QueueModeSchema,
    trackId: zod_1.z.string(),
    weather: zod_1.z.string().nullable(),
    serverId: zod_1.z.string().nullable(),
    startedAt: zod_1.z.string().datetime({ offset: true }).nullable(),
    finishedAt: zod_1.z.string().datetime({ offset: true }).nullable(),
    validatedAt: zod_1.z.string().datetime({ offset: true }).nullable(),
    invalidatedReason: zod_1.z.string().nullable(),
    players: zod_1.z.array(exports.MatchPlayerDtoSchema),
    betMarketIds: zod_1.z.array(zod_1.z.string().uuid()),
    createdAt: zod_1.z.string().datetime({ offset: true }),
});
exports.MatchSummaryDtoSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    status: enums_1.MatchStatusSchema,
    mode: enums_1.QueueModeSchema,
    trackId: zod_1.z.string(),
    playerCount: zod_1.z.number().int().min(0).max(8),
    createdAt: zod_1.z.string().datetime({ offset: true }),
});
exports.JoinMatchInputSchema = zod_1.z
    .object({
    ticketId: zod_1.z.string().uuid().optional(),
})
    .strict();
exports.ReconnectInputSchema = zod_1.z
    .object({
    matchId: zod_1.z.string().uuid(),
    sessionNonce: zod_1.z.string().min(16).max(128),
})
    .strict();
exports.ResultRowSchema = zod_1.z
    .object({
    playerId: zod_1.z.string().uuid(),
    position: zod_1.z.number().int().min(1).max(8),
    finishMs: zod_1.z.number().int().nonnegative(),
    bestLapMs: zod_1.z.number().int().nonnegative(),
    driftPoints: zod_1.z.number().int().nonnegative(),
    maxSpeedKmh: zod_1.z.number().int().nonnegative(),
    perfectRace: zod_1.z.boolean().default(false),
    checkpoints: zod_1.z.array(zod_1.z.number().int().nonnegative()).min(1).max(16),
    disconnectedMs: zod_1.z.number().int().nonnegative().default(0),
})
    .strict();
exports.RaceResultBodySchema = zod_1.z
    .object({
    matchId: zod_1.z.string().uuid(),
    serverId: zod_1.z.string().uuid(),
    nonce: zod_1.z.string().min(16).max(128),
    timestampMs: zod_1.z.number().int().positive(),
    rows: zod_1.z.array(exports.ResultRowSchema).min(1).max(8),
})
    .strict();
exports.GameServerResultEnvelopeSchema = zod_1.z
    .object({
    body: exports.RaceResultBodySchema,
    signature: zod_1.z.string().regex(/^[a-f0-9]{64}$/),
})
    .strict();
exports.ResultValidationDtoSchema = zod_1.z.object({
    matchId: zod_1.z.string().uuid(),
    accepted: zod_1.z.boolean(),
    matchStatus: enums_1.MatchStatusSchema,
    invalidReason: zod_1.z.string().nullable(),
    settlementQueued: zod_1.z.boolean(),
});
exports.LeaderboardScopeSchema = zod_1.z.enum(['world', 'country', 'division', 'clan', 'vehicle', 'season']);
exports.LeaderboardEntrySchema = zod_1.z.object({
    rank: zod_1.z.number().int().positive(),
    playerId: zod_1.z.string().uuid(),
    username: zod_1.z.string(),
    nationality: zod_1.z.string().length(2),
    division: enums_1.DivisionSchema,
    plPoints: zod_1.z.number().int().nonnegative(),
    metric: zod_1.z.number().int(),
});
//# sourceMappingURL=match.js.map