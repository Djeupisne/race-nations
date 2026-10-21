/**
 * Machine à états Payment (INV-22, INV-23) :
 *   CREATED → PROVIDER_PENDING → SUCCEEDED | FAILED | CANCELLED
 *
 * - SUCCEEDED / FAILED / CANCELLED sont TERMINAUX (INV-23) : un webhook tardif ne
 *   doit jamais rouvrir un paiement ; toute correction = nouvelle écriture ledger REVERSAL.
 * - Seul le webhook provider (signature vérifiée, INV-26 + idempotence 0003) fait
 *   avancer PROVIDER_PENDING → terminal ; le client peut CANCELLED tant que CREATED.
 */
import { InvalidStateTransitionError } from '../errors/domain-errors';

export type PaymentState = 'CREATED' | 'PROVIDER_PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

const PAYMENT_TRANSITIONS: Readonly<Record<PaymentState, readonly PaymentState[]>> = Object.freeze({
  CREATED: ['PROVIDER_PENDING', 'FAILED', 'CANCELLED'],
  PROVIDER_PENDING: ['SUCCEEDED', 'FAILED', 'CANCELLED'],
  SUCCEEDED: [], // terminal — crédit HARD déjà passé par wallet.repository (INV-03)
  FAILED: [],    // terminal
  CANCELLED: [], // terminal
});

export function isPaymentTerminal(state: PaymentState): boolean {
  return PAYMENT_TRANSITIONS[state].length === 0;
}

export function allowedPaymentTransitions(from: PaymentState): readonly PaymentState[] {
  return PAYMENT_TRANSITIONS[from];
}

export function canPaymentTransition(from: PaymentState, to: PaymentState): boolean {
  return PAYMENT_TRANSITIONS[from].includes(to);
}

export function assertPaymentTransition(from: PaymentState, to: PaymentState): void {
  if (!canPaymentTransition(from, to)) {
    throw new InvalidStateTransitionError('Payment', from, to);
  }
}
