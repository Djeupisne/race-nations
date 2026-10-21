/**
 * StripeProvider — adapter Stripe (cartes) derrière l'interface PaymentProvider.
 * Le backend ne manipule JAMAIS de données de carte (PCI SAQ-A) : on crée une
 * Checkout Session server-side ; le succès vaut UNIQUEMENT via webhook signé
 * (checkout.session.completed), jamais via le redirect client.
 * Montants en centimes HARD (INV-02) — conversion unique à la frontière.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CreateCheckoutInput {
  paymentId: string; // notre UUID — passé en metadata pour corrélation webhook
  amountCents: number;
  currency: string; // 'usd' | 'eur' | 'ngn' …
  description: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutResult {
  providerRef: string; // session id stripe (cs_...)
  checkoutUrl: string;
}

@Injectable()
export class StripeProvider {
  private readonly logger = new Logger(StripeProvider.name);

  constructor(private readonly config: ConfigService) {}

  get enabled(): boolean {
    return Boolean(this.config.get<string>('providers.stripe.secretKey'));
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const key = this.config.get<string>('providers.stripe.secretKey');
    if (!key) throw new Error('Stripe not configured');

    // API REST directe (pas d'SDK) : surface minimale, auditables.
    const body = new URLSearchParams({
      mode: 'payment',
      'payment_intent_data[metadata]': JSON.stringify({ paymentId: input.paymentId }),
      'line_items[0][price_data][currency]': input.currency,
      'line_items[0][price_data][product_data][name]': input.description,
      'line_items[0][price_data][unit_amount]': String(input.amountCents),
      'line_items[0][quantity]': '1',
      'metadata[paymentId]': input.paymentId,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      const txt = await res.text();
      this.logger.error(`Stripe checkout failed status=${res.status}`);
      throw new Error(`stripe_error:${res.status}:${txt.slice(0, 200)}`);
    }
    const session = (await res.json()) as { id: string; url?: string };
    if (!session.url) throw new Error('stripe_missing_url');
    return { providerRef: session.id, checkoutUrl: session.url };
  }
}
