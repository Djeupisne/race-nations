import { z } from 'zod';
export declare const FilterTextSchema: z.ZodObject<{
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    text: string;
}, {
    text: string;
}>;
export type FilterTextDto = z.infer<typeof FilterTextSchema>;
export declare const DismissReportSchema: z.ZodObject<{
    note: z.ZodString;
}, "strip", z.ZodTypeAny, {
    note: string;
}, {
    note: string;
}>;
export type DismissReportDto = z.infer<typeof DismissReportSchema>;
export declare const ModerationQueueQuerySchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
}, {
    limit?: number | undefined;
}>;
