import { z } from 'zod';
export declare const CurrencySchema: z.ZodEnum<["SOFT", "HARD"]>;
export type Currency = z.infer<typeof CurrencySchema>;
export declare const BalancesSchema: z.ZodObject<{
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
export type Balances = z.infer<typeof BalancesSchema>;
export declare const WalletTransactionTypeSchema: z.ZodEnum<["DEPOSIT", "PURCHASE", "REWARD", "BET_ESCROW", "BET_PAYOUT", "BET_REFUND", "HOUSE_FEE", "HOUSE_REVERSAL", "REVERSAL", "ADMIN_ADJUSTMENT"]>;
export type WalletTransactionType = z.infer<typeof WalletTransactionTypeSchema>;
export declare const UserRoleSchema: z.ZodEnum<["PLAYER", "MODERATOR", "ADMIN", "SYSTEM"]>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export declare const OwnerTypeSchema: z.ZodEnum<["PLAYER", "HOUSE", "SYSTEM"]>;
export type OwnerType = z.infer<typeof OwnerTypeSchema>;
export declare const TicketStatusSchema: z.ZodEnum<["QUEUED", "MATCHED", "JOINED", "COMPLETED", "CANCELLED", "EXPIRED"]>;
export type TicketStatus = z.infer<typeof TicketStatusSchema>;
export declare const QueueModeSchema: z.ZodEnum<["RANKED_1V1", "RANKED_FFA", "QUICK_RACE", "BATTLE_ROYALE", "TOURNAMENT", "CLAN_WARS", "PRACTICE"]>;
export type QueueMode = z.infer<typeof QueueModeSchema>;
export declare const MatchStatusSchema: z.ZodEnum<["WAITING_FOR_PLAYERS", "LOADING", "IN_PROGRESS", "FINISHED", "FINISHED_VALIDATED", "INVALIDATED"]>;
export type MatchStatus = z.infer<typeof MatchStatusSchema>;
export declare const MatchOutcomeSchema: z.ZodEnum<["VICTORY", "DEFEAT", "DRAW", "ABANDON", "DISQUALIFIED"]>;
export type MatchOutcome = z.infer<typeof MatchOutcomeSchema>;
export declare const GameServerStatusSchema: z.ZodEnum<["REGISTERED", "RESERVED", "DRAINING", "OFFLINE"]>;
export type GameServerStatus = z.infer<typeof GameServerStatusSchema>;
export declare const PaymentStatusSchema: z.ZodEnum<["CREATED", "PROVIDER_PENDING", "SUCCEEDED", "FAILED", "CANCELLED"]>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export declare const PaymentProviderSchema: z.ZodEnum<["STRIPE", "FLUTTERWAVE", "GOOGLE_PLAY", "APPLE_IAP", "HUAWEI_IAP"]>;
export type PaymentProvider = z.infer<typeof PaymentProviderSchema>;
export declare const BetStatusSchema: z.ZodEnum<["PENDING", "ACCEPTED", "ESCROWED", "RUNNING", "WON", "LOST", "PUSH", "REFUNDED", "VOIDED"]>;
export type BetStatus = z.infer<typeof BetStatusSchema>;
export declare const BetMarketStatusSchema: z.ZodEnum<["OPEN", "CHALLENGED", "LOCKED", "RUNNING", "SETTLING", "SETTLED", "DISPUTED", "CANCELLED"]>;
export type BetMarketStatus = z.infer<typeof BetMarketStatusSchema>;
export declare const BetResultSchema: z.ZodEnum<["WIN", "LOSS", "PUSH", "REFUND", "VOID", "CHEAT_REVERSAL"]>;
export type BetResult = z.infer<typeof BetResultSchema>;
export declare const DisputeReasonSchema: z.ZodEnum<["CHEAT_SUSPECTED", "RESULT_MISMATCH", "DISCONNECT_DISPUTE", "SERVER_FAULT", "OTHER"]>;
export type DisputeReason = z.infer<typeof DisputeReasonSchema>;
export declare const SanctionStatusSchema: z.ZodEnum<["ISSUED", "ACTIVE", "APPEALED", "LIFTED", "UPHELD"]>;
export type SanctionStatus = z.infer<typeof SanctionStatusSchema>;
export declare const SanctionTypeSchema: z.ZodEnum<["WARN", "CHAT_MUTE", "BET_RESTRICTION", "TEMP_BAN_7D", "PERM_BAN", "REWARD_CLAWBACK"]>;
export type SanctionType = z.infer<typeof SanctionTypeSchema>;
export declare const DivisionSchema: z.ZodEnum<["BRONZE", "ARGENT", "OR", "PLATINE", "DIAMANT", "MAITRE", "LEGEND"]>;
export type Division = z.infer<typeof DivisionSchema>;
export declare function divisionFromPl(plPoints: number): Division;
export declare const CountryCodeSchema: z.ZodString;
export type CountryCode = z.infer<typeof CountryCodeSchema>;
export declare const ErrorCodeSchema: z.ZodEnum<["VALIDATION_FAILED", "AUTH_UNAUTHENTICATED", "TOKEN_EXPIRED", "REFRESH_REUSED", "FORBIDDEN_ADMIN", "AGE_VERIFICATION_REQUIRED", "REPUTATION_TOO_LOW", "JURISDICTION_BLOCKED", "INSUFFICIENT_FUNDS", "IDEMPOTENCY_CONFLICT", "INVALID_STATE_TRANSITION", "BET_ALREADY_SETTLED", "BET_STAKE_MISMATCH", "BET_STAKE_OUT_OF_RANGE", "BET_DAILY_LIMIT_EXCEEDED", "RATE_LIMITED", "NOT_FOUND", "API_VERSION_RETIRED", "INTERNAL", "SERVER_UNAVAILABLE"]>;
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
export declare const ApiErrorSchema: z.ZodObject<{
    statusCode: z.ZodNumber;
    code: z.ZodEnum<["VALIDATION_FAILED", "AUTH_UNAUTHENTICATED", "TOKEN_EXPIRED", "REFRESH_REUSED", "FORBIDDEN_ADMIN", "AGE_VERIFICATION_REQUIRED", "REPUTATION_TOO_LOW", "JURISDICTION_BLOCKED", "INSUFFICIENT_FUNDS", "IDEMPOTENCY_CONFLICT", "INVALID_STATE_TRANSITION", "BET_ALREADY_SETTLED", "BET_STAKE_MISMATCH", "BET_STAKE_OUT_OF_RANGE", "BET_DAILY_LIMIT_EXCEEDED", "RATE_LIMITED", "NOT_FOUND", "API_VERSION_RETIRED", "INTERNAL", "SERVER_UNAVAILABLE"]>;
    message: z.ZodString;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    requestId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: "VALIDATION_FAILED" | "AUTH_UNAUTHENTICATED" | "TOKEN_EXPIRED" | "REFRESH_REUSED" | "FORBIDDEN_ADMIN" | "AGE_VERIFICATION_REQUIRED" | "REPUTATION_TOO_LOW" | "JURISDICTION_BLOCKED" | "INSUFFICIENT_FUNDS" | "IDEMPOTENCY_CONFLICT" | "INVALID_STATE_TRANSITION" | "BET_ALREADY_SETTLED" | "BET_STAKE_MISMATCH" | "BET_STAKE_OUT_OF_RANGE" | "BET_DAILY_LIMIT_EXCEEDED" | "RATE_LIMITED" | "NOT_FOUND" | "API_VERSION_RETIRED" | "INTERNAL" | "SERVER_UNAVAILABLE";
    message: string;
    statusCode: number;
    requestId: string;
    details?: Record<string, unknown> | undefined;
}, {
    code: "VALIDATION_FAILED" | "AUTH_UNAUTHENTICATED" | "TOKEN_EXPIRED" | "REFRESH_REUSED" | "FORBIDDEN_ADMIN" | "AGE_VERIFICATION_REQUIRED" | "REPUTATION_TOO_LOW" | "JURISDICTION_BLOCKED" | "INSUFFICIENT_FUNDS" | "IDEMPOTENCY_CONFLICT" | "INVALID_STATE_TRANSITION" | "BET_ALREADY_SETTLED" | "BET_STAKE_MISMATCH" | "BET_STAKE_OUT_OF_RANGE" | "BET_DAILY_LIMIT_EXCEEDED" | "RATE_LIMITED" | "NOT_FOUND" | "API_VERSION_RETIRED" | "INTERNAL" | "SERVER_UNAVAILABLE";
    message: string;
    statusCode: number;
    requestId: string;
    details?: Record<string, unknown> | undefined;
}>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export declare const PageRequestSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    cursor: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    cursor?: string | undefined;
}, {
    cursor?: string | undefined;
    limit?: number | undefined;
}>;
export type PageRequest = z.infer<typeof PageRequestSchema>;
export declare function pageResponseSchema<T extends z.ZodTypeAny>(item: T): z.ZodObject<{
    items: z.ZodArray<T, "many">;
    nextCursor: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    items: T["_output"][];
    nextCursor: string | null;
}, {
    items: T["_input"][];
    nextCursor: string | null;
}>;
