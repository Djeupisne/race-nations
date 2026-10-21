import type { Request } from 'express';
import type { WebhookVerifier, WebhookVerdict } from './verifier.interface';
export declare class GoogleRtdnVerifier implements WebhookVerifier {
    readonly provider = "GOOGLE_PLAY";
    readonly path = "/webhooks/google-play";
    verify(req: Request): Promise<WebhookVerdict>;
}
