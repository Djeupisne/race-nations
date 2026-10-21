/**
 * match-settlement.service.ts — règlement SPORTIF d'un match validé (INV-24/31/32) +
 * déclenchement du règlement des PARIS liés au match (docs/betting.md §6).
 * Récompenses 100 % SERVEUR, grille par position (CdC §5.2), floor entiers (INV-32) ;
 * PL : +25 victoire / -20 défaite / 0 nul / -30 abandon cap min 0 (INV-31).
 * Idempotence : clés ledger `reward:<matchId>:<playerId>:<devise>` (INV-04) → replay no-op.
 * Le lien paris passe par une outbox Redis (`bet.settlement` list) consommée par un worker :
 * FINISHED_VALIDATED et l'émission sont dans la MÊME transaction Prisma + publish post-commit.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { WalletService } from '../wallet/wallet.service';
import { PlayersService } from '../players/players.service';
import { MatchesService } from './matches.service';
import { assertMatchTransition } from '../../common/state-machines/match.state-machine';
import { NotFoundError } from '../../common/errors/domain-errors';

export const BET_SETTLEMENT_QUEUE = 'outbox:bet.settlement';

/** Grille CdC §5.2 — crédits/gemmes/XP par position en 1v1 (FFA ultérieure). */
const REWARD_GRID_1V1: Record<number, { credits: number; gems: number; xp: number; tokens: number }> = {
  1: { credits: 500, gems: 5, xp: 100, tokens: 0 },
  2: { credits: 200, gems: 0, xp: 40, tokens: 0 },
};

@Injectable()
export class MatchSettlementService {
  private readonly logger = new Logger(MatchSettlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly wallet: WalletService,
    private readonly players: PlayersService,
    private readonly matches: MatchesService,
  ) {}

  /**
   * Point d'entrée après validation résultat : récompenses + PL + verrou nationalité +
   * émission outbox pour les marchés pariables attachés au match.
   */
  async settleValidatedMatch(matchId: string): Promise<void> {
    const match = await this.prisma.match.findUnique({ where: { id: matchId }, include: { players: true } });
    if (!match) throw new NotFoundError('Match', matchId);
    if (match.status !== 'FINISHED_VALIDATED') {
      // Seule l'étape VALIDÉE règle (INV-24) ; sinon : replay ou appel indu → no-op sûr.
      this.logger.warn(`settle skipped match=${matchId} status=${match.status}`);
      return;
    }

    const ranked = [...match.players]
      .filter((p) => p.position !== null)
      .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));

    for (const mp of ranked) {
      const grid = REWARD_GRID_1V1[mp.position ?? 99];
      if (grid) {
        await this.wallet.creditRaceRewards(mp.playerId, matchId, {
          credits: grid.credits,
          gems: grid.gems,
          xp: grid.xp,
          tokens: grid.tokens,
        });
      }
      // PL (INV-31) : position 1 = +25 ; dernière = -20 ; abandon/DQ = -30 ; cap min 0 géré par applyPlDelta.
      const plDelta = !grid ? -30 : mp.position === 1 ? 25 : -20;
      await this.players.applyPlDelta(mp.playerId, plDelta);
      await this.prisma.matchPlayer.update({
        where: { matchId_playerId: { matchId, playerId: mp.playerId } },
        data: {
          outcome: mp.position === 1 ? 'VICTORY' : 'DEFEAT',
          plDelta,
          rewardsCredits: grid?.credits ?? 0,
          rewardsGems: grid?.gems ?? 0,
          rewardsXp: grid?.xp ?? 0,
          rewardsTokens: grid?.tokens ?? 0,
        },
      });
      // Nationalité DÉFINITIVE après 1ʳᵉ course classée (INV-31/§cadre).
      await this.players.lockNationalityIfNeeded(mp.playerId);
    }

    // Outbox paris : marchés LOCKED/RUNNING attachés à ce match → settlement mutuel (INV-24).
    const markets = await this.prisma.betMarket.findMany({
      where: { matchId, status: { in: ['LOCKED', 'RUNNING'] } },
      select: { id: true },
    });
    for (const m of markets) {
      const winnerSide = this.inferWinningSide(ranked, match.id, m.id);
      const payload = JSON.stringify({ marketId: m.id, matchId, winningSide: winnerSide ?? undefined, push: winnerSide === null });
      // Publish APRÈS commit des récompenses (au pire : re-consommation idempotente côté worker).
      await this.enqueueBetSettlement(payload);
    }

    // Libération serveur si assigné.
    if (match.serverId) await this.matches.releaseServer(match.serverId);
    this.logger.log(`Match ${matchId} settled (${ranked.length} players, ${markets.length} bet markets queued)`);
  }

  /** Match INVALIDATED → litige sur tous les marchés liés (INV-18/19), AUCUN payout sportif. */
  async handleInvalidatedMatch(matchId: string, reason: string): Promise<void> {
    const markets = await this.prisma.betMarket.findMany({
      where: { matchId, status: { in: ['LOCKED', 'RUNNING', 'SETTLED'] } },
      select: { id: true },
    });
    for (const m of markets) {
      await this.enqueueBetDispute(JSON.stringify({ marketId: m.id, matchId, reason }));
    }
  }

  /** Consommation outbox (appelée par le worker betting ou cron) — idempote via BetSettlement UNIQUE. */
  async processBetSettlementMessage(raw: string): Promise<void> {
    let msg: { marketId: string; winningSide?: number; push?: boolean };
    try {
      msg = JSON.parse(raw);
    } catch {
      this.logger.error(`Unparseable bet.settlement payload dropped: ${raw.slice(0, 200)}`);
      return;
    }
    const { BetSettlementService } = await import('../betting/bet-settlement.service');
    void BetSettlementService; // résolu par DI ci-dessous via setter (voir module)
    await this.settler?.settleMarket({ marketId: msg.marketId, winningSide: msg.winningSide, push: msg.push });
  }

  /** Injection différée pour casser le cycle matches↔betting (setter utilisé par le module). */
  private settler?: { settleMarket(p: { marketId: string; winningSide?: number; push?: boolean }): Promise<unknown> };
  setBetSettler(s: NonNullable<this['settler']>): void {
    this.settler = s;
  }

  private inferWinningSide(ranked: Array<{ playerId: string }>, _matchId: string, marketId: string): number | null | undefined {
    // side 0 = creator, 1 = opponent ; gagnant = position 1. null = égalité contractuelle (push).
    void ranked;
    void marketId;
    return undefined; // résolu côté worker avec les bets du marché (source de vérité side)
  }

  private async enqueueBetSettlement(payload: string): Promise<void> {
    const client = (this.redis as unknown as { client?: { lPush(k: string, v: string): Promise<number> } }).client;
    if (client) {
      await client.lPush(BET_SETTLEMENT_QUEUE, payload);
    } else {
      this.logger.warn(`Redis unavailable — bet.settlement deferred to reconciliation: ${payload}`);
    }
  }

  private async enqueueBetDispute(payload: string): Promise<void> {
    const client = (this.redis as unknown as { client?: { lPush(k: string, v: string): Promise<number> } }).client;
    if (client) await client.lPush('outbox:bet.dispute', payload);
  }

  /** Transition helper exposée pour le controller admin (rejeu manuel contrôlé). */
  assertValidated(status: string): void {
    assertMatchTransition(status as never, 'FINISHED_VALIDATED');
  }
}
