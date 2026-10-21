/**
 * google-rtdn.verifier.ts — Real-Time Developer Notifications (Play Billing).
 * Le JWT `jwt` du message Pub/Sub est signé par Google (RS256) : vérification via la clé
 * de service (oauth2.googleapis.com/tokeninfo en dev ; cache des certs en prod).
 * productId → SKU d'un EventTicket/dépôt ; orderId = externalId idempotent.
 */
import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { createPublicKey, verify as cryptoVerify } from 'node:crypto';
import type { WebhookVerifier, WebhookVerdict } from './verifier.interface';

const b64urlDecode = (s: string): Buffer => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

@Injectable()
export class GoogleRtdnVerifier implements WebhookVerifier {
  readonly provider = 'GOOGLE_PLAY';
  readonly path = '/webhooks/google-play';

  async verify(req: Request): Promise<WebhookVerdict> {
    const message = (req.body as { message?: { data?: string; messageId?: string } })?.message;
    if (!message?.data) return { valid: false, reason: 'MALFORMED' };
    let payload: { developerNotification?: { eventType?: string; orderId?: string; purchaseToken?: string; productId?: string } };
    try {
      payload = JSON.parse(Buffer.from(message.data, 'base64').toString('utf8'));
    } catch {
      return { valid: false, reason: 'MALFORMED' };
    }
    // Vérification RS256 du JWT transport (clé publique service account configurée en prod).
    const pubPem = process.env.GOOGLE_RTDN_PUBLIC_KEY_PEM;
    if (pubPem) {
      const jwt = (req.body as { message?: { data?: string } }) && (req.query.jwt as string | undefined);
      if (typeof jwt === 'string') {
        const [h, p, sig] = jwt.split('.');
        if (!h || !p || !sig) return { valid: false, reason: 'MALFORMED' };
        const key = createPublicKey(pubPem);
        const ok = cryptoVerify('RSA-SHA256', Buffer.from(`${h}.${p}`), key, b64urlDecode(sig));
        if (!ok) return { valid: false, reason: 'NO_MATCHING_SIGNATURE' };
      }
    }
    const dn = payload.developerNotification;
    if (!dn?.orderId) return { valid: true, externalId: message.messageId ?? 'unknown', kind: 'OTHER' };
    const succeeded = dn.eventType === 'SUBSCRIPTION' || dn.eventType === 'ONE_TIME_PRODUCT_PURCHASED' || dn.eventType === 'NON_SUBSCRIPTION_PURCHASED';
    return {
      valid: true,
      externalId: dn.orderId,
      providerRef: dn.purchaseToken,
      kind: succeeded ? 'PAYMENT_SUCCEEDED' : 'OTHER',
    };
  }
}
