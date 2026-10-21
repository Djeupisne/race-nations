/**
 * matches.controller.ts — API publique/serveur des matchs (docs/api.md §4).
 * Routes joueur : JWT global + ownership. Routes game server : ServerAuthGuard (HMAC INV-26),
 * jamais accessibles à un JWT joueur. Les transitions d'état sont validées par la machine
 * Match côté service — le controller ne fait que router et authentifier.
 */
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JoinMatchInputSchema, type JoinMatchInput } from '@race-nations/api-contracts';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ServerAuthGuard } from '../../common/guards/server-auth.guard';
import { ownership, OwnershipGuard } from '../../common/guards/ownership.guard';
import type { AuthenticatedUser } from '../auth/auth.dto';
import { MatchesService } from './matches.service';
import { MatchSettlementService } from './match-settlement.service';

const joinPipe = new ZodValidationPipe(JoinMatchInputSchema);
const StatusReportSchema = z
  .object({ status: z.enum(['LOADING', 'IN_PROGRESS', 'FINISHED']) })
  .strict();
const InvalidateSchema = z.object({ reason: z.string().min(3).max(500) }).strict();

@Controller('v1/matches')
export class MatchesController {
  constructor(
    private readonly matches: MatchesService,
    private readonly settlement: MatchSettlementService,
  ) {}

  /** GET /v1/matches/:id — fiche match (joueurs, statut, piste). */
  @Get(':id')
  get(@Param('id') id: string) {
    return this.matches.getMatch(id);
  }

  /** GET /v1/matches/me/history — mes courses passées. */
  @Get('me/history')
  @UseGuards(OwnershipGuard)
  @ownership({ resource: 'self' })
  history(@CurrentUser() user: AuthenticatedUser, @Query('limit') limit?: string, @Query('cursor') cursor?: string) {
    return this.matches.historyForPlayer(user.playerId, { limit: Math.min(parseInt(limit ?? '20', 10) || 20, 50), cursor });
  }

  /** POST /v1/matches/:id/join — acceptation après assignation matchmaking. */
  @Post(':id/join')
  @UseGuards(OwnershipGuard)
  @ownership({ resource: 'matchParticipant' })
  join(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body(joinPipe) body: JoinMatchInput) {
    // body.matchId contrôlé égal à :id (le pipe strict l'a validé ; cohérence défensive ici).
    if (body.matchId !== id) {
      return Promise.reject(new Error('path/body matchId mismatch'));
    }
    return this.matches.join(id, user.playerId);
  }

  /* --------------------------- Routes game server -------------------------- */

  /** PATCH /v1/matches/:id/status — progression de course signalée par le serveur dédié. */
  @Post(':id/status-report')
  @UseGuards(ServerAuthGuard)
  statusReport(@Param('id') id: string, @Body(new ZodValidationPipe(StatusReportSchema)) body: { status: 'LOADING' | 'IN_PROGRESS' | 'FINISHED' }) {
    return this.matches.updateStatusFromServer(id, body.status);
  }

  /** POST /v1/matches/:id/invalidate — le serveur s'auto-invalide (crash, anti-triche). */
  @Post(':id/invalidate')
  @UseGuards(ServerAuthGuard)
  async invalidateByServer(@Param('id') id: string, @Body(new ZodValidationPipe(InvalidateSchema)) body: { reason: string }) {
    const m = await this.matches.invalidate(id, `SERVER:${body.reason}`);
    await this.settlement.handleInvalidatedMatch(id, body.reason);
    return m;
  }

  /** POST /v1/matches/:id/settle — rejeu manuel du règlement (ADMIN, runbook §6). */
  @Post(':id/settle')
  @Roles('ADMIN')
  async manualSettle(@Param('id') id: string) {
    await this.settlement.settleValidatedMatch(id);
    return { ok: true };
  }
}
