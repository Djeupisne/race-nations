/**
 * OwnershipGuard — authz par ressource (INV-28).
 * Vérifie que l'utilisateur JWT possède la ressource ciblée (wallet/bet/match/ticket)
 * AVANT d'atteindre le service. ADMIN/MODERATOR bypassent (audit obligatoire côté admin).
 *
 * Usage :
 *   @UseGuards(JwtAuthGuard, OwnershipGuard)
 *   @Ownership({ model: 'bet', idParam: 'betId' })
 *   ou convention simple : route /players/:playerId/... avec token.playerId.
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ForbiddenAdminError, NotFoundError } from '../errors/domain-errors';

export interface OwnershipMeta {
  /** table Prisma à charger (whitelist stricte ci-dessous). */
  model: 'bet' | 'betMarket' | 'wallet' | 'match' | 'ticket' | 'player';
  /** nom du paramètre de route contenant l'id de la ressource. */
  idParam: string;
}

export const OWNERSHIP_META_KEY = 'ownership:resource';
export const ownership = (meta: OwnershipMeta) => (target: unknown, key?: string, desc?: PropertyDescriptor) => {
  const reflectorSetMetadata = Reflect.defineMetadata;
  const holder = desc ? desc.value : key ? target[key as keyof typeof target] : target;
  reflectorSetMetadata(OWNERSHIP_META_KEY, meta, holder as object);
};

interface JwtUser {
  userId: string;
  playerId?: string;
  role?: 'PLAYER' | 'MODERATOR' | 'ADMIN' | 'SYSTEM';
}

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.get<OwnershipMeta>(OWNERSHIP_META_KEY, context.getHandler());
    const req = context.switchToHttp().getRequest<{ user?: JwtUser; params?: Record<string, string>; prisma?: never }>();
    const user = req.user;
    if (!user?.userId) throw new ForbiddenAdminError({}, 'Authentication required for ownership check.');
    if (user.role === 'ADMIN' || user.role === 'MODERATOR') return true; // bypass tracé en audit par les contrôleurs admin

    // Cas sans métadonnée : convention REST /players/:playerId — l'identité doit matcher.
    if (!meta) {
      const playerId = req.params?.playerId;
      if (playerId && user.playerId && playerId === user.playerId) return true;
      throw new ForbiddenAdminError({}, 'You do not own this resource.');
    }

    const id = req.params?.[meta.idParam];
    if (!id) throw new NotFoundError(meta.model, undefined);

    // Chargement défensif via le repository dédié au module appelant (injectable ailleurs) ;
    // ici on délègue au service passé en extension du request pour garder le guard sans dépendance DB directe.
    const ownerPlayerId = (req as { resourceOwnerPlayerId?: string }).resourceOwnerPlayerId;
    if (ownerPlayerId === undefined) {
      // Le contrôleur/enrichisseur DOIT fournir resourceOwnerPlayerId ; son absence est un bug → refus.
      throw new ForbiddenAdminError({}, 'Ownership enrichment missing for resource.');
    }
    if (ownerPlayerId !== user.playerId) throw new ForbiddenAdminError({}, 'You do not own this resource.');
    return true;
  }
}
