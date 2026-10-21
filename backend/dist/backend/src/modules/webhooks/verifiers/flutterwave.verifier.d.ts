import type { Request } from 'express';
import type { WebhookVerifier, WebhookVerdict } from './verifier.interface';
export declare class FlutterwaveVerifier implements WebhookVerifier {
    readonly provider = "FLUTTERWAVE";
    readonly path = "/webhooks/flutterwave";
    verify(req: Request): Promise<WebhookVerdict>;
}
