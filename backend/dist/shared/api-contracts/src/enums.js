"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageRequestSchema = exports.ApiErrorSchema = exports.ErrorCodeSchema = exports.CountryCodeSchema = exports.DivisionSchema = exports.SanctionTypeSchema = exports.SanctionStatusSchema = exports.DisputeReasonSchema = exports.BetResultSchema = exports.BetMarketStatusSchema = exports.BetStatusSchema = exports.PaymentProviderSchema = exports.PaymentStatusSchema = exports.GameServerStatusSchema = exports.MatchOutcomeSchema = exports.MatchStatusSchema = exports.QueueModeSchema = exports.TicketStatusSchema = exports.OwnerTypeSchema = exports.UserRoleSchema = exports.WalletTransactionTypeSchema = exports.BalancesSchema = exports.CurrencySchema = void 0;
exports.divisionFromPl = divisionFromPl;
exports.pageResponseSchema = pageResponseSchema;
const zod_1 = require("zod");
exports.CurrencySchema = zod_1.z.enum(['SOFT', 'HARD']);
exports.BalancesSchema = zod_1.z.object({
    credits: zod_1.z.number().int().nonnegative(),
    gems: zod_1.z.number().int().nonnegative(),
    tokens: zod_1.z.number().int().nonnegative(),
    hardCents: zod_1.z.number().int().nonnegative(),
});
exports.WalletTransactionTypeSchema = zod_1.z.enum([
    'DEPOSIT',
    'PURCHASE',
    'REWARD',
    'BET_ESCROW',
    'BET_PAYOUT',
    'BET_REFUND',
    'HOUSE_FEE',
    'HOUSE_REVERSAL',
    'REVERSAL',
    'ADMIN_ADJUSTMENT',
]);
exports.UserRoleSchema = zod_1.z.enum(['PLAYER', 'MODERATOR', 'ADMIN', 'SYSTEM']);
exports.OwnerTypeSchema = zod_1.z.enum(['PLAYER', 'HOUSE', 'SYSTEM']);
exports.TicketStatusSchema = zod_1.z.enum([
    'QUEUED', 'MATCHED', 'JOINED', 'COMPLETED', 'CANCELLED', 'EXPIRED',
]);
exports.QueueModeSchema = zod_1.z.enum([
    'RANKED_1V1', 'RANKED_FFA', 'QUICK_RACE', 'BATTLE_ROYALE', 'TOURNAMENT', 'CLAN_WARS', 'PRACTICE',
]);
exports.MatchStatusSchema = zod_1.z.enum([
    'WAITING_FOR_PLAYERS', 'LOADING', 'IN_PROGRESS', 'FINISHED', 'FINISHED_VALIDATED', 'INVALIDATED',
]);
exports.MatchOutcomeSchema = zod_1.z.enum(['VICTORY', 'DEFEAT', 'DRAW', 'ABANDON', 'DISQUALIFIED']);
exports.GameServerStatusSchema = zod_1.z.enum(['REGISTERED', 'RESERVED', 'DRAINING', 'OFFLINE']);
exports.PaymentStatusSchema = zod_1.z.enum([
    'CREATED', 'PROVIDER_PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED',
]);
exports.PaymentProviderSchema = zod_1.z.enum(['STRIPE', 'FLUTTERWAVE', 'GOOGLE_PLAY', 'APPLE_IAP', 'HUAWEI_IAP']);
exports.BetStatusSchema = zod_1.z.enum([
    'PENDING', 'ACCEPTED', 'ESCROWED', 'RUNNING', 'WON', 'LOST', 'PUSH', 'REFUNDED', 'VOIDED',
]);
exports.BetMarketStatusSchema = zod_1.z.enum([
    'OPEN', 'CHALLENGED', 'LOCKED', 'RUNNING', 'SETTLING', 'SETTLED', 'DISPUTED', 'CANCELLED',
]);
exports.BetResultSchema = zod_1.z.enum(['WIN', 'LOSS', 'PUSH', 'REFUND', 'VOID', 'CHEAT_REVERSAL']);
exports.DisputeReasonSchema = zod_1.z.enum([
    'CHEAT_SUSPECTED', 'RESULT_MISMATCH', 'DISCONNECT_DISPUTE', 'SERVER_FAULT', 'OTHER',
]);
exports.SanctionStatusSchema = zod_1.z.enum(['ISSUED', 'ACTIVE', 'APPEALED', 'LIFTED', 'UPHELD']);
exports.SanctionTypeSchema = zod_1.z.enum([
    'WARN', 'CHAT_MUTE', 'BET_RESTRICTION', 'TEMP_BAN_7D', 'PERM_BAN', 'REWARD_CLAWBACK',
]);
exports.DivisionSchema = zod_1.z.enum(['BRONZE', 'ARGENT', 'OR', 'PLATINE', 'DIAMANT', 'MAITRE', 'LEGEND']);
const DIVISION_THRESHOLDS = [
    { division: 'LEGEND', minPl: 3000 },
    { division: 'MAITRE', minPl: 2500 },
    { division: 'DIAMANT', minPl: 2000 },
    { division: 'PLATINE', minPl: 1500 },
    { division: 'OR', minPl: 1000 },
    { division: 'ARGENT', minPl: 500 },
    { division: 'BRONZE', minPl: 0 },
];
function divisionFromPl(plPoints) {
    const p = Math.max(0, Math.floor(plPoints));
    for (const t of DIVISION_THRESHOLDS)
        if (p >= t.minPl)
            return t.division;
    return 'BRONZE';
}
exports.CountryCodeSchema = zod_1.z
    .string()
    .length(2)
    .regex(/^[A-Z]{2}$/);
exports.ErrorCodeSchema = zod_1.z.enum([
    'VALIDATION_FAILED',
    'AUTH_UNAUTHENTICATED', 'TOKEN_EXPIRED', 'REFRESH_REUSED',
    'FORBIDDEN_ADMIN', 'AGE_VERIFICATION_REQUIRED', 'REPUTATION_TOO_LOW', 'JURISDICTION_BLOCKED',
    'INSUFFICIENT_FUNDS', 'IDEMPOTENCY_CONFLICT', 'INVALID_STATE_TRANSITION', 'BET_ALREADY_SETTLED',
    'BET_STAKE_MISMATCH', 'BET_STAKE_OUT_OF_RANGE', 'BET_DAILY_LIMIT_EXCEEDED',
    'RATE_LIMITED', 'NOT_FOUND', 'API_VERSION_RETIRED',
    'INTERNAL', 'SERVER_UNAVAILABLE',
]);
exports.ApiErrorSchema = zod_1.z.object({
    statusCode: zod_1.z.number().int(),
    code: exports.ErrorCodeSchema,
    message: zod_1.z.string(),
    details: zod_1.z.record(zod_1.z.unknown()).optional(),
    requestId: zod_1.z.string(),
});
exports.PageRequestSchema = zod_1.z.object({
    limit: zod_1.z.number().int().min(1).max(100).default(20),
    cursor: zod_1.z.string().optional(),
});
function pageResponseSchema(item) {
    return zod_1.z.object({ items: zod_1.z.array(item), nextCursor: zod_1.z.string().nullable() });
}
//# sourceMappingURL=enums.js.map