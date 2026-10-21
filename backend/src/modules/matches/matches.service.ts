/**
 * matches.service.ts — cycle de vie Match (docs/api.md §4, machine d'état INV-22/25).
 * Les transitions WAITING→LOADING→IN_PROGRESS→FINISHED sont pilotées par le game server
 * (routes ServerAuthGuard) ; FINISHED→FINISHED_VALIDATED arrive via result-validator
 * (INV-25/26) puis déclenche le settlement (match-settlement.service). INVALIDATED est
 * terminal et route vers les litiges paris (jamais un règlement arbitraire des fonds).
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Match, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CLOCK, type Clock } from '../../common/utils/clock';
import { assertMatchTransition } from '../../common/state-machines/match.state-machine';
import { NotFoundError, ValidationError } from '../../common/errors/domain-errors';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Lecture publique profil réduit (pas de secrets serveur). */
  async getMatch(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { players: { include: { player: { select: { id: true, username: true, nationality: true, plPoints: true } } } } },
    });
    if (!match) throw new NotFoundError('Match', matchId);
    return match;
  }

  /** Historique d'un joueur (pagination curseur simple sur createdAt/id). */
  async historyForPlayer(playerId: string, query: { limit: number; cursor?: string }) {
    const where: Prisma.MatchWhereInput = {};
    if (query.cursor) where.createdAt = { lt: new Date(query.cursor) };
    const rows = await this.prisma.match.findMany({
      where: { ...where, players: { some: { playerId } } },
      orderBy: [{ createdAt: 'desc' }],
      take: query.limit + 1,
      include: { players: true },
    });
    const hasMore = rows.length > query.limit;
    return { items: rows.slice(0, query.limit), nextCursor: hasMore ? rows[query.limit - 1].createdAt.toISOString() : null };
  }

  /** JOIN : un joueur rejoint un match WAITING_FOR_PLAYERS assigné (ticket MATCHED). */
  async join(matchId: string, playerId: string): Promise<Match> {
    return this.prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({ where: { id: matchId }, include: { players: true } });
      if (!match) throw new NotFoundError('Match', matchId);
      if (match.status !== 'WAITING_FOR_PLAYERS') {
        throw new ValidationError({ field: 'status', reason: `Match is ${match.status}; joining requires WAITING_FOR_PLAYERS.` });
      }
      if (!match.players.some((p) => p.playerId === playerId)) {
        throw new ValidationError({ field: 'playerId', reason: 'Not invited to this match.' });
      }
      // Tous les joueurs présents → LOADING (transition graphe, idempotente si déjà avancé).
      const allJoined = match.players.length >= 2; // v1 1v1 : 2 participants max requis
      if (allJoined && match.status === 'WAITING_FOR_PLAYERS') {
        assertMatchTransition(match.status, 'LOADING');
        return tx.match.update({ where: { id: matchId }, data: { status: 'LOADING' } });
      }
      return match;
    });
  }

  /** Callback serveur : statut de la course (LOADING→IN_PROGRESS, IN_PROGRESS→FINISHED). */
  async updateStatusFromServer(matchId: string, to: 'LOADING' | 'IN_PROGRESS' | 'FINISHED'): Promise<Match> {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundError('Match', matchId);
    if (match.status === to) return match; // heartbeat dupliqué → no-op idempotent
    assertMatchTransition(match.status, to);
    const data: Prisma.MatchUpdateInput = { status: to };
    if (to === 'IN_PROGRESS') data.startedAt = new Date(this.clock.nowMs());
    if (to === 'FINISHED') data.finishedAt = new Date(this.clock.nowMs());
    this.logger.log(`Match ${matchId}: ${match.status} -> ${to}`);
    return this.prisma.match.update({ where: { id: matchId }, data });
  }

  /**
   * Résultat VALIDÉ par result-validator → FINISHED_VALIDATED (terminal, gate INV-24).
   * Écrit aussi positions/outcomes bruts dans MatchPlayer pour audit (les récompenses
   * chiffrées sont calculées par match-settlement, source unique INV-32).
   */
  async markValidated(matchId: string, rows: Array<{ playerId: string; position: number; finishMs: number; bestLapMs?: number; driftPoints?: number }>): Promise<Match> {
    return this.prisma.$transaction(async (tx) => {
      const match = await tx.match.findUniqueOrThrow({ where: { id: matchId } });
      if (match.status === 'FINISHED_VALIDATED') return match; // replay webhook/résultat dupliqué
      assertMatchTransition(match.status, 'FINISHED_VALIDATED');
      for (const r of rows) {
        await tx.matchPlayer.update({
          where: { matchId_playerId: { matchId, playerId: r.playerId } },
          data: { position: r.position, finishMs: r.finishMs, bestLapMs: r.bestLapMs, driftPoints: r.driftPoints ?? 0 },
        });
      }
      return tx.match.update({
        where: { id: matchId },
        data: { status: 'FINISHED_VALIDATED', validatedAt: new Date(this.clock.nowMs()) },
      });
    });
  }

  /** Invalidation (refus résultat / panne serveur) — terminal, motive les litiges INV-18/19. */
  async invalidate(matchId: string, reason: string): Promise<Match> {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundError('Match', matchId);
    if (match.status === 'INVALIDATED') return match;
    assertMatchTransition(match.status, 'INVALIDATED');
    this.logger.warn(`Match ${matchId} INVALIDATED: ${reason}`);
    return this.prisma.match.update({
      where: { id: matchId },
      data: { status: 'INVALIDATED', invalidatedReason: reason, finishedAt: match.finishedAt ?? new Date(this.clock.nowMs()) },
    });
  }

  /** Libération du serveur après terminal (count activeMatches -1, clamp ≥ 0). */
  async releaseServer(serverId: string): Promise<void> {
    await this.prisma.gameServer.updateMany({
      where: { id: serverId, activeMatches: { gt: 0 } },
      data: { activeMatches: { decrement: 1 } },
    });
    await this.prisma.gameServer.updateMany({
      where: { id: serverId, status: 'RESERVED', activeMatches: 0 },
      data: { status: 'REGISTERED' },
    });
  }
}
