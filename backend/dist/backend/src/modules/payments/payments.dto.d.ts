import { z } from 'zod';
export declare const MIN_DEPOSIT_CENTS = 1000;
export declare const MAX_DEPOSIT_CENTS = 100000;
export declare const CheckoutSchema: z.ZodObject<{
    provider: z.ZodEnum<["stripe", "flutterwave"]>;
    amountCents: z.ZodNumber;
    idempotencyKey: z.ZodString;
}, "strip", z.ZodTypeAny, {
    idempotencyKey: string;
    provider: "stripe" | "flutterwave";
    amountCents: number;
}, {
    idempotencyKey: string;
    provider: "stripe" | "flutterwave";
    amountCents: number;
}>;
export type CheckoutDto = z.infer<typeof CheckoutSchema>;
export declare const ListPaymentsQuerySchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    cursor?: string | undefined;
}, {
    cursor?: string | undefined;
    limit?: number | undefined;
}>;
export type ListPaymentsQueryDto = z.infer<typeof ListPaymentsQuerySchema>;
