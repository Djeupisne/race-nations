"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualSettleSchema = exports.ListMarketsQuerySchema = exports.ResolveDisputeSchema = exports.OpenDisputeSchema = exports.CancelMarketSchema = exports.PlaceBetSchema = exports.CreateMarketSchema = void 0;
const zod_1 = require("zod");
const PositiveInt = zod_1.z.number().int().positive();
exports.CreateMarketSchema = zod_1.z
    .object({
    currency: zod_1.z.enum(['CREDITS', 'GEMS', 'TOKENS', 'HARD_CENTS']),
    stake: PositiveInt,
    trackId: zod_1.z.string().uuid(),
    vehicleId: zod_1.z.string().uuid().optional(),
    opponentId: zod_1.z.string().uuid().optional(),
    public: zod_1.z.boolean().default(true),
    tournamentRef: zod_1.z.string().max(64).optional(),
})
    .strict();
exports.PlaceBetSchema = zod_1.z
    .object({
    marketId: zod_1.z.string().uuid(),
    side: zod_1.z.union([zod_1.z.literal(0), zod_1.z.literal(1)]),
})
    .strict();
exports.CancelMarketSchema = zod_1.z
    .object({
    reason: zod_1.z.enum(['NO_OPPONENT', 'RULES_VIOLATION', 'ADMIN', 'TEST']).default('ADMIN'),
})
    .strict();
exports.OpenDisputeSchema = zod_1.z
    .object({
    reason: zod_1.z.enum(['RESULT_MISMATCH', 'SERVER_GONE', 'PLAYER_CONDUCT', 'OTHER']),
    details: zod_1.z.string().min(1).max(2000),
})
    .strict();
exports.ResolveDisputeSchema = zod_1.z
    .object({
    outcome: zod_1.z.enum(['SETTLE_AS_RESULT', 'REFUND_ALL', 'PARTIAL_SETTLE']),
    winningSide: zod_1.z.union([zod_1.z.literal(0), zod_1.z.literal(1)]).optional(),
    note: zod_1.z.string().min(3).max(2000),
})
    .strict();
exports.ListMarketsQuerySchema = zod_1.z
    .object({
    status: zod_1.z.enum(['OPEN', 'LOCKED', 'RUNNING', 'DISPUTED', 'SETTLED', 'CANCELLED']).optional(),
    currency: zod_1.z.enum(['CREDITS', 'GEMS', 'TOKENS', 'HARD_CENTS']).optional(),
    trackId: zod_1.z.string().uuid().optional(),
    cursor: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
})
    .strict();
exports.ManualSettleSchema = zod_1.z
    .object({
    marketId: zod_1.z.string().uuid(),
    winningSide: zod_1.z.union([zod_1.z.literal(0), zod_1.z.literal(1)]).optional(),
    note: zod_1.z.string().min(3).max(2000),
})
    .strict();
//# sourceMappingURL=betting.dto.js.map