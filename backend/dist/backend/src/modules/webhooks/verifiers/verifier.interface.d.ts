import type { Request } from 'express';
export type VerifiedEventKind = 'PAYMENT_SUCCEEDED' | 'PAYMENT_FAILED' | 'GAME_RESULT' | 'OTHER';
export interface WebhookVerdict {
    valid: boolean;
    reason?: 'MALFORMED' | 'TIMESTAMP_STALE' | 'NO_MATCHING_SIGNATURE' | 'UNKNOWN_EVENT';
    externalId?: string;
    paymentId?: string;
    providerRef?: string;
    kind?: VerifiedEventKind;
}
export interface WebhookVerifier {
    readonly provider: string;
    readonly path: string;
    verify(req: Request): Promise<WebhookVerdict>;
}
