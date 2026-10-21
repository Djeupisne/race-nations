/**
 * players.service.ts — profil joueur, stats, leaderboards (docs/api.md §3/§10).
 * Invariants appliqués ici :
 *  - INV-31 : nationalité verrouillée après la 1ʳᵉ course classée (`nationalityLocked`) ;
 *    PL cap min 0 ; division recalculée par `divisionFromPl` (source unique contrat).
 *  - INV-25 : les stats n'agrègent QUE des matches FINISHED_VALIDATED.
 *  - INV-29 : horodatages via Clock.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { divisionFromPl, type PlayerProfile, type PublicPlayerProfile } from '@race-nations/api-contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { CLOCK, type Clock } from '../../common/utils/clock';
import { NotFoundError, ValidationError } from '../../common/errors/domain-errors';
import type { LeaderboardQuery, SetNationalityInput, UpdatePlayerInput } from './players.dto';

@Injectable()
export class PlayersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /* ------------------------------- Profil -------------------------------- */

  /** Chargement interne robuste utilisé par tous les modules (betting, wallet…). */
  async getByPlayerId(playerId: string) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      include: { user: { select: { role: true } }, wallet: true },
    });
    if (!player) throw new NotFoundError('Player', playerId);
    return player;
  }

  async getProfileByUserId(userId: string): Promise<PlayerProfile> {
    const player = await this.prisma.player.findUnique({
      where: { userId },
      include: { user: { select: { role: true } } },
    });
    if (!player) throw new NotFoundError('Player', userId);
    return this.toProfile(player);
  }

  /** GET /players/:id — profil public, sans PII ni flags KYC (404 uniforme si caché/inexistant). */
  async getPublicProfile(playerId: string): Promise<PublicPlayerProfile> {
    const p = await this.prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, username: true, nationality: true, level: true, plPoints: true, division: true },
    });
    if (!p) throw new NotFoundError('Player', playerId);
    return {
      id: p.id,
      username: p.username,
      nationality: p.nationality as PublicPlayerProfile['nationality'],
      level: p.level,
      plPoints: p.plPoints,
      division: p.division,
    };
  }

  /** PATCH /players/me — champs éditables uniquement ; `nationality` absent du schéma (INV-31). */
  async updateProfile(userId: string, input: UpdatePlayerInput): Promise<PlayerProfile> {
    const player = await this.prisma.player.findUnique({ where: { userId }, include: { user: true } });
    if (!player) throw new NotFoundError('Player', userId);
    const data: Prisma.PlayerUpdateInput = {};
    if (input.username !== undefined) {
      const clash = await this.prisma.player.findUnique({ where: { username: input.username }, select: { id: true } });
      if (clash && clash.id !== player.id) throw new ValidationError({ field: 'username', reason: 'Already taken.' });
      data.username = input.username;
    }
    if (input.preferredLanguage !== undefined) data.preferredLanguage = input.preferredLanguage;
    if (input.chatGlobalEnabled !== undefined) data.chatGlobalEnabled = input.chatGlobalEnabled;
    if (input.marketingOptIn !== undefined) data.marketingOptIn = input.marketingOptIn;
    const updated = await this.prisma.player.update({ where: { id: player.id }, data, include: { user: true } });
    return this.toProfile(updated);
  }

  /** POST /players/me/nationality — possible tant que non verrouillé (avant 1ʳᵉ course classée, INV-31). */
  async setNationality(userId: string, input: SetNationalityInput): Promise<PlayerProfile> {
    const player = await this.prisma.player.findUnique({ where: { userId }, include: { user: true } });
    if (!player) throw new NotFoundError('Player', userId);
    if (player.nationalityLocked) {
      throw new ValidationError({
        field: 'nationality',
        reason: 'Nationality is locked after the first ranked race (INV-31).',
      });
    }
    const updated = await this.prisma.player.update({
      where: { id: player.id },
      data: { nationality: input.nationality },
      include: { user: true },
    });
    return this.toProfile(updated);
  }

  /* -------------------------------- Stats -------------------------------- */

  /** GET /players/me/stats — agrégats sur matches validés serveur uniquement (INV-25). */
  async stats(playerId: string) {
    const entries = await this.prisma.matchPlayer.findMany({
      where: { playerId, match: { status: 'FINISHED_VALIDATED' } },
      select: { outcome: true, driftPoints: true, position: true },
    });
    let victories = 0;
    let defeats = 0;
    let draws = 0;
    let abandons = 0;
    let totalDrift = 0;
    for (const e of entries) {
      totalDrift += e.driftPoints;
      switch (e.outcome) {
        case 'VICTORY': victories++; break;
        case 'DEFEAT': defeats++; break;
        case 'DRAW': draws++; break;
        case 'ABANDON': abandons++; break;
        default: break;
      }
    }
    const betsWon = await this.prisma.bet.count({ where: { playerId, status: 'WON' } });
    const betsLost = await this.prisma.bet.count({ where: { playerId, status: 'LOST' } });
    const recordsHeld = await this.prisma.matchPlayer.count({
      where: { playerId, match: { status: 'FINISHED_VALIDATED' }, position: 1 },
    });
    return {
      racesPlayed: entries.length,
      victories,
      defeats,
      draws,
      abandons,
      winStreakCurrent: 0, // calculé par le worker season (phase ultérieure) — exposé défensif
      winStreakBest: 0,
      totalDriftPoints: totalDrift,
      perfectRaces: 0,
      recordsHeld,
      betsWon,
      betsLost,
    };
  }

  /* ----------------------------- Leaderboards ---------------------------- */

  /** GET /leaderboards (api.md §10) — tri PL desc, pagination curseur = dernier plPoints:id encodé. */
  async leaderboard(query: LeaderboardQuery) {
    const where: Prisma.PlayerWhereInput = {};
    switch (query.scope) {
      case 'country':
        if (!query.filter) throw new ValidationError({ field: 'filter', reason: 'Required for scope=country.' });
        where.nationality = query.filter.toUpperCase();
        break;
      case 'division':
        if (!query.filter) throw new ValidationError({ field: 'filter', reason: 'Required for scope=division.' });
        where.division = query.filter as Prisma.DivisionFilter;
        break;
      case 'clan':
        where.clanMembership = query.filter ? { clanId: query.filter } : { not: null };
        break;
      case 'vehicle':
        where.ownedVehicles = { some: { vehicleId: query.filter ?? '' } };
        break;
      case 'season':
      case 'world':
      default:
        break;
    }
    const cursor = query.cursor ? decodeCursor(query.cursor) : undefined;
    const rows = await this.prisma.player.findMany({
      where,
      orderBy: [{ plPoints: 'desc' }, { id: 'asc' }],
      take: query.limit + 1,
      ...(cursor ? { cursor: { id: cursor.id }, skip: 1 } : {}),
      select: { id: true, username: true, nationality: true, division: true, plPoints: true },
    });
    const items = rows.slice(0, query.limit).map((r, i) => ({
      rank: i + 1 + (cursor?.offset ?? 0),
      playerId: r.id,
      username: r.username,
      nationality: r.nationality,
      division: r.division,
      plPoints: r.plPoints,
      metric: r.plPoints,
    }));
    const hasMore = rows.length > query.limit;
    const last = items[items.length - 1];
    return {
      items,
      nextCursor: hasMore && last ? encodeCursor(last.playerId, (cursor?.offset ?? 0) + items.length) : null,
    };
  }

  /* -------------------------------- Internes ----------------------------- */

  /** Verrouillage INV-31 appelé par match-settlement à la 1ʳᵉ course classée. Idempotent. */
  async lockNationalityIfNeeded(playerId: string): Promise<void> {
    await this.prisma.player.updateMany({
      where: { id: playerId, nationalityLocked: false },
      data: { nationalityLocked: true },
    });
  }

  /**
   * Applique un delta PL avec cap min 0 et recalcule la division (INV-31) — source unique
   * pour match settlement et sanctions. Retourne le nouveau snapshot PL/division.
   */
  async applyPlDelta(playerId: string, delta: number): Promise<{ plPoints: number; division: ReturnType<typeof divisionFromPl> }> {
    const player = await this.prisma.player.findUnique({ where: { id: playerId }, select: { plPoints: true } });
    if (!player) throw new NotFoundError('Player', playerId);
    const plPoints = Math.max(0, player.plPoints + delta); // cap min 0 (INV-31)
    const division = divisionFromPl(plPoints);
    await this.prisma.player.update({ where: { id: playerId }, data: { plPoints, division } });
    return { plPoints, division };
  }

  private toProfile(p: {
    id: string; username: string; countryCode: string; nationality: string;
    level: number; xp: number; plPoints: number; division: PlayerProfile['division'];
    reputation: number; ageVerifiedAt: Date | null; createdAt: Date;
    user: { role: PlayerProfile['role'] };
  }): PlayerProfile {
    return {
      id: p.id,
      username: p.username,
      countryCode: p.countryCode as PlayerProfile['countryCode'],
      nationality: p.nationality as PlayerProfile['nationality'],
      nationalityLocked: (p as { nationalityLocked?: boolean }).nationalityLocked ?? false,
      role: p.user.role,
      level: p.level,
      xp: p.xp,
      plPoints: p.plPoints,
      division: p.division,
      reputation: p.reputation,
      ageVerified: p.ageVerifiedAt !== null,
      createdAt: p.createdAt.toISOString(),
    };
  }
}

/** Curseur opaque `${base64(id)}:${offset}` — stable malgré les égalités de PL (tri (pl,id)). */
function encodeCursor(id: string, offset: number): string {
  return `${Buffer.from(id, 'utf8').toString('base64url')}:${offset}`;
}
function decodeCursor(raw: string): { id: string; offset: number } | undefined {
  const [b64, off] = raw.split(':');
  if (!b64) return undefined;
  try {
    return { id: Buffer.from(b64, 'base64url').toString('utf8'), offset: Number.parseInt(off ?? '0', 10) || 0 };
  } catch {
    return undefined;
  }
}
