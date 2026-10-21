import type { Request } from 'express';
import { type Clock } from '../../../common/utils/clock';
import type { WebhookVerifier, WebhookVerdict } from './verifier.interface';
export declare class StripeVerifier implements WebhookVerifier {
    private readonly clock;
    readonly provider = "STRIPE";
    readonly path = "/webhooks/stripe";
    constructor(clock: Clock);
    verify(req: Request): Promise<WebhookVerdict>;
}
