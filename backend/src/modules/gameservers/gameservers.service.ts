/**
 * gameservers.service.ts — gestion de la flotte de game servers (docs/networking.md).
 * Machine à états : REGISTERED → RESERVED → DRAINING → OFFLINE (game-server.state-machine).
 * - allocate() : choix du serveur REGISTERED le moins chargé dans la région demandée ;
 *   la réservation est une UPDATE conditionnelle (count===1) pour éviter la double
 *   attribution en concurrence (pas de SELECT FOR UPDATE ici : colonne compteur atomique).
 * - heartbeat() : rafraîchit lastHeartbeatAt ; un serveur sans HB depuis 30 s est
 *   considéré mort par fleet-health (marquage OFFLINE + réaffectation des matchs vides).
 * - drain : arrêt gracieux — plus d'allocation, les matchs en cours terminent.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { GameServer, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CLOCK, type Clock } from '../../common/utils/clock';
import { assertGameServerTransition } from '../../common/state-machines/game-server.state-machine';
import { InvalidStateTransitionError, NotFoundError, ServerUnavailableError } from '../../common/errors/domain-errors';

const HEARTBEAT_STALE_MS = 30_000;

@Injectable()
export class GameserversService {
  private readonly logger = new Logger(GameserversService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Enregistrement au boot du game server (route signée ServerAuthGuard). */
  async register(input: { hostname: string; wsUrl: string; region: string; capacity?: number }): Promise<GameServer> {
    const existing = await this.prisma.gameServer.findUnique({ where: { hostname: input.hostname } });
    if (existing) {
      return this.prisma.gameServer.update({
        where: { id: existing.id },
        data: { wsUrl: input.wsUrl, region: input.region, status: 'REGISTERED', lastHeartbeatAt: new Date(this.clock.nowMs()) },
      });
    }
    return this.prisma.gameServer.create({
      data: {
        hostname: input.hostname,
        wsUrl: input.wsUrl,
        region: input.region,
        capacity: input.capacity ?? 8,
        status: 'REGISTERED',
        sharedSecretRef: `kms:gameserver/${input.hostname}`,
        lastHeartbeatAt: new Date(this.clock.nowMs()),
      },
    });
  }

  /**
   * Allocation pour un match : serveur REGISTERED de la région, moins chargé, avec
   * capacité restante. UPDATE WHERE status='REGISTERED' AND activeMatches < capacity
   * → count===1 garantit l'exclusivité en concurrence (deux allocations parallèles ne
   * peuvent pas prendre la même dernière place).
   */
  async allocate(region: string): Promise<{ serverId: string; wsUrl: string }> {
    const candidates = await this.prisma.gameServer.findMany({
      where: { region, status: 'REGISTERED', activeMatches: { lt: this.prisma.gameServer.fields ? undefined : undefined } as never },
      orderBy: [{ activeMatches: 'asc' }, { lastHeartbeatAt: 'desc' }],
      take: 5,
      select: { id: true, wsUrl: true, capacity: true, activeMatches: true },
    });
    for (const c of candidates) {
      if (c.activeMatches >= c.capacity) continue;
      const updated = await this.prisma.gameServer.updateMany({
        where: { id: c.id, status: 'REGISTERED', activeMatches: { lt: c.capacity } },
        data: { activeMatches: { increment: 1 } },
      });
      if (updated.count === 1) {
        return { serverId: c.id, wsUrl: c.wsUrl };
      }
    }
    throw new ServerUnavailableError(`No game server available in region ${region}.`);
  }

  /** Libération après fin de match (settlement) — décrément plancher 0. */
  async release(serverId: string): Promise<void> {
    const server = await this.prisma.gameServer.findUnique({ where: { id: serverId } });
    if (!server) return; // déjà retiré de la flotte — no-op
    await this.prisma.gameServer.update({
      where: { id: serverId },
      data: { activeMatches: Math.max(0, server.activeMatches - 1) },
    });
  }

  /** Heartbeat signé : rafraîchit l'horodatage + renvoie la consigne (continue|drain). */
  async heartbeat(serverId: string, activeMatches: number) {
    const server = await this.prisma.gameServer.findUnique({ where: { id: serverId } });
    if (!server) throw new NotFoundError('GameServer', serverId);
    await this.prisma.gameServer.update({
      where: { id: serverId },
      data: { lastHeartbeatAt: new Date(this.clock.nowMs()), activeMatches: Math.max(0, Math.floor(activeMatches)) },
    });
    return { command: server.status === 'DRAINING' ? 'drain' : 'continue' as const };
  }

  /** Drain gracieux (admin ou shutdown planifié). */
  async drain(serverId: string): Promise<void> {
    const server = await this.prisma.gameServer.findUnique({ where: { id: serverId } });
    if (!server) throw new NotFoundError('GameServer', serverId);
    assertGameServerTransition(server.status, 'DRAINING');
    await this.prisma.gameServer.update({
      where: { id: serverId },
      data: { status: 'DRAINING', drainedAt: new Date(this.clock.nowMs()) },
    });
  }

  /** Passage OFFLINE explicite (après drain complet ou retrait manuel). */
  async retire(serverId: string): Promise<void> {
    const server = await this.prisma.gameServer.findUnique({ where: { id: serverId } });
    if (!server) throw new NotFoundError('GameServer', serverId);
    assertGameServerTransition(server.status, 'OFFLINE');
    await this.prisma.gameServer.update({ where: { id: serverId }, data: { status: 'OFFLINE' } });
  }

  /** Vue flotte pour l'admin/health indicator. */
  async fleet(): Promise<Array<{ id: string; hostname: string; region: string; status: GameServer['status']; activeMatches: number; capacity: number; stale: boolean }>> {
    const now = this.clock.nowMs();
    const servers = await this.prisma.gameServer.findMany({ orderBy: [{ region: 'asc' }, { hostname: 'asc' }] });
    return servers.map((s) => ({
      id: s.id,
      hostname: s.hostname,
      region: s.region,
      status: s.status,
      activeMatches: s.activeMatches,
      capacity: s.capacity,
      stale: !s.lastHeartbeatAt || now - s.lastHeartbeatAt.getTime() > HEARTBEAT_STALE_MS,
    }));
  }
}
