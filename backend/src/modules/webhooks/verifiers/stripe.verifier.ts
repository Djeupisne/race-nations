/**
 * stripe.verifier.ts — vérification Stripe-Signature (t=…,v1=…) — INV-26.
 * HMAC-SHA256(secret, `${t}.${rawBody}`) comparé en temps constant, fenêtre 300 s.
 * Le paymentId backend est injecté dans metadata.paymentId au checkout (createProviderIntent).
 */
import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { verifySignedHeader } from '../../../common/utils/signature';
import { CLOCK, type Clock } from '../../../common/utils/clock';
import { Inject } from '@nestjs/common';
import type { WebhookVerifier, WebhookVerdict } from './verifier.interface';

@Injectable()
export class StripeVerifier implements WebhookVerifier {
  readonly provider = 'STRIPE';
  readonly path = '/webhooks/stripe';

  constructor(@Inject(CLOCK) private readonly clock: Clock) {}

  async verify(req: Request): Promise<WebhookVerdict> {
    const header = req.headers['stripe-signature'];
    if (typeof header !== 'string') return { valid: false, reason: 'MALFORMED' };
    const secret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
    const raw = (req as Request & { rawBody?: Buffer }).rawBody?.toString('utf8') ?? JSON.stringify(req.body ?? {});
    const res = verifySignedHeader(header, raw, secret, this.clock.nowMs(), 300_000);
    if (!res.valid) return { valid: false, reason: res.reason };

    const body = (req.body ?? {}) as { id?: string; type?: string; data?: { object?: { id?: string; metadata?: { paymentId?: string }; status?: string } } };
    if (!body.id || !body.type) return { valid: false, reason: 'MALFORMED' };
    const obj = body.data?.object ?? {};
    const paymentId = obj.metadata?.paymentId;
    if (body.type === 'payment_intent.succeeded') {
      if (!paymentId) return { valid: false, reason: 'UNKNOWN_EVENT' };
      return { valid: true, externalId: body.id, paymentId, providerRef: obj.id, kind: 'PAYMENT_SUCCEEDED' };
    }
    if (body.type === 'payment_intent.payment_failed' || body.type === 'payment_intent.canceled') {
      if (!paymentId) return { valid: false, reason: 'UNKNOWN_EVENT' };
      return { valid: true, externalId: body.id, paymentId, providerRef: obj.id, kind: 'PAYMENT_FAILED' };
    }
    return { valid: true, externalId: body.id, kind: 'OTHER' }; // ignoré métier mais tracé
  }
}
