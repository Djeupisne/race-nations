/**
 * current-user.decorator.ts — raccourci typé vers req.user injecté par JwtStrategy.
 * Usage : `@CurrentUser() user: AuthenticatedUser` dans tous les contrôleurs authentifiés.
 * Retourne undefined sur les routes @Public() non signées → les handlers doivent refuser
 * explicitement si l'identité est requise (défense en profondeur, INV-28).
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../../modules/auth/auth.dto';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;
    return data && user ? (user[data] as never) : user;
  },
);
