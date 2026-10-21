"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardEntrySchema = exports.LeaderboardScopeSchema = exports.BettingEligibilitySchema = exports.WalletBalancesSchema = exports.PlayerStatsSchema = exports.UpdatePlayerInputSchema = exports.PublicPlayerProfileSchema = exports.PlayerProfileSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
const auth_1 = require("./auth");
exports.PlayerProfileSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    username: zod_1.z.string(),
    countryCode: enums_1.CountryCodeSchema,
    nationality: enums_1.CountryCodeSchema,
    nationalityLocked: zod_1.z.boolean(),
    role: enums_1.UserRoleSchema,
    level: zod_1.z.number().int().min(1),
    xp: zod_1.z.number().int().nonnegative(),
    plPoints: zod_1.z.number().int().nonnegative(),
    division: enums_1.DivisionSchema,
    reputation: zod_1.z.number().int().min(0).max(100),
    ageVerified: zod_1.z.boolean(),
    createdAt: zod_1.z.string().datetime({ offset: true }),
});
exports.PublicPlayerProfileSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    username: zod_1.z.string(),
    nationality: enums_1.CountryCodeSchema,
    level: zod_1.z.number().int().min(1),
    plPoints: zod_1.z.number().int().nonnegative(),
    division: enums_1.DivisionSchema,
});
exports.UpdatePlayerInputSchema = zod_1.z
    .object({
    username: zod_1.z.string().regex(auth_1.USERNAME_REGEX, auth_1.USERNAME_MESSAGE).optional(),
    preferredLanguage: zod_1.z.enum(['fr', 'en']).optional(),
    chatGlobalEnabled: zod_1.z.boolean().optional(),
    marketingOptIn: zod_1.z.boolean().optional(),
})
    .strict()
    .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required.' });
exports.PlayerStatsSchema = zod_1.z.object({
    racesPlayed: zod_1.z.number().int().nonnegative(),
    victories: zod_1.z.number().int().nonnegative(),
    defeats: zod_1.z.number().int().nonnegative(),
    draws: zod_1.z.number().int().nonnegative(),
    abandons: zod_1.z.number().int().nonnegative(),
    winStreakCurrent: zod_1.z.number().int().nonnegative(),
    winStreakBest: zod_1.z.number().int().nonnegative(),
    totalDriftPoints: zod_1.z.number().int().nonnegative(),
    perfectRaces: zod_1.z.number().int().nonnegative(),
    recordsHeld: zod_1.z.number().int().nonnegative(),
    betsWon: zod_1.z.number().int().nonnegative(),
    betsLost: zod_1.z.number().int().nonnegative(),
});
exports.WalletBalancesSchema = zod_1.z.object({
    balances: enums_1.BalancesSchema,
    updatedAt: zod_1.z.string().datetime({ offset: true }),
});
exports.BettingEligibilitySchema = zod_1.z.object({
    softAllowed: zod_1.z.boolean(),
    hardAllowed: zod_1.z.boolean(),
    reasons: zod_1.z.array(zod_1.z.enum([
        'JURISDICTION_BLOCKED',
        'AGE_VERIFICATION_REQUIRED',
        'REPUTATION_TOO_LOW',
        'DAILY_LIMIT_REACHED',
        'SANCTION_BET_RESTRICTION',
    ])),
    dailySoftUsedCredits: zod_1.z.number().int().nonnegative(),
    dailySoftLimitCredits: zod_1.z.number().int().nonnegative(),
});
exports.LeaderboardScopeSchema = zod_1.z.enum(['world', 'country', 'division', 'clan', 'vehicle', 'season']);
exports.LeaderboardEntrySchema = zod_1.z.object({
    rank: zod_1.z.number().int().positive(),
    playerId: zod_1.z.string().uuid(),
    username: zod_1.z.string(),
    nationality: enums_1.CountryCodeSchema,
    plPoints: zod_1.z.number().int().nonnegative(),
    division: enums_1.DivisionSchema,
});
//# sourceMappingURL=player.js.map