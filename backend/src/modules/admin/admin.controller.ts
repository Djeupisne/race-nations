/**
 * admin.controller.ts — routes back-office (docs/api.md §9). RBAC strict :
 *  - lecture supervision : MODERATOR+ ;
 *  - settlement manuel / résolution litige / reversal House : ADMIN uniquement ;
 *  - sanctions : MODERATOR+ (WARN/MUTE/RESTRICTION), TEMP_BAN/PERM_BAN via AdminService.
 * L'acteur est TOUJOURS req.user (jamais un champ du body — INV-28 anti-usurpation).
 */
import { Body, Controller, Get, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { AdminService, type AdminActor } from './admin.service';
import { AuditService } from '../audit/audit.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUnauthenticatedError, ValidationError } from '../../common/errors/domain-errors';

interface AuthedRequest extends Request {
  user?: { userId: string; playerId: string | null; role: 'PLAYER' | 'MODERATOR' | 'ADMIN' | 'SYSTEM' };
}

const ManualSettleSchema = z.object({
  marketId: z.string().uuid(),
  winningSide: z.number().int().min(0).max(15).optional(),
  push: z.boolean().optional(),
  reason: z.string().min(10).max(2000),
});

const SanctionSchema = z.object({
  playerId: z.string().uuid(),
  type: z.enum(['WARN', 'CHAT_MUTE', 'BET_RESTRICTION', 'TEMP_BAN_7D', 'PERM_BAN', 'REWARD_CLAWBACK']),
  reason: z.string().min(5).max(2000),
  evidenceRef: z.string().max(200).optional(),
});

const DisputeResolveSchema = z.object({
  outcome: z.enum(['REFUND_ALL', 'UPHELD']),
  note: z.string().min(10).max(2000),
});

const DisputeReasonSchema = z.enum(['CHEAT_SUSPECTED', 'RESULT_MISMATCH', 'DISCONNECT_DISPUTE', 'SERVER_FAULT', 'OTHER']);
@Controller('v1/admin')
@Roles('MODERATOR', 'ADMIN')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly audit: AuditService,
  ) {}

  private actor(req: AuthedRequest): AdminActor {
    const u = req.user;
    if (!u) throw new AuthUnauthenticatedError();
    return { userId: u.userId, role: u.role === 'ADMIN' ? 'ADMIN' : 'MODERATOR' };
  }

  /** GET /v1/admin/dashboard — flotte + marchés litigieux/settling. */
  @Get('dashboard')
  dashboard() {
    return this.admin.dashboard();
  }

  /** POST /v1/admin/betting/markets/:id/settle — settlement manuel AUDITÉ (ADMIN only). */
  @Roles('ADMIN')
  @Post('betting/markets/:id/settle')
  @HttpCode(200)
  async settle(@Req() req: AuthedRequest, @Param('id') id: string, @Body() body: unknown) {
    const parsed = ManualSettleSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError({ field: 'body', reason: parsed.error.message });
    return this.admin.manualSettleMarket(this.actor(req), { ...parsed.data, marketId: id });
  }

  /** POST /v1/admin/betting/markets/:id/dispute — ouverture litige (gel ≤ 72 h, INV-19). */
  @Post('betting/markets/:id/dispute')
  @HttpCode(200)
  dispute(@Req() req: AuthedRequest, @Param('id') id: string, @Body() body: { reason: z.infer<typeof DisputeReasonSchema> }) {
    const parsed = DisputeReasonSchema.safeParse(body?.reason);
    if (!parsed.success) throw new ValidationError({ field: 'reason', reason: parsed.error.message });
    return this.admin.openDispute(this.actor(req), id, parsed.data);
  }

  /** POST /v1/admin/betting/markets/:id/dispute/resolve — tranche le litige (ADMIN only). */
  @Roles('ADMIN')
  @Post('betting/markets/:id/dispute/resolve')
  @HttpCode(200)
  async resolve(@Req() req: AuthedRequest, @Param('id') id: string, @Body() body: unknown) {
    const parsed = DisputeResolveSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError({ field: 'body', reason: parsed.error.message });
    return this.admin.resolveDispute(this.actor(req), id, parsed.data.outcome, parsed.data.note);
  }

  /** POST /v1/admin/sanctions — émission auditée. */
  @Post('sanctions')
  async sanction(@Req() req: AuthedRequest, @Body() body: unknown) {
    const parsed = SanctionSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError({ field: 'body', reason: parsed.error.message });
    return this.admin.issueSanction(this.actor(req), parsed.data);
  }

  /** POST /v1/admin/servers/:id/drain — maintenance flotte. */
  @Post('servers/:id/drain')
  @HttpCode(200)
  drain(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.admin.drainServer(this.actor(req), id);
  }

  /** GET /v1/admin/audit?targetType=&targetId=&limit= — consultation journal append-only. */
  @Get('audit')
  getAuditLog(@Query('targetType') targetType?: string, @Query('targetId') targetId?: string, @Query('limit') limit?: string) {
    return this.audit.search({ targetType, targetId, limit: limit ? Number(limit) : undefined });
  }
}