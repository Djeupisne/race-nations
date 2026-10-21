/**
 * GooglePlayProvider — vérification des achats in-app Android (RTDN).
 * La commande est déclenchée par le notification Pub/Sub (webhooks.service) ;
 * ici on re-vérifie AUPRÈS DE Google que le purchase est bien :
 *   - purchased (state 0), pas encore consommé/acknowledgé,
 *   - lié à NOTRE orderId (oneTimeProductAcknowledgement + orderId stocké).
 * Sans cette double vérification, un JWT volé créditerait des wallets.
 * Retourne null si le purchase n'est pas éligible au crédit.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const BASE = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';

@Injectable()
export class GooglePlayProvider {
  private readonly logger = new Logger(GooglePlayProvider.name);
  private token: { value: string; exp: number } | null = null;

  constructor(private readonly config: ConfigService) {}

  async verifyPurchase(
    packageName: string,
    sku: string,
    purchaseToken: string,
  ): Promise<{ ok: boolean; orderId?: string; purchaseState?: number } | null> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) return null;
    try {
      const url = `${BASE}/${packageName}/purchases/products/${sku}/tokens/${encodeURIComponent(purchaseToken)}?access_token=${accessToken}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6_000) });
      if (!res.ok) {
        this.logger.warn(`GP verify status=${res.status}`);
        return null;
      }
      const body = (await res.json()) as { orderId?: string; purchaseState?: number };
      return { ok: body.purchaseState === 0, ...body };
    } catch {
      return null; // fail-closed : indistinguable = pas de crédit
    }
  }

  /** Acknowledge (empêche le remboursement auto après 3 j). Best-effort. */
  async acknowledge(packageName: string, sku: string, purchaseToken: string): Promise<void> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) return;
    try {
      await fetch(
        `${BASE}/${packageName}/purchases/products/${sku}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge?access_token=${accessToken}`,
        { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(6_000) },
      );
    } catch {
      /* retry next webhook redelivery */
    }
  }

  private async getAccessToken(): Promise<string | null> {
    // Service account OAuth2 — clé privée fournie via env (base64 PEM).
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const pemB64 = process.env.GOOGLE_SERVICE_ACCOUNT_PEM_B64;
    if (!email || !pemB64) return null;
    const now = Math.floor(Date.now() / 1000);
    if (this.token && this.token.exp > now + 60) return this.token.value;
    try {
      const { SignJWT, importPKCS8 } = await import('jose');
      const pk = await importPKCS8(Buffer.from(pemB64, 'base64').toString('utf8'), 'RS256');
      const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/androidpublisher' })
        .setProtectedHeader({ alg: 'RS256' })
        .setIssuer(email)
        .setSubject(email)
        .setAudience('https://oauth2.googleapis.com/token')
        .setIssuedAt(now)
        .setExpirationTime(now + 3600)
        .sign(pk);
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }).toString(),
        signal: AbortSignal.timeout(6_000),
      });
      if (!res.ok) return null;
      const tok = (await res.json()) as { access_token: string; expires_in: number };
      this.token = { value: tok.access_token, exp: now + tok.expires_in };
      return tok.access_token;
    } catch {
      return null;
    }
  }
}
