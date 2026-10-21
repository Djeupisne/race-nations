/**
 * betting.controller.ts — API publique des paris (docs/api.md §5, shared/api-contracts/src/betting.ts).
 * Zod partout (DTOs = schémas contrats), guards : JWT global (deny-by-default INV-28),
 * ownership sur les actions sensibles, rate-limit fail-closed sur l'écriture d'argent.
 * Le countryCode de juridiction est TOUJOURS lu du profil serveur (jamais du client).
 */
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  CreateMarketInputSchema,
  AcceptChallengeInputSchema,
  ListMarketsQuerySchema,
  OpenDisputeInputSchema,
} from '@race-nations/api-contracts';
import { ZodValidationPipe, zodQueryPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OwnershipGuard } from '../../common/guards/ownership.guard';
import { RateLimitGuard, rateLimit } from '../../common/guards/rate-limit.guard';
import type { AuthenticatedUser } from '../auth/auth.dto';
import { BettingService } from './betting.service';
import { BetSettlementService } from './bet-settlement.service';
import { BetLimitsService } from './bet-limits.service';
import { PrismaService } from '../../prisma/prisma.service';

const createMarketPipe = new ZodValidationPipe(CreateMarketInputSchema);
const acceptPipe = new ZodValidationPipe(AcceptChallengeInputSchema);
const disputePipe = new ZodValidationPipe(OpenDisputeInputSchema);

@Controller('v1/betting')
export class BettingController {
  constructor(
    private readonly betting: BettingService,
    private readonly settlement: BetSettlementService,
    private readonly limits: BetLimitsService,
    private readonly prisma: PrismaService,
  ) {}

  /** POST /v1/betting/markets — créer un défi 1v1 (escrow créateur à terme via join flow). */
  @Post('markets')
  @UseGuards(RateLimitGuard)
  @rateLimit({ keyPrefix: 'bet:create', limit: 10, windowSeconds: 60 })
  async createMarket(@CurrentUser() user: AuthenticatedUser, @Body(createMarketPipe) body: CreateMarketInputSchemaType) {
    const player = await this.mustPlayer(user);
    return this.betting.createMarket({ creator: player, ...body });
  }

  /** POST /v1/betting/markets/:id/join — accepter un défi : escrow atomique + verrouillage. */
  @Post('markets/:id/join')
  @UseGuards(RateLimitGuard)
  @rateLimit({ keyPrefix: 'bet:join', limit: 20, windowSeconds: 60 })
  joinMarket(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body(acceptPipe) _body: unknown) {
    return this.mustPlayer(user).then((player) => this.betting.joinMarket(id, player));
  }

  /** GET /v1/betting/markets — liste filtrable (statut, devise, piste). */
  @Get('markets')
  listMarkets(@Query(zodQueryPipe(ListMarketsQuerySchema)) query: ListMarketsQueryType) {
    return this.betting.listMarkets(query as { status?: string; currency?: string; trackId?: string; limit: number; cursor?: string });
  }

  /** GET /v1/betting/markets/:id — détail marché + positions. */
  @Get('markets/:id')
  getMarket(@Param('id') id: string) {
    return this.betting.getMarket(id);
  }

  /** GET /v1/betting/markets/:id/odds — cotes implicites live (mutuel, INV-08). */
  @Get('markets/:id/odds')
  odds(@Param('id') id: string) {
    return this.betting.oddsOf(id);
  }

  /** GET /v1/betting/me — mes positions. */
  @Get('me')
  myBets(@CurrentUser() user: AuthenticatedUser, @Query('status') status?: string) {
    return this.mustPlayer(user).then((p) => this.betting.myBets(p.id, status));
  }

  /** GET /v1/betting/limits — consommation fenêtre glissante (jeu responsable, INV-12). */
  @Get('limits')
  async limitsUsage(@CurrentUser() user: AuthenticatedUser) {
    const p = await this.mustPlayer(user);
    return {
      soft: await this.limits.usage(p.id, 'SOFT'),
      hard: await this.limits.usage(p.id, 'HARD'),
      reputation: p.reputation,
      minReputationHard: 30,
    };
  }

  /** POST /v1/betting/markets/:id/cancel — créateur seul, avant engagement adverse. */
  @Post('markets/:id/cancel')
  @UseGuards(OwnershipGuard)
  async cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const player = await this.mustPlayer(user);
    return this.betting.cancelMarket(id, player);
  }

  /** POST /v1/betting/markets/:id/dispute — ouverture litige par un participant impliqué. */
  @Post('markets/:id/dispute')
  async dispute(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body(disputePipe) body: DisputeBody) {
    const player = await this.mustPlayer(user);
    const involved = await this.prisma.bet.findUnique({ where: { marketId_playerId: { marketId: id, playerId: player.id } } });
    if (!involved && (await this.prisma.betMarket.findUnique({ where: { id }, select: { creatorId: true } }))?.creatorId !== player.id) {
      // Non-participant → 403 sémantique via erreur domain existante.
      const { ForbiddenAdminError } = await import('../../common/errors/domain-errors');
      throw new ForbiddenAdminError({}, 'Only participants can open a dispute.');
    }
    await this.settlement.openDispute(id, body.reason);
    return { ok: true };
  }

  /** POST /v1/betting/markets/:id/settle — settlement MANUEL admin (runbook §6 ; sinon outbox). */
  @Post('markets/:id/settle')
  @Roles('ADMIN')
  manualSettle(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() body: { winningSide?: number; push?: boolean }) {
    return this.settlement.settleMarket({ marketId: id, winningSide: body.winningSide, push: body.push, settledById: user.userId });
  }

  /** POST /v1/betting/markets/:id/dispute/resolve — résolution admin litige (INV-19 ≤72 h). */
  @Post('markets/:id/dispute/resolve')
  @Roles('MODERATOR', 'ADMIN')
  async resolveDispute(@Param('id') id: string, @Body() body: { outcome: 'REFUND_ALL' | 'UPHELD' }) {
    await this.settlement.resolveDispute(id, body.outcome);
    return { ok: true };
  }

  private async mustPlayer(user: AuthenticatedUser) {
    const player = await this.prisma.player.findUnique({ where: { id: user.playerId } });
    if (!player) {
      const { NotFoundError } = await import('../../common/errors/domain-errors');
      throw new NotFoundError('Player', user.playerId);
    }
    return player;
  }
}

/* Types inférés des schémas contrats (alias locaux pour lisibilité du handler). */
type CreateMarketInputSchemaType = import('@race-nations/api-contracts').CreateMarketInput;
type ListMarketsQueryType = import('@race-nations/api-contracts').ListMarketsQuery;
type DisputeBody = import('@race-nations/api-contracts').OpenDisputeInput;
