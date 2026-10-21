import { z } from 'zod';
export declare const ManualSettleSchema: z.ZodObject<{
    winningSide: z.ZodOptional<z.ZodNumber>;
    push: z.ZodOptional<z.ZodBoolean>;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
    push?: boolean | undefined;
    winningSide?: number | undefined;
}, {
    reason: string;
    push?: boolean | undefined;
    winningSide?: number | undefined;
}>;
export type ManualSettleDto = z.infer<typeof ManualSettleSchema>;
export declare const OpenDisputeSchema: z.ZodObject<{
    reason: z.ZodEnum<["CHEAT_SUSPECTED", "RESULT_MISMATCH", "DISCONNECT_DISPUTE", "SERVER_FAULT", "OTHER"]>;
}, "strip", z.ZodTypeAny, {
    reason: "CHEAT_SUSPECTED" | "RESULT_MISMATCH" | "DISCONNECT_DISPUTE" | "SERVER_FAULT" | "OTHER";
}, {
    reason: "CHEAT_SUSPECTED" | "RESULT_MISMATCH" | "DISCONNECT_DISPUTE" | "SERVER_FAULT" | "OTHER";
}>;
export declare const ResolveDisputeSchema: z.ZodObject<{
    outcome: z.ZodEnum<["REFUND_ALL", "UPHELD"]>;
    note: z.ZodString;
}, "strip", z.ZodTypeAny, {
    outcome: "UPHELD" | "REFUND_ALL";
    note: string;
}, {
    outcome: "UPHELD" | "REFUND_ALL";
    note: string;
}>;
export declare const HouseReverseSchema: z.ZodObject<{
    originalTxId: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
    originalTxId: string;
}, {
    reason: string;
    originalTxId: string;
}>;
