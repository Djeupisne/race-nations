/**
 * Machine à états Sanction (INV-22, INV-18/21) :
 *   ISSUED → ACTIVE → APPEALED → LIFTED | UPHELD
 *
 * - ISSUED → ACTIVE est posée par la modération au moment de l'application effective
 *   (mute/ban/restriction de paris). Une sanction expirée (TEMP_BAN_7D) devient LIFTED.
 * - APPEALED gèle les effets conservatifs mais ne suspend pas une PERM_BAN sans décision admin.
 * - LIFTED et UPHELD sont terminaux : une récidive crée une NOUVELLE sanction (audit trail).
 */
import { InvalidStateTransitionError } from '../errors/domain-errors';

export type SanctionState = 'ISSUED' | 'ACTIVE' | 'APPEALED' | 'LIFTED' | 'UPHELD';

const SANCTION_TRANSITIONS: Readonly<Record<SanctionState, readonly SanctionState[]>> = Object.freeze({
  ISSUED: ['ACTIVE', 'LIFTED'], // LIFTED possible si erreur reconnue avant application
  ACTIVE: ['APPEALED', 'LIFTED'],
  APPEALED: ['LIFTED', 'UPHELD'],
  LIFTED: [],
  UPHELD: [],
});

export function isSanctionTerminal(state: SanctionState): boolean {
  return SANCTION_TRANSITIONS[state].length === 0;
}

export function allowedSanctionTransitions(from: SanctionState): readonly SanctionState[] {
  return SANCTION_TRANSITIONS[from];
}

export function canSanctionTransition(from: SanctionState, to: SanctionState): boolean {
  return SANCTION_TRANSITIONS[from].includes(to);
}

export function assertSanctionTransition(from: SanctionState, to: SanctionState): void {
  if (!canSanctionTransition(from, to)) {
    throw new InvalidStateTransitionError('Sanction', from, to);
  }
}
