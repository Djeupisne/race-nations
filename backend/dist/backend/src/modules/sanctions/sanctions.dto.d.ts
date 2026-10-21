import { z } from 'zod';
export declare const SanctionTypeSchema: z.ZodEnum<["WARN", "CHAT_MUTE", "BET_RESTRICTION", "TEMP_BAN_7D", "PERM_BAN", "REWARD_CLAWBACK"]>;
export declare const IssueSanctionSchema: z.ZodObject<{
    playerId: z.ZodString;
    type: z.ZodEnum<["WARN", "CHAT_MUTE", "BET_RESTRICTION", "TEMP_BAN_7D", "PERM_BAN", "REWARD_CLAWBACK"]>;
    reason: z.ZodString;
    evidenceRef: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "WARN" | "CHAT_MUTE" | "BET_RESTRICTION" | "TEMP_BAN_7D" | "PERM_BAN" | "REWARD_CLAWBACK";
    playerId: string;
    reason: string;
    evidenceRef?: string | undefined;
}, {
    type: "WARN" | "CHAT_MUTE" | "BET_RESTRICTION" | "TEMP_BAN_7D" | "PERM_BAN" | "REWARD_CLAWBACK";
    playerId: string;
    reason: string;
    evidenceRef?: string | undefined;
}>;
export type IssueSanctionDto = z.infer<typeof IssueSanctionSchema>;
export declare const AppealSanctionSchema: z.ZodObject<{
    note: z.ZodString;
}, "strip", z.ZodTypeAny, {
    note: string;
}, {
    note: string;
}>;
export declare const DecideAppealSchema: z.ZodObject<{
    decision: z.ZodEnum<["UPHELD", "LIFTED"]>;
}, "strip", z.ZodTypeAny, {
    decision: "LIFTED" | "UPHELD";
}, {
    decision: "LIFTED" | "UPHELD";
}>;
