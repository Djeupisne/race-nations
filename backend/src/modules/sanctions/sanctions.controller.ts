/**
 * sanctions.controller.ts — cycle de vie des sanctions (docs/api.md §9).
 * Émission/décision/levée : MODERATOR+ ; appel + consultation historique : PLAYER
 * sur SES PROPRES sanctions uniquement (ownership vérifié dans le service).
 */
import { Body, Controller, Get, HttpCode, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { SanctionsService } from './sanctions.service';
import { IssueSanctionSchema, AppealSanctionSchema, DecideAppealSchema } from './sanctions.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUnauthenticatedError, ValidationError } from '../../common/errors/domain-errors';

type User = { userId: string; playerId: string | null; role: 'PLAYER' | 'MODERATOR' | 'ADMIN' | 'SYSTEM' };

@Controller('v1/sanctions')
export class SanctionsController {
  constructor(private readonly sanctions: SanctionsService) {}

  private user(req: Request): User {
    const u = (req as Request & { user?: User }).user;
    if (!u) throw new AuthUnauthenticatedError();
    return u;
  }

  /** GET /v1/sanctions/me — historique du joueur connecté. */
  @Get('me')
  mine(@Req() req: Request) {
    const u = this.user(req);
    if (!u.playerId) throw new AuthUnauthenticatedError();
    return this.sanctions.listForPlayer(u.playerId);
  }

  /** POST /v1/sanctions/:id/appeal — appel par le joueur sanctionné (note ≥ 10 caractères). */
  @Post(':id/appeal')
  @HttpCode(200)
  async appeal(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const u = this.user(req);
    if (!u.playerId) throw new AuthUnauthenticatedError();
    const parsed = AppealSanctionSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError({ field: 'body', reason: parsed.error.message });
    await this.sanctions.appeal(id, u.playerId, parsed.data.note);
    return { ok: true };
  }

  /** POST /v1/sanctions — émission (MODERATOR+, auditée via AdminService côté back-office). */
  @Roles('MODERATOR', 'ADMIN')
  @Post()
  issue(@Req() req: Request, @Body() body: unknown) {
    const u = this.user(req);
    const parsed = IssueSanctionSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError({ field: 'body', reason: parsed.error.message });
    return this.sanctions.issue({ ...parsed.data, issuedById: u.userId });
  }

  /** POST /v1/sanctions/:id/decide — UPHELD | LIFTED sur un appel (MODERATOR+). */
  @Roles('MODERATOR', 'ADMIN')
  @Post(':id/decide')
  @HttpCode(200)
  async decide(@Param('id') id: string, @Body() body: unknown) {
    const parsed = DecideAppealSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError({ field: 'body', reason: parsed.error.message });
    await this.sanctions.decideAppeal(id, parsed.data.decision);
    return { ok: true };
  }

  /** POST /v1/sanctions/:id/lift — levée anticipée (ADMIN). */
  @Roles('ADMIN')
  @Post(':id/lift')
  @HttpCode(200)
  async lift(@Param('id') id: string) {
    await this.sanctions.lift(id);
    return { ok: true };
  }
}
