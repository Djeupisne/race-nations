/**
 * FlutterwaveProvider — dépôts mobile money / cartes Afrique (NG/KE/GH).
 * Initiation server-side d'une transaction ; le succès vaut UNIQUEMENT via
 * webhook vérifié (verif-hash, header x-verif-hash) dans webhooks.service.
 * Le montant est TOUJOURS fixé côté serveur (centimes HARD → devise locale
 * déjà alignée 1:1 par la config pays), jamais accepté depuis le client.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FlutterwaveProvider {
  private readonly logger = new Logger(FlutterwaveProvider.name);

  constructor(private readonly config: ConfigService) {}

  async initiateTransfer(paymentId: string, amountCents: number, currency: string, email: string): Promise<{ flwRef: string; link: string }> {
    const key = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!key) throw new Error('Flutterwave not configured');
    const res = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tx_ref: paymentId, // corrélation directe avec notre Payment.id
        amount: amountCents,
        currency,
        email,
        redirect_url: this.config.get<string>('payments.fwRedirectUrl') ?? 'https://app racenations.invalid/deposit-done',
        meta: { paymentId },
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      this.logger.error(`FW initiate failed status=${res.status}`);
      throw new Error('provider_unavailable');
    }
    const body = (await res.json()) as { data?: { link?: string }; status?: string };
    if (body.status !== 'success' || !body.data?.link) throw new Error('provider_error');
    return { flwRef: paymentId, link: body.data.link };
  }
}
