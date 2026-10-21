/**
 * AppleStoreProvider — achats in-app iOS. La source de vérité est la
 * notification App Store Server V2 (signedPayload JWS, vérifié par
 * apple-notifications.verifier). Ici : re-vérification du transactionId
 * auprès de l'endpoint production/verifyReceipt AVANT tout crédit, et
 * lookup de la bundleId pour refuser un receipt d'une autre app.
 * Fail-closed : toute incertitude = pas de crédit (le webhook sera retry).
 */
import { Injectable, Logger } from '@nestjs/common';

const VERIFY_URL_PROD = 'https://buy.itunes.apple.com/verifyReceipt';

@Injectable()
export class AppleStoreProvider {
  private readonly logger = new Logger(AppleStoreProvider.name);

  async verifyTransaction(transactionId: string): Promise<{ ok: boolean; productId?: string; bundleId?: string }> {
    const secret = process.env.APPLE_SHARED_SECRET;
    if (!secret) return { ok: false };
    try {
      const res = await fetch(VERIFY_URL_PROD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'receipt-data': transactionId, password: secret, 'exclude-old-transactions': true }),
        signal: AbortSignal.timeout(6_000),
      });
      if (!res.ok) return { ok: false };
      const body = (await res.json()) as {
        status: number;
        latest_receipt_info?: Array<{ transaction_id: string; product_id: string; bundle_id: string }>;
      };
      if (body.status !== 0) return { ok: false };
      const match = body.latest_receipt_info?.find((r) => r.transaction_id === transactionId);
      if (!match) return { ok: false };
      return { ok: true, productId: match.product_id, bundleId: match.bundle_id };
    } catch {
      return { ok: false };
    }
  }
}
