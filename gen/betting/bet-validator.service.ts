/**
 * bet-validator.service.ts — garde centralisée d'une position de pari (INV-10..INV-21).
 * Orchestration pure SANS effet de bord monétaire : le wallet.repository est appelé
 * uniquement par betting.service après passage de TOUS les contrôles.
 * Contrôles : kill-switch → juridiction → bornes → limites glissantes → équité des
 * mises 1v1 (INV-10) → écart de PL ≤ 300 (game-modes §10.1) → auto-pari interdit →
 * marché dans un état acceptant (OPEN/CHALLENGED) → pas de double position.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { BetMarket, Player } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BETTING_CONFIG, type BettingConfig } from '../../config/betting.config';
import { BetStakeMismatchError } from '../../common/errors/betting-errors';
import { ValidationError, ForbiddenAdminError, NotFoundError } from '../../common/errors/domain-errors';
import { canBetMarketTransition } from '../../common/state-machines/bet-market.state-machine';
import { JurisdictionService } from './jurisdiction.service';
import { BetLimitsService } from './bet-limits.service';

export interface JoinCheck {
  market: BetMarket;
  player: Player;
}

@Injectable()
export class BetValidatorService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(BETTING_CONFIG) private readonly config: BettingConfig,
    private readonly jurisdictions: JurisdictionService,
    private readonly limits: BetLimitsService,
  ) {}

  /** Validation complète pour CRÉER un marché (défi). */
  async validateMarketCreation(player: Player, currency: 'SOFT' | 'HARD', stake: number): Promise<void> {
    this.assertKillSwitch(currency);
    await this.jurisdictions.assertAllowed(player.countryCode, currency);
    this.limits.assertStakeBounds(currency, stake);
    await this.limits.assertWithinLimits({ playerId: player.id, countryCode: player.countryCode, currency }, stake);
  }

  /**
   * Validation complète pour REJOINDRE un marché existant (acceptation de défi / pari ouvert).
   * Retourne le contexte vérifié ; l'appelant (betting.service) exécute l'escrow atomique.
   */
  async validateJoin(marketId: string, player: Player): Promise<JoinCheck> {
    const market = await this.prisma.betMarket.findUnique({ where: { id: marketId } });
    if (!market) throw new NotFoundError('BetMarket', marketId);

    // Auto-pari / double position : un joueur déjà engagé sur le marché ne peut pas se rejoindre.
    if (market.creatorId === player.id) {
      throw new ForbiddenAdminError({}, 'You cannot bet against yourself.');
    }
    const existing = await this.prisma.bet.findUnique({
      where: { marketId_playerId: { marketId, playerId: player.id } },
      select: { id: true },
    });
    if (existing) throw new ValidationError({ field: 'marketId', reason: 'Already positioned on this market.' });

    // État du marché : seul OPEN (public) ou CHALLENGED ciblant ce joueur accepte une entrée.
    if (market.status !== 'OPEN' && market.status !== 'CHALLENGED') {
      throw new ValidationError({ field: 'status', reason: `Market is ${market.status}; joining requires OPEN or CHALLENGED.` });
    }
    if (!canBetMarketTransition(market.status, 'LOCKED')) {
      // Garde de cohérence graphe : LOCKED doit rester atteignable depuis l'état courant.
      throw new ValidationError({ field: 'status', reason: 'Illegal market transition for join.' });
    }
    if (market.opponentId && market.opponentId !== player.id) {
      throw new ForbiddenAdminError({}, 'This challenge is reserved for another player.');
    }

    const currency = market.currency as 'SOFT' | 'HARD';
    this.assertKillSwitch(currency);
    await this.jurisdictions.assertAllowed(player.countryCode, currency);

    // INV-10 : mises strictement identiques — le rejoignant paie market.stake, pas un choix libre.
    this.limits.assertStakeBounds(currency, market.stake);
    await this.limits.assertWithinLimits({ playerId: player.id, countryCode: player.countryCode, currency }, market.stake);

    // Écart de PL max 300 entre créateur et opposant (game-modes §10.1), si les deux existent.
    if (market.opponentId === null || market.opponentId === player.id) {
      const creator = await this.prisma.player.findUnique({
        where: { id: market.creatorId },
        select: { plPoints: true },
      });
      if (creator && Math.abs(creator.plPoints - player.plPoints) > this.config.constants.PL_DELTA_MAX) {
        throw new ValidationError({
          field: 'plDelta',
          reason: `PL gap ${Math.abs(creator.plPoints - player.plPoints)} exceeds max ${this.config.constants.PL_DELTA_MAX}.`,
        });
      }
    }

    return { market, player };
  }

  /** Contrôle d'équité explicite utilisé aussi au verrouillage (double escrow simultané). */
  assertEqualStakes(stakeA: number, stakeB: number): void {
    if (stakeA !== stakeB) throw new BetStakeMismatchError(stakeA, stakeB);
  }

  private assertKillSwitch(currency: 'SOFT' | 'HARD'): void {
    const flags = this.config.flags();
    if (currency === 'HARD' && !flags.hardEnabled) {
      throw new ValidationError({ field: 'currency', reason: 'Hard-currency betting is temporarily disabled.' });
    }
    if (currency === 'SOFT' && !flags.softEnabled) {
      throw new ValidationError({ field: 'currency', reason: 'Soft-currency betting is temporarily disabled.' });
    }
  }
}
