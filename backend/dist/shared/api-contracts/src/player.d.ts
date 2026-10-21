import { z } from 'zod';
export declare const PlayerProfileSchema: z.ZodObject<{
    id: z.ZodString;
    username: z.ZodString;
    countryCode: z.ZodString;
    nationality: z.ZodString;
    nationalityLocked: z.ZodBoolean;
    role: z.ZodEnum<["PLAYER", "MODERATOR", "ADMIN", "SYSTEM"]>;
    level: z.ZodNumber;
    xp: z.ZodNumber;
    plPoints: z.ZodNumber;
    division: z.ZodEnum<["BRONZE", "ARGENT", "OR", "PLATINE", "DIAMANT", "MAITRE", "LEGEND"]>;
    reputation: z.ZodNumber;
    ageVerified: z.ZodBoolean;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    username: string;
    countryCode: string;
    nationality: string;
    role: "PLAYER" | "MODERATOR" | "ADMIN" | "SYSTEM";
    ageVerified: boolean;
    nationalityLocked: boolean;
    level: number;
    xp: number;
    plPoints: number;
    division: "BRONZE" | "ARGENT" | "OR" | "PLATINE" | "DIAMANT" | "MAITRE" | "LEGEND";
    reputation: number;
    createdAt: string;
}, {
    id: string;
    username: string;
    countryCode: string;
    nationality: string;
    role: "PLAYER" | "MODERATOR" | "ADMIN" | "SYSTEM";
    ageVerified: boolean;
    nationalityLocked: boolean;
    level: number;
    xp: number;
    plPoints: number;
    division: "BRONZE" | "ARGENT" | "OR" | "PLATINE" | "DIAMANT" | "MAITRE" | "LEGEND";
    reputation: number;
    createdAt: string;
}>;
export type PlayerProfile = z.infer<typeof PlayerProfileSchema>;
export declare const PublicPlayerProfileSchema: z.ZodObject<{
    id: z.ZodString;
    username: z.ZodString;
    nationality: z.ZodString;
    level: z.ZodNumber;
    plPoints: z.ZodNumber;
    division: z.ZodEnum<["BRONZE", "ARGENT", "OR", "PLATINE", "DIAMANT", "MAITRE", "LEGEND"]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    username: string;
    nationality: string;
    level: number;
    plPoints: number;
    division: "BRONZE" | "ARGENT" | "OR" | "PLATINE" | "DIAMANT" | "MAITRE" | "LEGEND";
}, {
    id: string;
    username: string;
    nationality: string;
    level: number;
    plPoints: number;
    division: "BRONZE" | "ARGENT" | "OR" | "PLATINE" | "DIAMANT" | "MAITRE" | "LEGEND";
}>;
export type PublicPlayerProfile = z.infer<typeof PublicPlayerProfileSchema>;
export declare const UpdatePlayerInputSchema: z.ZodEffects<z.ZodObject<{
    username: z.ZodOptional<z.ZodString>;
    preferredLanguage: z.ZodOptional<z.ZodEnum<["fr", "en"]>>;
    chatGlobalEnabled: z.ZodOptional<z.ZodBoolean>;
    marketingOptIn: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    username?: string | undefined;
    marketingOptIn?: boolean | undefined;
    preferredLanguage?: "fr" | "en" | undefined;
    chatGlobalEnabled?: boolean | undefined;
}, {
    username?: string | undefined;
    marketingOptIn?: boolean | undefined;
    preferredLanguage?: "fr" | "en" | undefined;
    chatGlobalEnabled?: boolean | undefined;
}>, {
    username?: string | undefined;
    marketingOptIn?: boolean | undefined;
    preferredLanguage?: "fr" | "en" | undefined;
    chatGlobalEnabled?: boolean | undefined;
}, {
    username?: string | undefined;
    marketingOptIn?: boolean | undefined;
    preferredLanguage?: "fr" | "en" | undefined;
    chatGlobalEnabled?: boolean | undefined;
}>;
export type UpdatePlayerInput = z.infer<typeof UpdatePlayerInputSchema>;
export declare const PlayerStatsSchema: z.ZodObject<{
    racesPlayed: z.ZodNumber;
    victories: z.ZodNumber;
    defeats: z.ZodNumber;
    draws: z.ZodNumber;
    abandons: z.ZodNumber;
    winStreakCurrent: z.ZodNumber;
    winStreakBest: z.ZodNumber;
    totalDriftPoints: z.ZodNumber;
    perfectRaces: z.ZodNumber;
    recordsHeld: z.ZodNumber;
    betsWon: z.ZodNumber;
    betsLost: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    racesPlayed: number;
    victories: number;
    defeats: number;
    draws: number;
    abandons: number;
    winStreakCurrent: number;
    winStreakBest: number;
    totalDriftPoints: number;
    perfectRaces: number;
    recordsHeld: number;
    betsWon: number;
    betsLost: number;
}, {
    racesPlayed: number;
    victories: number;
    defeats: number;
    draws: number;
    abandons: number;
    winStreakCurrent: number;
    winStreakBest: number;
    totalDriftPoints: number;
    perfectRaces: number;
    recordsHeld: number;
    betsWon: number;
    betsLost: number;
}>;
export type PlayerStats = z.infer<typeof PlayerStatsSchema>;
export declare const WalletBalancesSchema: z.ZodObject<{
    balances: z.ZodObject<{
        credits: z.ZodNumber;
        gems: z.ZodNumber;
        tokens: z.ZodNumber;
        hardCents: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        credits: number;
        gems: number;
        tokens: number;
        hardCents: number;
    }, {
        credits: number;
        gems: number;
        tokens: number;
        hardCents: number;
    }>;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    balances: {
        credits: number;
        gems: number;
        tokens: number;
        hardCents: number;
    };
    updatedAt: string;
}, {
    balances: {
        credits: number;
        gems: number;
        tokens: number;
        hardCents: number;
    };
    updatedAt: string;
}>;
export type WalletBalances = z.infer<typeof WalletBalancesSchema>;
export declare const BettingEligibilitySchema: z.ZodObject<{
    softAllowed: z.ZodBoolean;
    hardAllowed: z.ZodBoolean;
    reasons: z.ZodArray<z.ZodEnum<["JURISDICTION_BLOCKED", "AGE_VERIFICATION_REQUIRED", "REPUTATION_TOO_LOW", "DAILY_LIMIT_REACHED", "SANCTION_BET_RESTRICTION"]>, "many">;
    dailySoftUsedCredits: z.ZodNumber;
    dailySoftLimitCredits: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    softAllowed: boolean;
    hardAllowed: boolean;
    reasons: ("AGE_VERIFICATION_REQUIRED" | "REPUTATION_TOO_LOW" | "JURISDICTION_BLOCKED" | "DAILY_LIMIT_REACHED" | "SANCTION_BET_RESTRICTION")[];
    dailySoftUsedCredits: number;
    dailySoftLimitCredits: number;
}, {
    softAllowed: boolean;
    hardAllowed: boolean;
    reasons: ("AGE_VERIFICATION_REQUIRED" | "REPUTATION_TOO_LOW" | "JURISDICTION_BLOCKED" | "DAILY_LIMIT_REACHED" | "SANCTION_BET_RESTRICTION")[];
    dailySoftUsedCredits: number;
    dailySoftLimitCredits: number;
}>;
export type BettingEligibility = z.infer<typeof BettingEligibilitySchema>;
export declare const LeaderboardScopeSchema: z.ZodEnum<["world", "country", "division", "clan", "vehicle", "season"]>;
export type LeaderboardScope = z.infer<typeof LeaderboardScopeSchema>;
export declare const LeaderboardEntrySchema: z.ZodObject<{
    rank: z.ZodNumber;
    playerId: z.ZodString;
    username: z.ZodString;
    nationality: z.ZodString;
    plPoints: z.ZodNumber;
    division: z.ZodEnum<["BRONZE", "ARGENT", "OR", "PLATINE", "DIAMANT", "MAITRE", "LEGEND"]>;
}, "strip", z.ZodTypeAny, {
    username: string;
    nationality: string;
    plPoints: number;
    division: "BRONZE" | "ARGENT" | "OR" | "PLATINE" | "DIAMANT" | "MAITRE" | "LEGEND";
    rank: number;
    playerId: string;
}, {
    username: string;
    nationality: string;
    plPoints: number;
    division: "BRONZE" | "ARGENT" | "OR" | "PLATINE" | "DIAMANT" | "MAITRE" | "LEGEND";
    rank: number;
    playerId: string;
}>;
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
