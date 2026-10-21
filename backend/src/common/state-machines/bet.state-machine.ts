/**
 * Machine à états Bet (INV-22, INV-23) :
 *   PENDING → ACCEPTED → ESCROWED → RUNNING → WON | LOST | PUSH
 *   Annulation/push admin avant course → REFUNDED | VOIDED.
 *   Toute position monétaire réglée une seule fois (INV-23) : les états finaux
 *   WON/LOST/PUSH/REFUNDED/VOIDED sont terminaux et UNIQUE(marketId) côté
 *   BetSettlement empêche le double settlement (INV-14).
 *
 * Transitions clés :
 *  - ACCEPTED → ESCROWED exige le mouvement ledger BET_ESCROW correspondant (INV-15).
 *  - PUSH = égalité → remboursement intégral, houseCut = 0 (INV-16).
 *  - VOIDED = marché annulé avant course ; REFUNDED = argent rendu (push/annulation/litige résolu).
 */
import { InvalidStateTransitionError } from '../errors/domain-errors';

export type BetState =
  | 'PENDING'
  | 'ACCEPTED'
  | 'ESCROWED'
  | 'RUNNING'
  | 'WON'
  | 'LOST'
  | 'PUSH'
  | 'REFUNDED'
  | 'VOIDED';

const BET_TRANSITIONS: Readonly<Record<BetState, readonly BetState[]>> = Object.freeze({
  PENDING: ['ACCEPTED', 'REFUNDED', 'VOIDED'], // refus/expiration → remboursement, annulation marché → VOIDED
  ACCEPTED: ['ESCROWED', 'REFUNDED', 'VOIDED'],
  ESCROWED: ['RUNNING', 'REFUNDED', 'VOIDED'], // INV-15 : escrow posé par le ledger BET_ESCROW
  RUNNING: ['WON', 'LOST', 'PUSH', 'REFUNDED', 'VOIDED'], // PUSH = égalité (INV-16) ; REFUNDED = litige résolu (INV-18)
  WON: [],
  LOST: [],
  PUSH: [],
  REFUNDED: [],
  VOIDED: [],
});

export function isBetTerminal(state: BetState): boolean {
  return BET_TRANSITIONS[state].length === 0;
}

export function allowedBetTransitions(from: BetState): readonly BetState[] {
  return BET_TRANSITIONS[from];
}

export function canBetTransition(from: BetState, to: BetState): boolean {
  return BET_TRANSITIONS[from].includes(to);
}

export function assertBetTransition(from: BetState, to: BetState): void {
  if (!canBetTransition(from, to)) {
    throw new InvalidStateTransitionError('Bet', from, to);
  }
}
