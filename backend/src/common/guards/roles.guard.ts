/**
 * roles.guard.ts — autorisation par rôle (RBAC minimal, api.md §9).
 * - Lit @Roles(...) via Reflector ; hiérarchie implicite SYSTEM > ADMIN > MODERATOR > PLAYER.
 * - Si aucune métadonnée : la route n'exige qu'une authentification (laissée au JwtAuthGuard).
 * - Refus → ForbiddenAdminError (403 FORBIDDEN_ADMIN) — pas de distinction "existe mais interdit"
 *   sur les chemins admin (anti-énumération).
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, type AppRole } from '../decorators/roles.decorator';
import { ForbiddenAdminError, AuthUnauthenticatedError } from '../errors/domain-errors';
import type { AuthenticatedUser } from '../../modules/auth/auth.dto';

const RANK: Record<AppRole, number> = { PLAYER: 0, MODERATOR: 1, ADMIN: 2, SYSTEM: 3 };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AppRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>().user;
    if (!user) throw new AuthUnauthenticatedError(); // guard enregistré après le JwtAuthGuard
    const minRank = Math.min(...required.map((r) => RANK[r]));
    if (RANK[user.role] < minRank) throw new ForbiddenAdminError();
    return true;
  }
}
