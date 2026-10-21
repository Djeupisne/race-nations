/**
 * flutterwave.verifier.ts — signature Flutterwave : verif-hash header == sha256hex(secret + rawBody)
 * (doc officielle v3). tx_ref porte l'idempotencyKey backend ; le paymentId est résolu par le service.
 */
import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { createHash } from 'node:crypto';
import { verifySignatureConstantTime } from '../../../common/utils/signature';
import type { WebhookVerifier, WebhookVerdict } from './verifier.interface';

@Injectable()
export class FlutterwaveVerifier implements WebhookVerifier {
  readonly provider = 'FLUTTERWAVE';
  readonly path = '/webhooks/flutterwave';

  async verify(req: Request): Promise<WebhookVerdict> {
    const provided = req.headers['verif-hash'];
    if (typeof provided !== 'string') return { valid: false, reason: 'MALFORMED' };
    const secret = process.env.FLUTTERWAVE_WEBHOOK_HASH ?? '';
    const raw = (req as Request & { rawBody?: Buffer }).rawBody?.toString('utf8') ?? JSON.stringify(req.body ?? {});
    const expected = createHash('sha256').update(secret + raw, 'utf8').digest('hex');
    if (!verifySignatureConstantTime(expected, provided)) return { valid: false, reason: 'NO_MATCHING_SIGNATURE' };

    const body = (req.body ?? {}) as { id?: string | number; data?: { status?: string; tx_ref?: string; flw_ref?: string; payment_id?: string } };
    const externalId = String(body.id ?? '');
    if (!externalId) return { valid: false, reason: 'MALFORMED' };
    const status = body.data?.status;
    if (status === 'successful' || status === 'completed') {
      return { valid: true, externalId, providerRef: body.data?.flw_ref ?? body.data?.payment_id, kind: 'PAYMENT_SUCCEEDED' };
    }
    if (status === 'failed' || status === 'cancelled') {
      return { valid: true, externalId, providerRef: body.data?.flw_ref, kind: 'PAYMENT_FAILED' };
    }
    return { valid: true, externalId, kind: 'OTHER' };
  }
}
