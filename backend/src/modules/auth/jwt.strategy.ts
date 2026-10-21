/**
 * jwt.strategy.ts — vérification de l'access token (docs/api.md §1.1, INV-28).
 * Expose sur `req.user` l'identité { userId, playerId, role, family }.
 * - Le JWT porte sub=userId ; le playerId est résolu en base à chaque requête
 *   (coût 1 index unique lookup — garantit qu'un joueur supprimé/sanctionné perd
 *   l'accès immédiatement, pas à l'expiration du token).
 * - `family` (famille de refresh) est propagée pour la détection REFRESH_REUSED.
 * - Échec → AuthUnauthenticatedError / TokenExpiredError (401 enveloppe standard).
 */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy as PassportJwtStrategy } from 'passport-jwt';
import type { AccessTokenClaims } from '@race-nations/api-contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUnauthenticatedError, TokenExpiredError } from '../../common/errors/domain-errors';
import type { AuthenticatedUser } from './auth.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(PassportJwtStrategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // expiration = refus sec (le client doit /auth/refresh)
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? 'dev-only-insecure-access-secret',
      issuer: 'race-nations-api',
      audience: 'race-nations-clients',
      algorithms: ['HS256'],
    });
  }

  /** Passport appelle validate() après décodage + vérif signature/exp/iss/aud. */
  async validate(claims: AccessTokenClaims): Promise<AuthenticatedUser> {
    if (!claims?.sub || typeof claims.sub !== 'string') throw new AuthUnauthenticatedError();
    const player = await this.prisma.player.findUnique({
      where: { userId: claims.sub },
      select: { id: true },
    });
    if (!player) {
      // Compte sans profil (supprimé/GDPR) ou sub inconnu : jamais d'accès partiel.
      throw new TokenExpiredError(); // force le refresh flow complet
    }
    return {
      userId: claims.sub,
      playerId: player.id,
      role: claims.role,
      family: claims.fam,
    };
  }
}
