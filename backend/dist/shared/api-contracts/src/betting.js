"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseReverseInputSchema = exports.HouseBalanceDtoSchema = exports.BetSettlementDtoSchema = exports.MyBetSchema = exports.MarketOddsDtoSchema = exports.MarketOddsSideSchema = exports.BetMarketDtoSchema = exports.MarketPoolSchema = exports.BetDtoSchema = exports.ListMarketsQuerySchema = exports.ManualSettleInputSchema = exports.OpenDisputeInputSchema = exports.AcceptChallengeInputSchema = exports.CreateMarketInputSchema = exports.BET_BOUNDS = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
exports.BET_BOUNDS = {
    SOFT_MIN: 10,
    SOFT_MAX: 10_000,
    HARD_MIN_CENTS: 100,
    HARD_MAX_CENTS: 10_000,
    TOURNAMENT_MIN: 50,
    TOURNAMENT_MAX: 50_000,
    HOUSE_EDGE_BPS: 500,
};
exports.CreateMarketInputSchema = zod_1.z
    .object({
    stake: zod_1.z.number().int().positive(),
    currency: enums_1.CurrencySchema,
    trackId: zod_1.z.string().min(1).max(64),
    vehicleId: zod_1.z.string().min(1).max(64).optional(),
    opponentUsername: zod_1.z.string().min(3).max(20).optional(),
})
    .strict();
exports.AcceptChallengeInputSchema = zod_1.z
    .object({
    stake: zod_1.z.number().int().positive(),
})
    .strict();
exports.OpenDisputeInputSchema = zod_1.z
    .object({
    reason: enums_1.DisputeReasonSchema,
    note: zod_1.z.string().max(2_000).optional(),
})
    .strict();
exports.ManualSettleInputSchema = zod_1.z
    .object({
    winningBetIds: zod_1.z.array(zod_1.z.string().uuid()).max(8),
    cheatReversal: zod_1.z.boolean().default(false),
    reason: zod_1.z.string().min(3).max(500),
})
    .strict();
exports.ListMarketsQuerySchema = zod_1.z
    .object({
    currency: enums_1.CurrencySchema.optional(),
    trackId: zod_1.z.string().max(64).optional(),
    status: enums_1.BetMarketStatusSchema.optional(),
    minStake: zod_1.z.number().int().nonnegative().optional(),
    maxStake: zod_1.z.number().int().positive().optional(),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
    cursor: zod_1.z.string().optional(),
})
    .strict();
exports.BetDtoSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    marketId: zod_1.z.string().uuid(),
    playerId: zod_1.z.string().uuid(),
    username: zod_1.z.string(),
    side: zod_1.z.number().int().min(0).max(7),
    stake: zod_1.z.number().int().positive(),
    status: enums_1.BetStatusSchema,
    result: enums_1.BetResultSchema.nullable(),
    payout: zod_1.z.number().int().nonnegative(),
    escrowTxId: zod_1.z.string().uuid().nullable(),
    createdAt: zod_1.z.string().datetime({ offset: true }),
});
exports.MarketPoolSchema = zod_1.z.object({
    totalPool: zod_1.z.number().int().nonnegative(),
    houseCutEstimate: zod_1.z.number().int().nonnegative(),
    netPool: zod_1.z.number().int().nonnegative(),
});
exports.BetMarketDtoSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    creatorId: zod_1.z.string().uuid(),
    opponentId: zod_1.z.string().uuid().nullable(),
    matchId: zod_1.z.string().uuid().nullable(),
    tournamentRef: zod_1.z.string().nullable(),
    currency: enums_1.CurrencySchema,
    stake: zod_1.z.number().int().positive(),
    status: enums_1.BetMarketStatusSchema,
    public: zod_1.z.boolean(),
    trackId: zod_1.z.string(),
    vehicleId: zod_1.z.string().nullable(),
    houseEdgeBps: zod_1.z.number().int().min(0).max(1_000),
    pool: exports.MarketPoolSchema,
    disputedAt: zod_1.z.string().datetime({ offset: true }).nullable(),
    disputeReason: enums_1.DisputeReasonSchema.nullable(),
    bets: zod_1.z.array(exports.BetDtoSchema),
    settledAt: zod_1.z.string().datetime({ offset: true }).nullable(),
    createdAt: zod_1.z.string().datetime({ offset: true }),
});
exports.MarketOddsSideSchema = zod_1.z.object({
    side: zod_1.z.number().int().min(0).max(7),
    wageredTotal: zod_1.z.number().int().nonnegative(),
    players: zod_1.z.number().int().nonnegative(),
    impliedPayoutMultiplierFloor: zod_1.z.number().int().nonnegative(),
});
exports.MarketOddsDtoSchema = zod_1.z.object({
    marketId: zod_1.z.string().uuid(),
    pool: exports.MarketPoolSchema,
    sides: zod_1.z.array(exports.MarketOddsSideSchema),
    computedAt: zod_1.z.string().datetime({ offset: true }),
});
exports.MyBetSchema = zod_1.z.object({
    bet: exports.BetDtoSchema,
    market: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        status: enums_1.BetMarketStatusSchema,
        currency: enums_1.CurrencySchema,
        trackId: zod_1.z.string(),
    }),
});
exports.BetSettlementDtoSchema = zod_1.z.object({
    marketId: zod_1.z.string().uuid(),
    totalPool: zod_1.z.number().int().nonnegative(),
    houseCut: zod_1.z.number().int().nonnegative(),
    netPool: zod_1.z.number().int().nonnegative(),
    payouts: zod_1.z.record(zod_1.z.string().uuid(), zod_1.z.number().int().nonnegative()),
    residual: zod_1.z.number().int().nonnegative(),
    settledBy: zod_1.z.string().nullable(),
    settledAt: zod_1.z.string().datetime({ offset: true }),
});
exports.HouseBalanceDtoSchema = zod_1.z.object({
    balanceCents: zod_1.z.number().int().nonnegative(),
    escrowOutstanding: zod_1.z.number().int().nonnegative(),
    cumulativeFees: zod_1.z.number().int().nonnegative(),
    pnlToday: zod_1.z.number().int(),
});
exports.HouseReverseInputSchema = zod_1.z
    .object({
    marketId: zod_1.z.string().uuid(),
    reason: zod_1.z.string().min(3).max(500),
})
    .strict();
//# sourceMappingURL=betting.js.map