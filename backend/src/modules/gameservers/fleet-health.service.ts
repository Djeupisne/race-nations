/**
 * fleet-health.service.ts — watchdog de la flotte (cron interne, docs/stability.md).
 * Toutes les 10 s :
 *  - heartbeat manquant > 30 s sur un serveur REGISTERED/RESERVED → statut OFFLINE ;
 *  - les matchs WAITING_FOR_PLAYERS/LOADING attachés à un serveur mort retournent en
 *    file (ticket remis en QUEUED par matchmaking.worker via l'événement) ;
 *  - journalise un compteur d'incidents (observability.md §5 "fleet").
 * Ne touche JAMAIS les fonds : un match en IN_PROGRESS sur serveur mort est INVALIDÉ
 * côté résultats (result-validator), jamais réglé arbitrairement.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { CLOCK, type Clock } from '../../common/utils/clock';

const STALE_MS = 30_000;

@Injectable()
export class FleetHealthService {
  private readonly logger = new Logger(FleetHealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  @Interval(10_000)
  async sweep(): Promise<void> {
    const now = this.clock.nowMs();
    const cutoff = new Date(now - STALE_MS);
    const dead = await this.prisma.gameServer.findMany({
      where: { status: { in: ['REGISTERED', 'RESERVED'] }, lastHeartbeatAt: { lt: cutoff } },
      select: { id: true, hostname: true },
    });
    if (dead.length === 0) return;

    for (const s of dead) {
      await this.prisma.gameServer.update({ where: { id: s.id }, data: { status: 'OFFLINE' } });
      // Matchs non terminés orphelins → INVALIDATED (le settlement bet passera en litige/refund).
      const orphanCount = await this.prisma.match.updateMany({
        where: { serverId: s.id, status: { in: ['WAITING_FOR_PLAYERS', 'LOADING', 'IN_PROGRESS'] } },
        data: { status: 'INVALIDATED', invalidatedReason: 'SERVER_LOST', finishedAt: new Date(now) },
      });
      this.logger.warn(`Fleet health: server ${s.hostname} OFFLINE (stale heartbeat), ${orphanCount.count} match(es) invalidated`);
    }
  }

  /** Nombre de serveurs prêts — consommé par health.indicator gameservers. */
  async readyCount(): Promise<number> {
    const now = this.clock.nowMs();
    return this.prisma.gameServer.count({
      where: { status: 'REGISTERED', lastHeartbeatAt: { gte: new Date(now - STALE_MS) } },
    });
  }
}
