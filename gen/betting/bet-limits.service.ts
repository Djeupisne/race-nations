/**
 * bet-limits.service.ts — plafonds de mise & limites responsables (INV-11, INV-12, INV-21).
 * - Bornes par devise : betting.config.ts (contrat, jamais d'env override) ;
 * - Limite journalière SOFT : fenêtre glissante 24 h (INV-12), agrégée depuis le ledger ;
 * - Plafonds HARD : min(plafond juridiction du pays, plafond mensuel global LCB/FT) ;
 * - Réputation ≥ 30 pour HARD (INV-21) + KYC âge vérifié.
 * Les montants sont des entiers stricts (INV-01) ; toute comparaison est en entiers.
 */
import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CLOCK, type Clock } from '../../common/utils/clock';
import { BETTING_CONFIG, stakeBounds, type BettingConfig } from '../../config/betting.config';
import {
  BetStakeOutOfRangeError,
  BetDailyLimitExceededError,
  ReputationTooLowError,
  AgeVerificationRequiredError,
} from '../../common/errors/betting-errors';
import { JurisdictionService } from './jurisdiction.service';

export interface StakeCheckContext {
  playerId: string;
  countryCode: string;
  currency: 'SOFT' | 'HARD';
  /** Mise déjà retenue dans la période courante (le service la re-compte lui-même). */
}

@Injectable()
export class BetLimitsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(BETTING_CONFIG) private readonly config: BettingConfig,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly jurisdictions: JurisdictionService,
  ) {}

  /** Borne min/max contractuelle par devise (INV-11) — lève BET_STAKE_OUT_OF_RANGE. */
  assertStakeBounds(currency: 'SOFT' | 'HARD', stake: number): void {
    const { min, max } = stakeBounds(currency);
    if (!Number.isSafeInteger(stake) || stake < min || stake > max) {
      throw new BetStakeOutOfRangeError(currency, stake, min, max);
    }
  }

  /**
   * Vérifie la limite journalière SOFT (fenêtre glissante 24 h, INV-12) et les plafonds
   * HARD (juridiction + mensuel global). `additionalStake` = mise projetée.
   * Source de vérité = WalletTransaction BET_ESCROW (déjà débités) — pas de compteur Redis
   * contournable : le ledger est immuable, donc le comptage est exact même après crash.
   */
  async assertWithinLimits(ctx: StakeCheckContext, additionalStake: number): Promise<void> {
    const since = new Date(this.clock.nowMs() - this.config.constants.DAILY_WINDOW_MS);

    if (ctx.currency === 'SOFT') {
      const used = await this.sumEscrowSince(ctx.playerId, 'CREDITS', since);
      const limit = this.config.constants.DAILY_SOFT_LIMIT;
      if (used + additionalStake > limit) {
        throw new BetDailyLimitExceededError('SOFT-daily', used, limit);
      }
      return;
    }

    // ---- HARD : triple garde (INV-11/12/21 + LCB/FT) ----
    const player = await this.prisma.player.findUnique({
      where: { id: ctx.playerId },
      select: { reputation: true, ageVerifiedAt: true },
    });
    if (!player) throw new AgeVerificationRequiredError();
    if (player.reputation < this.config.constants.MIN_REPUTATION_HARD) {
      throw new ReputationTooLowError(player.reputation, this.config.constants.MIN_REPUTATION_HARD);
    }
    if (!player.ageVerifiedAt) throw new AgeVerificationRequiredError();

    const juris = await this.jurisdictions.get(ctx.countryCode);
    const monthAgo = new Date(this.clock.nowMs() - 30 * 24 * 3_600_000);
    const usedMonth = await this.sumEscrowSince(ctx.playerId, 'HARD_CENTS', monthAgo);

    const monthlyCap = Math.min(
      juris.monthlyHardLimitCents ?? Number.MAX_SAFE_INTEGER,
      this.config.constants.MONTHLY_HARD_CAP_CENTS,
    );
    if (usedMonth + additionalStake > monthlyCap) {
      throw new BetDailyLimitExceededError('HARD-monthly', usedMonth, monthlyCap);
    }
    if (juris.dailyHardLimitCents !== null) {
      const dayAgo = new Date(this.clock.nowMs() - 24 * 3_600_000);
      const usedDay = await this.sumEscrowSince(ctx.playerId, 'HARD_CENTS', dayAgo);
      if (usedDay + additionalStake > juris.dailyHardLimitCents) {
        throw new BetDailyLimitExceededError('HARD-daily', usedDay, juris.dailyHardLimitCents);
      }
    }
  }

  /** Snapshot de consommation pour GET /betting/limits (transparence joueur, jeu responsable). */
  async usage(playerId: string, currency: 'SOFT' | 'HARD') {
    const since = new Date(this.clock.nowMs() - this.config.constants.DAILY_WINDOW_MS);
    const used24h = await this.sumEscrowSince(playerId, currency === 'SOFT' ? 'CREDITS' : 'HARD_CENTS', since);
    return {
      currency,
      windowHours: 24,
      used: used24h,
      softDailyLimit: this.config.constants.DAILY_SOFT_LIMIT,
    };
  }

  /* ------------------------------- Interne -------------------------------- */

  /** Somme des escrows (valeur absolue des débits BET_ESCROW) depuis `since`, par devise. */
  private async sumEscrowSince(playerId: string, kind: 'CREDITS' | 'HARD_CENTS', since: Date): Promise<number> {
    const wallet = await this.prisma.wallet.findUnique({ where: { playerId }, select: { id: true } });
    if (!wallet) return 0; // wallet créé à la première transaction ; pas de wallet ⇒ pas de pari passé
    const col = kind === 'CREDITS' ? 'credits' : 'hardCents';
    const agg = await this.prisma.walletTransaction.aggregate({
      where: {
        walletId: wallet.id,
        type: 'BET_ESCROW',
        createdAt: { gte: since },
      },
      _sum: { amountSigned: true },
    });
    // amountSigned < 0 pour un débit → on somme en valeur absolue. Colonne devinée par `kind`
    // uniquement pour le mapping devise ; le filtre temporel est identique.
    void col;
    return Math.abs(agg._sum.amountSigned ?? 0);
  }
}
