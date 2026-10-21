/**
 * matchmaking.service.ts — files de match (docs/api.md §4, machine Ticket INV-22).
 * Un joueur = UN ticket actif par mode. Le worker (matchmaking.worker) apparie ; ici :
 * enqueue / status / cancel. Expiration contractuelle par mode (CdC §4.1) :
 * classée 120 s, rapide 60 s, BR 120 s — stockée en expiresAt, scannée par le worker.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { MatchmakingTicket, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CLOCK, type Clock } from '../../common/utils/clock';
import { assertTicketTransition } from '../../common/state-machines/ticket.state-machine';
import { NotFoundError, ValidationError } from '../../common/errors/domain-errors';

/** Durées max d'attente par mode (ms) — CdC game-modes §4.1. */
const QUEUE_TTL_MS: Record<string, number> = {
  RANKED_1V1: 120_000,
  RANKED_FFA: 120_000,
  QUICK_RACE: 60_000,
  BATTLE_ROYALE: 120_000,
  TOURNAMENT: 300_000,
  CLAN_WARS: 180_000,
  PRACTICE: 60_000,
};

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** POST /v1/matchmaking/queue — crée un ticket QUEUED (refus si déjà en file sur ce mode). */
  async enqueue(playerId: string, mode: string, preferredTrackId?: string): Promise<{ ticketId: string; estimatedWaitMs: number }> {
    const player = await this.prisma.player.findUnique({ where: { id: playerId }, select: { plPoints: true } });
    if (!player) throw new NotFoundError('Player', playerId);

    const active = await this.prisma.matchmakingTicket.findFirst({
      where: { playerId, mode: mode as never, status: { in: ['QUEUED', 'MATCHED'] } },
      select: { id: true },
    });
    if (active) throw new ValidationError({ field: 'mode', reason: `Already queued (ticket ${active.id}).` });

    const ttl = QUEUE_TTL_MS[mode] ?? 120_000;
    const now = this.clock.nowMs();
    const ticket = await this.prisma.matchmakingTicket.create({
      data: {
        playerId,
        mode: mode as never,
        status: 'QUEUED',
        plAtQueue: player.plPoints,
        requestedAt: new Date(now),
        expiresAt: new Date(now + ttl),
      },
    });
    void preferredTrackId; // PRACTICE uniquement — réservé phase rooms
    const queueDepth = await this.prisma.matchmakingTicket.count({ where: { mode: mode as never, status: 'QUEUED' } });
    const estimatedWaitMs = Math.min(ttl, Math.max(5_000, queueDepth * 3_000));
    this.logger.log(`Queued ticket=${ticket.id} player=${playerId} mode=${mode} pl=${player.plPoints}`);
    return { ticketId: ticket.id, estimatedWaitMs };
  }

  /** GET /v1/matchmaking/ticket/:id — état + position estimée dans la file. */
  async ticket(ticketId: string, ownerId: string): Promise<MatchmakingTicket & { queuePosition: number | null }> {
    const t = await this.prisma.matchmakingTicket.findUnique({ where: { id: ticketId } });
    if (!t) throw new NotFoundError('MatchmakingTicket', ticketId);
    if (t.playerId !== ownerId) throw new NotFoundError('MatchmakingTicket', ticketId); // pas de fuite d'existence
    let queuePosition: number | null = null;
    if (t.status === 'QUEUED') {
      queuePosition = await this.prisma.matchmakingTicket.count({
        where: { mode: t.mode, status: 'QUEUED', requestedAt: { lt: t.requestedAt } },
      });
    }
    return { ...t, queuePosition };
  }

  /** DELETE /v1/matchmaking/queue/:id — annulation joueur (QUEUED/MATCHED → CANCELLED, INV-22). */
  async cancel(ticketId: string, playerId: string, reason = 'PLAYER_CANCEL'): Promise<MatchmakingTicket> {
    const t = await this.prisma.matchmakingTicket.findUnique({ where: { id: ticketId } });
    if (!t) throw new NotFoundError('MatchmakingTicket', ticketId);
    if (t.playerId !== playerId) throw new NotFoundError('MatchmakingTicket', ticketId);
    if (t.status === 'CANCELLED') return t; // idempotent
    assertTicketTransition(t.status, 'CANCELLED');
    return this.prisma.matchmakingTicket.update({
      where: { id: ticketId },
      data: { status: 'CANCELLED', cancelReason: reason },
    });
  }

  /** Mes tickets actifs (lobby UI). */
  async myActiveTickets(playerId: string) {
    return this.prisma.matchmakingTicket.findMany({
      where: { playerId, status: { in: ['QUEUED', 'MATCHED', 'JOINED'] } },
      orderBy: { requestedAt: 'desc' },
    });
  }

  /** Profondeurs de files pour supervision/admin + estimation client. */
  async queueStats(): Promise<Array<{ mode: string; depth: number }>> {
    const grouped = await this.prisma.matchmakingTicket.groupBy({
      by: ['mode'],
      where: { status: 'QUEUED' },
      _count: { _all: true },
    });
    return grouped.map((g) => ({ mode: g.mode, depth: g._count._all }));
  }

  /** Recherche de partenaire pour le worker : même mode, PL dans la fenêtre, FIFO. */
  findCandidates(plCenter: number, plWindow: number, excludeTicketId: string, mode: string, limit = 10): Promise<Prisma.PickEnumerable<MatchmakingTicket, 'id' | 'playerId' | 'plAtQueue'>[]> {
    return this.prisma.matchmakingTicket.findMany({
      where: {
        mode: mode as never,
        status: 'QUEUED',
        id: { not: excludeTicketId },
        plAtQueue: { gte: plCenter - plWindow, lte: plCenter + plWindow },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date(this.clock.nowMs()) } }],
      },
      orderBy: { requestedAt: 'asc' },
      take: limit,
      select: { id: true, playerId: true, plAtQueue: true },
    }) as Promise<Prisma.PickEnumerable<MatchmakingTicket, 'id' | 'playerId' | 'plAtQueue'>[]>;
  }
}
