import { z } from 'zod';
export declare const HouseTxQuerySchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    before: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    before?: Date | undefined;
}, {
    limit?: number | undefined;
    before?: Date | undefined;
}>;
export declare const HouseSnapshotQuerySchema: z.ZodObject<{
    days: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    days: number;
}, {
    days?: number | undefined;
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
export type HouseReverseDto = z.infer<typeof HouseReverseSchema>;
