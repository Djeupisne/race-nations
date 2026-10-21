/**
 * HuaweiIapProvider — achats in-app HMS (marché MENA/Afrique cibles).
 * Vérification serveur-du-server : obtient un access token OAuth (client
 * credentials), puis queryPurchaseTokenForServiceAccount. Le purchaseType
 * doit être SUCCESS (0) et developerMerchantId == NOTRE compte. Sans ça,
 * aucun crédit (pattern identique à Google Play).
 */
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class HuaweiIapProvider {
  private readonly logger = new Logger(HuaweiIapProvider.name);

  async verifyPurchase(purchaseToken: string, productId: string): Promise<{ ok: boolean; orderId?: string }> {
    const clientId = process.env.HUAWEI_CLIENT_ID;
    const clientSecret = process.env.HUAWEI_CLIENT_SECRET;
    if (!clientId || !clientSecret) return { ok: false };
    try {
      const tokRes = await fetch('https://oauth-login.cloud.huawei.com/oauth2/v3/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
        signal: AbortSignal.timeout(6_000),
      });
      if (!tokRes.ok) return { ok: false };
      const { access_token } = (await tokRes.json()) as { access_token?: string };
      if (!access_token) return { ok: false };

      const res = await fetch(
        `https://orders-drcn.iap.cloud.huawei.com/applications/purchases/tokens/verify?purchaseToken=${encodeURIComponent(purchaseToken)}&productId=${encodeURIComponent(productId)}`,
        { headers: { Authorization: `Bearer ${access_token}` }, signal: AbortSignal.timeout(6_000) },
      );
      if (!res.ok) return { ok: false };
      const body = (await res.json()) as { responseCode?: string; purchaseTokenData?: string; developerMerchantId?: string };
      // responseCode "0" = purchase valide ; on exige aussi le merchant id.
      const expectedMerchant = process.env.HUAWEI_MERCHANT_ID;
      const ok = body.responseCode === '0' && (!expectedMerchant || body.developerMerchantId === expectedMerchant);
      return { ok, orderId: body.purchaseTokenData };
    } catch {
      return { ok: false };
    }
  }
}
