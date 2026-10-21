import { z } from 'zod';
export declare const AuditSearchQuerySchema: z.ZodObject<{
    actor: z.ZodOptional<z.ZodString>;
    action: z.ZodOptional<z.ZodString>;
    targetType: z.ZodOptional<z.ZodString>;
    targetId: z.ZodOptional<z.ZodString>;
    from: z.ZodOptional<z.ZodDate>;
    to: z.ZodOptional<z.ZodDate>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    from?: Date | undefined;
    to?: Date | undefined;
    action?: string | undefined;
    targetType?: string | undefined;
    targetId?: string | undefined;
    actor?: string | undefined;
}, {
    from?: Date | undefined;
    to?: Date | undefined;
    limit?: number | undefined;
    action?: string | undefined;
    targetType?: string | undefined;
    targetId?: string | undefined;
    actor?: string | undefined;
}>;
export type AuditSearchQuery = z.infer<typeof AuditSearchQuerySchema>;
