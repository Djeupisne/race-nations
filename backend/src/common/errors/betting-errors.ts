/**
 * Erreurs spécifiques au domaine paris (docs/betting.md, INV-10..INV-21).
 * Codes et HTTP status figés par docs/api.md §1.2.
 */
import { AppError, AppErrorOptions } from './app-error';

/** INV-10 — défi 1v1 accepté uniquement si stakeB === stakeA. */
export class BetStakeMismatchError extends AppError {
  constructor(readonly stakeA: number, readonly stakeB: number, options: AppErrorOptions = {}) {
    super('BET_STAKE_MISMATCH', `Challenge stakes must be equal: got ${stakeA} vs ${stakeB}.`, {
      details: { stakeA, stakeB },
      ...options,
    });
  }
}

/** INV-11 — mise hors bornes (SOFT 10..10000 cr ; HARD 100..10000 ct ; tournoi 50..50000 cr). */
export class BetStakeOutOfRangeError extends AppError {
  constructor(
    readonly min: number,
    readonly max: number,
    readonly received: number,
    options: AppErrorOptions = {},
  ) {
    super('BET_STAKE_OUT_OF_RANGE', `Stake must be between ${min} and ${max}.`, {
      details: { min, max, received },
      ...options,
    });
  }
}

/** INV-12 — somme des mises sur fenêtre glissante 24h dépassée. */
export class BetDailyLimitExceededError extends AppError {
  constructor(
    readonly limit: number,
    readonly alreadyWagered: number,
    readonly attempted: number,
    options: AppErrorOptions = {},
  ) {
    super('BET_DAILY_LIMIT_EXCEEDED', `Daily betting limit exceeded: limit ${limit}, already wagered ${alreadyWagered}.`, {
      details: { limit, alreadyWagered, attempted },
      ...options,
    });
  }
}

/** INV-14 — UNIQUE(marketId) sur BetSettlement : second settlement refusé, sans effet de bord. */
export class BetAlreadySettledError extends AppError {
  constructor(readonly marketId: string, options: AppErrorOptions = {}) {
    super('BET_ALREADY_SETTLED', `Market already settled: ${marketId}.`, { details: { marketId }, ...options });
  }
}

/** INV-20 — pari HARD sans licence active dans la juridiction du joueur (ou pays bloqué en SOFT). */
export class JurisdictionBlockedError extends AppError {
  constructor(readonly countryCode: string, readonly currency: 'SOFT' | 'HARD', options: AppErrorOptions = {}) {
    super('JURISDICTION_BLOCKED', `Betting (${currency}) is not available in jurisdiction ${countryCode}.`, {
      details: { countryCode, currency },
      ...options,
    });
  }
}

/** INV-21 — KYC âge ≥ 18 non vérifié pour un pari HARD. */
export class AgeVerificationRequiredError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super('AGE_VERIFICATION_REQUIRED', 'Age verification (18+) is required for real-money betting.', options);
  }
}

/** INV-21 — réputation < 30 : pas de paris HARD ni tournois payants. */
export class ReputationTooLowError extends AppError {
  constructor(readonly reputation: number, readonly required: number, options: AppErrorOptions = {}) {
    super('REPUTATION_TOO_LOW', `Reputation ${reputation} is below the required ${required}.`, {
      details: { reputation, required },
      ...options,
    });
  }
}
