import { z } from 'zod';
export declare const NormalizedWebhookSchema: z.ZodObject<{
    provider: z.ZodEnum<["stripe", "flutterwave", "google_play", "apple", "huawei"]>;
    externalId: z.ZodString;
    type: z.ZodString;
    paymentRef: z.ZodOptional<z.ZodString>;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    receivedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: string;
    receivedAt: string;
    provider: "stripe" | "flutterwave" | "apple" | "huawei" | "google_play";
    externalId: string;
    payload: Record<string, unknown>;
    paymentRef?: string | undefined;
}, {
    type: string;
    receivedAt: string;
    provider: "stripe" | "flutterwave" | "apple" | "huawei" | "google_play";
    externalId: string;
    payload: Record<string, unknown>;
    paymentRef?: string | undefined;
}>;
export type NormalizedWebhook = z.infer<typeof NormalizedWebhookSchema>;
export declare const WebhookListQuerySchema: z.ZodObject<{
    provider: z.ZodOptional<z.ZodEnum<["stripe", "flutterwave", "google_play", "apple", "huawei"]>>;
    status: z.ZodOptional<z.ZodEnum<["pending", "processed", "failed"]>>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    status?: "failed" | "pending" | "processed" | undefined;
    provider?: "stripe" | "flutterwave" | "apple" | "huawei" | "google_play" | undefined;
}, {
    status?: "failed" | "pending" | "processed" | undefined;
    limit?: number | undefined;
    provider?: "stripe" | "flutterwave" | "apple" | "huawei" | "google_play" | undefined;
}>;
export type WebhookListQueryDto = z.infer<typeof WebhookListQuerySchema>;
