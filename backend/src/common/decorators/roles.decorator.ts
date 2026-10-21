/**
 * roles.decorator.ts — métadonnée de rôle pour RolesGuard (api.md §9 : /admin/* ADMIN,
 * endpoints modération MODERATOR+). Les rôles sont TOUJOURS lus depuis le JWT validé +
 * la base (JwtStrategy), jamais depuis le client.
 */
import { SetMetadata } from '@nestjs/common';

export type AppRole = 'PLAYER' | 'MODERATOR' | 'ADMIN' | 'SYSTEM';
export const ROLES_KEY = 'auth:roles';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
