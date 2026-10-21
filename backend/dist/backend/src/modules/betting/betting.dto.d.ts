import { z } from 'zod';
export declare const CreateMarketSchema: z.ZodObject<{
    currency: z.ZodEnum<["CREDITS", "GEMS", "TOKENS", "HARD_CENTS"]>;
    stake: z.ZodNumber;
    trackId: z.ZodString;
    vehicleId: z.ZodOptional<z.ZodString>;
    opponentId: z.ZodOptional<z.ZodString>;
    public: z.ZodDefault<z.ZodBoolean>;
    tournamentRef: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    trackId: string;
    stake: number;
    currency: "CREDITS" | "GEMS" | "TOKENS" | "HARD_CENTS";
    public: boolean;
    vehicleId?: string | undefined;
    opponentId?: string | undefined;
    tournamentRef?: string | undefined;
}, {
    trackId: string;
    stake: number;
    currency: "CREDITS" | "GEMS" | "TOKENS" | "HARD_CENTS";
    vehicleId?: string | undefined;
    opponentId?: string | undefined;
    tournamentRef?: string | undefined;
    public?: boolean | undefined;
}>;
export type CreateMarketDto = z.infer<typeof CreateMarketSchema>;
export declare const PlaceBetSchema: z.ZodObject<{
    marketId: z.ZodString;
    side: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>;
}, "strict", z.ZodTypeAny, {
    marketId: string;
    side: 0 | 1;
}, {
    marketId: string;
    side: 0 | 1;
}>;
export type PlaceBetDto = z.infer<typeof PlaceBetSchema>;
export declare const CancelMarketSchema: z.ZodObject<{
    reason: z.ZodDefault<z.ZodEnum<["NO_OPPONENT", "RULES_VIOLATION", "ADMIN", "TEST"]>>;
}, "strict", z.ZodTypeAny, {
    reason: "ADMIN" | "NO_OPPONENT" | "RULES_VIOLATION" | "TEST";
}, {
    reason?: "ADMIN" | "NO_OPPONENT" | "RULES_VIOLATION" | "TEST" | undefined;
}>;
export type CancelMarketDto = z.infer<typeof CancelMarketSchema>;
export declare const OpenDisputeSchema: z.ZodObject<{
    reason: z.ZodEnum<["RESULT_MISMATCH", "SERVER_GONE", "PLAYER_CONDUCT", "OTHER"]>;
    details: z.ZodString;
}, "strict", z.ZodTypeAny, {
    details: string;
    reason: "RESULT_MISMATCH" | "OTHER" | "SERVER_GONE" | "PLAYER_CONDUCT";
}, {
    details: string;
    reason: "RESULT_MISMATCH" | "OTHER" | "SERVER_GONE" | "PLAYER_CONDUCT";
}>;
export type OpenDisputeDto = z.infer<typeof OpenDisputeSchema>;
export declare const ResolveDisputeSchema: z.ZodObject<{
    outcome: z.ZodEnum<["SETTLE_AS_RESULT", "REFUND_ALL", "PARTIAL_SETTLE"]>;
    winningSide: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>>;
    note: z.ZodString;
}, "strict", z.ZodTypeAny, {
    outcome: "REFUND_ALL" | "SETTLE_AS_RESULT" | "PARTIAL_SETTLE";
    note: string;
    winningSide?: 0 | 1 | undefined;
}, {
    outcome: "REFUND_ALL" | "SETTLE_AS_RESULT" | "PARTIAL_SETTLE";
    note: string;
    winningSide?: 0 | 1 | undefined;
}>;
export type ResolveDisputeDto = z.infer<typeof ResolveDisputeSchema>;
export declare const ListMarketsQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["OPEN", "LOCKED", "RUNNING", "DISPUTED", "SETTLED", "CANCELLED"]>>;
    currency: z.ZodOptional<z.ZodEnum<["CREDITS", "GEMS", "TOKENS", "HARD_CENTS"]>>;
    trackId: z.ZodOptional<z.ZodString>;
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    limit: number;
    status?: "CANCELLED" | "RUNNING" | "OPEN" | "LOCKED" | "SETTLED" | "DISPUTED" | undefined;
    cursor?: string | undefined;
    trackId?: string | undefined;
    currency?: "CREDITS" | "GEMS" | "TOKENS" | "HARD_CENTS" | undefined;
}, {
    status?: "CANCELLED" | "RUNNING" | "OPEN" | "LOCKED" | "SETTLED" | "DISPUTED" | undefined;
    cursor?: string | undefined;
    limit?: number | undefined;
    trackId?: string | undefined;
    currency?: "CREDITS" | "GEMS" | "TOKENS" | "HARD_CENTS" | undefined;
}>;
export type ListMarketsQueryDto = z.infer<typeof ListMarketsQuerySchema>;
export declare const ManualSettleSchema: z.ZodObject<{
    marketId: z.ZodString;
    winningSide: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>>;
    note: z.ZodString;
}, "strict", z.ZodTypeAny, {
    note: string;
    marketId: string;
    winningSide?: 0 | 1 | undefined;
}, {
    note: string;
    marketId: string;
    winningSide?: 0 | 1 | undefined;
}>;
export type ManualSettleDto = z.infer<typeof ManualSettleSchema>;
