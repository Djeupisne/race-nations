/**
 * jwt-auth.guard.ts — garde d'authentification globale « deny by default » (INV-28).
 * Étend l'AuthGuard passport('jwt') de Nest et honore @Public() : seules les routes
 * explicitement marquées publiques (/auth/*, /health, /webhooks/*) bypassent le JWT.
 * Échec → 401 enveloppe standard AUTH_UNAUTHENTICATED (jamais de détail interne).
 */
import { ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { AuthUnauthenticatedError } from '../errors/domain-errors';

export const IS_PUBLIC_KEY = 'auth:public';
/** @Public() — réserve le chemin aux routes réellement sans identité (auth, webhooks signés, health). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  /** Normalise tout échec passport en erreur domaine (enveloppe API stable). */
  handleRequest<TUser>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) throw err ?? new AuthUnauthenticatedError();
    return user;
  }
}
