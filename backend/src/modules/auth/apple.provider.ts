/**
 * AppleLoginVerifier — vérification des identity tokens Sign in with Apple.
 * JWT RS256 signé par l'alg-id Apple (aud = notre CLIENT_ID, iss =
 * https://appleid.apple.com). Clés publiques JWKS cachées 6 h. Le sub
 * (underlying identifier) est stable et sert de clé d'account-linking.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicKey, verify as cryptoVerify } from 'node:crypto';
import { AuthUnauthenticatedError } from '../../common/errors/domain-errors';

interface AppleJwk { kid: string; n: string; e: string }
const ISSUER = 'https://appleid.apple.com';
const JWKS_URL = 'https://appleid.apple.com/auth/keys';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

@Injectable()
export class AppleLoginVerifier {
  private readonly logger = new Logger(AppleLoginVerifier.name);
  private cache: { keys: Map<string, AppleJwk>; at: number } | null = null;

  constructor(private readonly config: ConfigService) {}

  async verifyIdentityToken(idToken: string): Promise<{ sub: string; email?: string }> {
    const parts = idToken.split('.');
    if (parts.length !== 3) throw new AuthUnauthenticatedError();
    let header: Record<string, unknown>, payload: Record<string, unknown>;
    try {
      header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
      payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    } catch {
      throw new AuthUnauthenticatedError();
    }
    if (payload.iss !== ISSUER) throw new AuthUnauthenticatedError({}, 'Invalid issuer.');
    const clientId = this.config.get<string>('providers.apple.clientId') ?? process.env.APPLE_CLIENT_ID ?? '';
    if (!clientId || payload.aud !== clientId) throw new AuthUnauthenticatedError({}, 'Invalid audience.');
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
      throw new AuthUnauthenticatedError({}, 'Token expired.');
    }

    const keys = await this.getKeys();
    const jwk = keys.get(String(header.kid));
    if (!jwk) throw new AuthUnauthenticatedError({}, 'Unknown key id.');
    const keyObject = createPublicKey({ key: { kty: 'RSA', n: jwk.n, e: jwk.e }, format: 'jwk' });
    const ok = cryptoVerify(
      'RSA-SHA256',
      Buffer.from(`${parts[0]}.${parts[1]}`, 'ascii'),
      keyObject,
      Buffer.from(parts[2], 'base64url'),
    );
    if (!ok) throw new AuthUnauthenticatedError({}, 'Signature verification failed.');
    return { sub: String(payload.sub), email: payload.email as string | undefined };
  }

  private async getKeys(): Promise<Map<string, AppleJwk>> {
    const now = Date.now();
    if (this.cache && now - this.cache.at < CACHE_TTL_MS) return this.cache.keys;
    try {
      const res = await fetch(JWKS_URL, { signal: AbortSignal.timeout(5_000) });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const body = (await res.json()) as { keys: AppleJwk[] };
      const map = new Map(body.keys.map((k) => [k.kid, k]));
      this.cache = { keys: map, at: now };
      return map;
    } catch {
      if (this.cache) {
        this.logger.warn('Apple JWKS refresh failed, using stale cache');
        return this.cache.keys;
      }
      throw new AuthUnauthenticatedError({}, 'Identity provider unavailable.');
    }
  }
}
