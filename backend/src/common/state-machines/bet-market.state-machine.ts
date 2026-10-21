/**
 * Machine à états BetMarket (INV-22, INV-14, INV-19) :
 *   OPEN → CHALLENGED → LOCKED → SETTLING → SETTLED
 *   (+ DISPUTED depuis CHALLENGED/LOCKED/RUNNING-side ; CANCELLED avant settlement)
 *
 * - DISPUTED gèle tout payout (INV-19, ≤ 72h — BETTING_CONSTANTS.DISPUTE_MAX_AGE_MS) ;
 *   la résolution admin repasse par SETTLING (issue normale) ou CANCELLED (remboursement).
 * - SETTLED est terminal et verrouillé en base par UNIQUE(marketId) sur BetSettlement (INV-14).
 * - Un marché lié à un match INVALIDATED ne peut pas atteindre SETTLED sans passer
 *   par DISPUTED puis résolution (INV-24/25).
 */
import { InvalidStateTransitionError } from '../errors/domain-errors';

export type BetMarketState =
  | 'OPEN'
  | 'CHALLENGED'
  | 'LOCKED'
  | 'SETTLING'
  | 'SETTLED'
  | 'DISPUTED'
  | 'CANCELLED';

const BET_MARKET_TRANSITIONS: Readonly<Record<BetMarketState, readonly BetMarketState[]>> = Object.freeze({
  OPEN: ['CHALLENGED', 'CANCELLED'],
  CHALLENGED: ['LOCKED', 'DISPUTED', 'CANCELLED'],
  LOCKED: ['SETTLING', 'DISPUTED', 'CANCELLED'], // LOCKED = escrows posés + match lancé (INV-15)
  SETTLING: ['SETTLED', 'DISPUTED'],
  SETTLED: [],
  DISPUTED: ['SETTLING', 'CANCELLED'], // résolution admin dans les 72h (INV-19)
  CANCELLED: [],
});

export function isBetMarketTerminal(state: BetMarketState): boolean {
  return BET_MARKET_TRANSITIONS[state].length === 0;
}

export function allowedBetMarketTransitions(from: BetMarketState): readonly BetMarketState[] {
  return BET_MARKET_TRANSITIONS[from];
}

export function canBetMarketTransition(from: BetMarketState, to: BetMarketState): boolean {
  return BET_MARKET_TRANSITIONS[from].includes(to);
}

export function assertBetMarketTransition(from: BetMarketState, to: BetMarketState): void {
  if (!canBetMarketTransition(from, to)) {
    throw new InvalidStateTransitionError('BetMarket', from, to);
  }
}
