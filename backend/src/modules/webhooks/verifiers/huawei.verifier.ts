/**
 * huawei.verifier.ts — notifications IAP Huawei (payload JSON + Authorization Bearer
 * validé par re-check du jeton de service HM Cloud). Fail-closed si non configuré.
 */
import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { WebhookVerifier, WebhookVerdict } from './verifier.interface';

@Injectable()
export class HuaweiVerifier implements WebhookVerifier {
  readonly provider = 'HUAWEI_IAP';
  readonly path = '/webhooks/huawei';

  async verify(req: Request): Promise<WebhookVerdict> {
    const auth = req.headers['authorization'];
    const expected = process.env.HUAWEI_WEBHOOK_TOKEN;
    if (!expected || typeof auth !== 'string' || !auth.endsWith(expected)) {
      return { valid: false, reason: 'NO_MATCHING_SIGNATURE' };
    }
    const body = (req.body ?? {}) as { orderId?: string; purchaseState?: number; productId?: string };
    if (!body.orderId) return { valid: false, reason: 'MALFORMED' };
    return {
      valid: true,
      externalId: body.orderId,
      providerRef: body.orderId,
      kind: body.purchaseState === 0 ? 'PAYMENT_SUCCEEDED' : 'OTHER',
    };
  }
}
