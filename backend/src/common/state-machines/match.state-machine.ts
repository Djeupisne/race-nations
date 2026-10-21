/**
 * Machine à états Match (INV-22) — alphabet miroir de MatchStatusSchema
 * (shared/api-contracts/src/enums.ts) et du enum MatchStatus (prisma/schema.prisma).
 *
 *   WAITING_FOR_PLAYERS → LOADING → IN_PROGRESS → FINISHED
 *     → FINISHED_VALIDATED | INVALIDATED
 *
 * Règles :
 *  - Toute écriture de `match.status` passe par assertMatchTransition (INV-22).
 *  - FINISHED_VALIDATED déclenche le settlement des paris liés (INV-24) ;
 *    INVALIDATED ouvre un litige (INV-18/19) — jamais de settlement partiel.
 *  - Les deux états FINISHED_* sont terminaux côté match (INV-23) ; une correction
 *    passe par une nouvelle ligne de ledger REVERSAL, pas par un retour en arrière.
 */
import { InvalidStateTransitionError } from '../errors/domain-errors';

export type MatchState =
  | 'WAITING_FOR_PLAYERS'
  | 'LOADING'
  | 'IN_PROGRESS'
  | 'FINISHED'
  | 'FINISHED_VALIDATED'
  | 'INVALIDATED';

const MATCH_TRANSITIONS: Readonly<Record<MatchState, readonly MatchState[]>> = Object.freeze({
  WAITING_FOR_PLAYERS: ['LOADING', 'INVALIDATED'],
  LOADING: ['IN_PROGRESS', 'INVALIDATED'],
  IN_PROGRESS: ['FINISHED', 'INVALIDATED'],
  // FINISHED attend la validation serveur du résultat (INV-25) : validé OU invalidé.
  FINISHED: ['FINISHED_VALIDATED', 'INVALIDATED'],
  FINISHED_VALIDATED: [],
  INVALIDATED: [],
});

export function isMatchTerminal(state: MatchState): boolean {
  return MATCH_TRANSITIONS[state].length === 0;
}

export function allowedMatchTransitions(from: MatchState): readonly MatchState[] {
  return MATCH_TRANSITIONS[from];
}

export function canMatchTransition(from: MatchState, to: MatchState): boolean {
  return MATCH_TRANSITIONS[from].includes(to);
}

/** Lève InvalidStateTransitionError (409) si la transition est hors graphe. */
export function assertMatchTransition(from: MatchState, to: MatchState): void {
  if (!canMatchTransition(from, to)) {
    throw new InvalidStateTransitionError('Match', from, to);
  }
}
