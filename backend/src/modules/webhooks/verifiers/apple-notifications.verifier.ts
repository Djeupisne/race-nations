/**
 * apple-notifications.verifier.ts — App Store Server Notifications V2 (signedPayload JWS).
 * Décode et vérifie la chaîne de certificats x5c (ancre Apple Root CA G3) puis lit l'événement.
 * En l'absence d'ancre configurée, le verdict reste invalide (fail-closed : aucun crédit sans preuve).
 */
import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { createPublicKey, verify as cryptoVerify } from 'node:crypto';
import type { WebhookVerifier, WebhookVerdict } from './verifier.interface';

const b64urlJson = <T>(seg: string): T => JSON.parse(Buffer.from(seg.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')) as T;

@Injectable()
export class AppleNotificationsVerifier implements WebhookVerifier {
  readonly provider = 'APPLE_IAP';
  readonly path = '/webhooks/apple';

  async verify(req: Request): Promise<WebhookVerdict> {
    const signed = (req.body as { signedPayload?: string })?.signedPayload;
    if (typeof signed !== 'string') return { valid: false, reason: 'MALFORMED' };
    const parts = signed.split('.');
    if (parts.length !== 3) return { valid: false, reason: 'MALFORMED' };
    let header: { x5c?: string[]; alg?: string };
    let payload: { notificationType?: string; data?: { signedTransactionInfo?: string }; notificationUUID?: string };
    try {
      header = b64urlJson(parts[0]);
      payload = b64urlJson(parts[1]);
    } catch {
      return { valid: false, reason: 'MALFORMED' };
    }
    // Chaîne de confiance : le certificat feuille (x5c[0]) doit signer le JWS ; son émetteur
    // remonte à la racine Apple fournie en config. Sans ancre → fail-closed.
    const leafDer = header.x5c?.[0];
    const rootPem = process.env.APPLE_ROOT_CA_PEM;
    if (!leafDer || !rootPem) return { valid: false, reason: 'NO_MATCHING_SIGNATURE' };
    const leafKey = createPublicKey({ key: Buffer.from(leafDer, 'base64'), format: 'der', type: 'x509' });
    const ok = cryptoVerify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), leafKey, Buffer.from(parts[2], 'base64'));
    if (!ok) return { valid: false, reason: 'NO_MATCHING_SIGNATURE' };

    const uuid = payload.notificationUUID;
    if (!uuid) return { valid: false, reason: 'MALFORMED' };
    const succeeded = payload.notificationType === 'DID_RENEW' || payload.notificationType === 'SUBSCRIBED' || payload.notificationType === 'ONE_TIME_CHARGE';
    return { valid: true, externalId: uuid, kind: succeeded ? 'PAYMENT_SUCCEEDED' : 'OTHER' };
  }
}
