/**
 * matchmaking.worker.ts — cerveau d'appariement (docs/api.md §4, INV-22 machine Ticket).
 * Tick 500 ms : scan des tickets QUEUED par mode, fenêtre PL dynamique (±200 → ±500
 * selon attente, CdC game-modes §4.1), appariement 1v1/FFA, création du Match +
 * MatchPlayer + tickets MATCHED dans UNE transaction atomique, puis allocation
 * game-server APRÈS commit (l'allocation échoue → le match reste WAITING_FOR_PLAYERS,
 * jamais de fonds ni d'état incohérent).
 * Kill-switch : MATCHMAKING_PAUSED=true → le worker ne marie plus (files conservées,
 * les tickets expirent normalement). Expiration : status=EXPIRED uniquement QUEUED→EXPIRED.
 */
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GameserversService } from '../gameservers/gameservers.service';
import { loadBettingConfig } from '../../config/betting.config';
import { CLOCK, type Clock } from '../../common/utils/clock';

/** Paliers d'élargissement de la fenêtre PL en fonction de l'attente (ms). */
const PL_WINDOW_STEPS: ReadonlyArray<{ afterMs: number; window: number }> = [
  { afterMs: 0, window: 200 },      // 0–20 s : ±200 strict
  { afterMs: 20_000, window: 350 }, // 20–40 s
  { afterMs: 40_000, window: 500 }, // > 40 s : plafond contractuel ±500
];

/** Tailles de plateau par mode (CdC §4) — 1v1 = 2, FFA/QUICK = 8, BR = 12. */
const SEAT_COUNT: Record<string, number> = {
  RANKED_1V1: 2,
  RANKED_FFA: 8,
  QUICK_RACE: 6,
  BATTLE_ROYALE: 12,
  TOURNAMENT: 8,
  CLAN_WARS: 8,
  PRACTICE: 4,
};

const TRACKS = ['lome', 'accra', 'lagos', 'dakar', 'paris', 'tokyo'] as const;

export function computePlWindow(waitMs: number): number {
  let window = PL_WINDOW_STEPS[0].window;
  for (const step of PL_WINDOW_STEPS) if (waitMs >= step.afterMs) window = step.window;
  return window;
}

@Injectable()
export class MatchmakingWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MatchmakingWorker.name);
  private timer?: NodeJS.Timeout;
  private running = false;
  private readonly config = loadBettingConfig();

  constructor(
    private readonly prisma: PrismaService,
    private readonly gameservers: GameserversService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  onModuleInit(): void {
    // Un seul worker actif par réplique est garanti en prod par un lock Redis
    // (SET rn:mm:worker NX PX) — ici le tick est idempotent grâce aux UPDATE
    // conditionnels status='QUEUED' (count===1 ⇒ je suis bien le propriétaire).
    this.timer = setInterval(() => void this.tick().catch((err) => this.logger.error(err)), 500);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** Un tour d'appariement : expiration puis pairing. Verrou applicatif anti-reentrance. */
  async tick(): Promise<void> {
    if (this.running) return; // le tick précédent n'est pas fini (backpressure naturelle)
    this.running = true;
    try {
      await this.expireStaleTickets();
      if (this.config.flags().matchmakingPaused) return; // kill-switch : plus de mariages
      for (const mode of Object.keys(SEAT_COUNT)) {
        await this.pairMode(mode);
      }
    } finally {
      this.running = false;
    }
  }

  /** QUEUED dont expiresAt est dépassé → EXPIRED (transition légale UNIQUEMENT depuis QUEUED). */
  private async expireStaleTickets(): Promise<void> {
    const now = new Date(this.clock.nowMs());
    const stale = await this.prisma.matchmakingTicket.findMany({
      where: { status: 'QUEUED', expiresAt: { lte: now } },
      select: { id: true },
      take: 200,
    });
    for (const t of stale) {
      // UPDATE conditionnel : si le pairing a gagné entre-temps, count=0 → on ne touche pas.
      await this.prisma.matchmakingTicket.updateMany({
        where: { id: t.id, status: 'QUEUED' },
        data: { status: 'EXPIRED' },
      });
    }
    if (stale.length > 0) this.logger.debug(`Expired ${stale.length} stale tickets`);
  }

  /** Apparie jusqu'à 1 plateau par mode et par tick (débit volontairement borné). */
  private async pairMode(mode: string): Promise<void> {
    const seats = SEAT_COUNT[mode];
    const tickets = await this.prisma.matchmakingTicket.findMany({
      where: { mode: mode as never, status: 'QUEUED' },
      orderBy: { requestedAt: 'asc' },
      take: 64, // fenêtre de scan bornée — au-delà, la file est simplement trop longue
    });
    if (tickets.length < 2 && seats === 2) return;
    if (tickets.length === 0) return;

    const nowMs = this.clock.nowMs();
    const group: (typeof tickets)[number][] = [];
    for (const candidate of tickets) {
      if (group.length === 0) { group.push(candidate); continue; }
      const anchor = group[0];
      const waitMs = nowMs - anchor.requestedAt.getTime();
      const window = computePlWindow(waitMs);
      if (Math.abs(candidate.plAtQueue - anchor.plAtQueue) <= window) group.push(candidate);
      if (group.length >= seats) break;
    }
    // 1v1 exige exactement 2 ; les plateaux multiples acceptent au moins 2 (remplissage partiel toléré côté serveur).
    if (group.length < (seats === 2 ? 2 : 2)) return;

    const trackId = TRACKS[(anchor_hash(group.map((g) => g.id))) % TRACKS.length];
    await this.createMatchAndAssign(mode, trackId, group);
  }

  /** TX atomique : tickets→MATCHED + Match + MatchPlayer. Échec total ou rien. */
  private async createMatchAndAssign(mode: string, trackId: string, group: Array<{ id: string; playerId: string }>): Promise<void> {
    const now = new Date(this.clock.nowMs());
    const match = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.match.create({
        data: {
          status: 'WAITING_FOR_PLAYERS',
          mode: mode as never,
          trackId,
          players: { create: group.map((g) => ({ playerId: g.playerId })) },
        },
      });
      for (const g of group) {
        // UPDATE conditionnel anti-course : un ticket expiré/annulé concurrent n'est pas écrasé.
        const updated = await tx.matchmakingTicket.updateMany({
          where: { id: g.id, status: 'QUEUED' },
          data: { status: 'MATCHED', matchId: created.id, matchedAt: now },
        });
        if (updated.count !== 1) {
          throw new MatchAssignmentRaceError(); // rollback complet : le match créé est annulé avec la tx
        }
      }
      return created;
    }).catch((err: unknown) => {
      if (err instanceof MatchAssignmentRaceError) {
        this.logger.warn(`Pairing race on mode=${mode}, retry next tick`);
        return null;
      }
      throw err;
    });
    if (!match) return;

    // Allocation serveur APRÈS commit (INV : pas de verrou DB long pendant un appel réseau).
    try {
      await this.gameservers.allocate(match.id);
      await this.prisma.match.update({ where: { id: match.id }, data: { status: 'LOADING' } });
      this.logger.log(`Match ${match.id} created mode=${mode} players=${group.length}`);
    } catch (err) {
      // Pas de serveur dispo → le match reste WAITING_FOR_PLAYERS ; fleet-health / prochain tick réessaieront.
      this.logger.warn(`No server available for match ${match.id}: ${(err as Error).message}`);
    }
  }
}

/** Sentinelle interne : course sur un ticket → rollback de la tx d'appariement. */
class MatchAssignmentRaceError extends Error {}

/** Petit hash déterministe pour varier le circuit sans Random non reproductible. */
function anchor_hash(ids: readonly string[]): number {
  let h = 0;
  for (const id of ids) for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}
