/**
 * UsersController — profil du compte authentifié (docs/api.md §3).
 * Uniquement des routes SELF : l'id d'utilisateur est TOUJOURS tiré du JWT
 * (req.user.sub), jamais d'un paramètre client (anti-IDOR, INV-28).
 */
import { Controller, Get, Patch, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateProfileDto, UpdateProfileSchema } from './users.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

interface AuthedRequest extends Request {
  user: { sub: string; role: string };
}

@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** GET /api/v1/users/me — profil courant + flags de compliance. */
  @Get('me')
  async me(@Req() req: AuthedRequest) {
    return this.users.getProfile(req.user.sub);
  }

  /** PATCH /api/v1/users/me — pseudo/avatar/langue uniquement. */
  @Patch('me')
  async update(
    @Req() req: AuthedRequest,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) dto: UpdateProfileDto,
  ) {
    return this.users.updateProfile(req.user.sub, dto);
  }
}
