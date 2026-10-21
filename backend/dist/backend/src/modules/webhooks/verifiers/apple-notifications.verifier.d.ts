import type { Request } from 'express';
import type { WebhookVerifier, WebhookVerdict } from './verifier.interface';
export declare class AppleNotificationsVerifier implements WebhookVerifier {
    readonly provider = "APPLE_IAP";
    readonly path = "/webhooks/apple";
    verify(req: Request): Promise<WebhookVerdict>;
}
