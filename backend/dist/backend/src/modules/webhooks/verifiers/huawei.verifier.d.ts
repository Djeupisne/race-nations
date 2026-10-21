import type { Request } from 'express';
import type { WebhookVerifier, WebhookVerdict } from './verifier.interface';
export declare class HuaweiVerifier implements WebhookVerifier {
    readonly provider = "HUAWEI_IAP";
    readonly path = "/webhooks/huawei";
    verify(req: Request): Promise<WebhookVerdict>;
}
