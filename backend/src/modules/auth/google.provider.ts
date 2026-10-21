/**
 * GoogleLoginVerifier — vérification des ID tokens Google (OAuth login).
 * On valide : signature JWS via les clés publiques openid-configuration
 * (cache 1 h), aud == CLIENT_ID, iss ∈ {accounts.google.com, https://
 * accounts.google.com}, exp non dépassé. Aucune donnée n'est stockée sans
 * cette validation (docs/api.md §2.1). Échec = AuthUnauthenticatedError.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicKey, verify as cryptoVerify } from 'node:crypto';
import { AuthUnauthenticatedError } from '../../common/errors/domain-errors';

interface GoogleJwk { kid: string; n: string; e: string; alg: string }
interface CachedKeys { keys: Map<string, GoogleJwk>; fetchedAt: number }

const TOKEN_URL_ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);
const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const CACHE_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class GoogleLoginVerifier {
  private readonly logger = new Logger(GoogleLoginVerifier.name);
  private cache: CachedKeys | null = null;

  constructor(private readonly config: ConfigService) {}

  async verifyIdToken(idToken: string): Promise<{ sub: string; email?: string; name?: string }> {
    const [headerB64, payloadB64, sigB64] = idToken.split('.');
    if (!headerB64 || !payloadB64 || !sigB64) throw new AuthUnauthenticatedError();

    const header = this.decodeJson(headerB64);
    const payload = this.decodeJson(payloadB64);

    // Claims obligatoires
    const iss = typeof payload.iss === 'string' ? payload.iss : '';
    if (!TOKEN_URL_ISSUERS.has(iss)) throw new AuthUnauthenticatedError({}, 'Invalid issuer.');
    const clientId = this.config.get<string>('providers.google.clientId') ?? process.env.GOOGLE_CLIENT_ID ?? '';
    if (!clientId || payload.aud !== clientId) throw new AuthUnauthenticatedError({}, 'Invalid audience.');
    if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) {
      throw new AuthUnauthenticatedError({}, 'Token expired.');
    }

    // Signature RS256 contre le JWK courant
    const jwks = await this.getKeys();
    const jwk = jwks.get(String(header.kid));
    if (!jwk) throw new AuthUnauthenticatedError({}, 'Unknown key id.');

    const keyObject = createPublicKey({ key: { kty: 'RSA', n: jwk.n, e: jwk.e }, format: 'jwk' });
    const signed = Buffer.from(`${headerB64}.${payloadB64}`, 'ascii');
    const signature = Buffer.from(sigB64, 'base64url');
    let ok = false;
    try {
      ok = cryptoVerify('RSA-SHA256', signed, keyObject, signature);
    } catch {
      ok = false;
    }
    if (!ok) throw new AuthUnauthenticatedError({}, 'Signature verification failed.');

    return {
      sub: String(payload.sub),
      email: typeof payload.email === 'string' ? payload.email : undefined,
      name: typeof payload.name === 'string' ? payload.name : undefined,
    };
  }

  private decodeJson(b64url: string): Record<string, unknown> {
    try {
      return JSON.parse(Buffer.from(b64url, 'base64url').toString('utf8'));
    } catch {
      throw new AuthUnauthenticatedError();
    }
  }

  private async getKeys(): Promise<Map<string, GoogleJwk>> {
    const now = Date.now();
    if (this.cache && now - this.cache.fetchedAt < CACHE_TTL_MS) return this.cache.keys;
    try {
      const res = await fetch(JWKS_URL, { signal: AbortSignal.timeout(5_000) });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const body = (await res.json()) as { keys: GoogleJwk[] };
      const map = new Map(body.keys.filter((k) => k.alg === 'RS256').map((k) => [k.kid, k]));
      this.cache = { keys: map, fetchedAt: now };
      return map;
    } catch (err) {
      // En cas d'indisibilité Google, on réutilise un cache périmé plutôt
      // que de bloquer tous les logins — mais jamais on n'accepte sans clé.
      if (this.cache) {
        this.logger.warn('Google JWKS refresh failed, using stale cache');
        return this.cache.keys;
      }
      throw new AuthUnauthenticatedError({}, 'Identity provider unavailable.');
    }
  }
}
