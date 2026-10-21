/**
 * Money — manipulation monétaire 100% entiers (INV-01).
 * SOFT : unités entières (credits/gems/tokens). HARD : centimes entiers.
 * Interdiction absolue : float, Decimal, arrondi bancaire implicite.
 * Toute division passe par floorDiv et le résidu est explicite (INV-05/INV-09).
 */
import { InsufficientFundsError } from '../errors/domain-errors';

export type CurrencyKind = 'SOFT' | 'HARD';

/** Garde-fou runtime : valeur monétaire = entier non vide. Lève si float/NaN/infini. */
export function assertIntegerAmount(amount: number, label = 'amount'): number {
  if (!Number.isSafeInteger(amount)) {
    throw new TypeError(`Money invariant INV-01 violated: ${label} must be a safe integer, got ${String(amount)}`);
  }
  return amount;
}

/** Division plancher — le résidu n'est JAMAIS perdu (appelé doit le créditer au House, INV-09). */
export function floorDiv(numerator: number, denominator: number): number {
  assertIntegerAmount(numerator, 'numerator');
  assertIntegerAmount(denominator, 'denominator');
  if (denominator === 0) throw new RangeError('floorDiv: denominator must be non-zero');
  return Math.floor(numerator / denominator);
}

/** Résidu du plancher : numerator - floorDiv*denominator (>= 0 si numerator >= 0). */
export function floorRemainder(numerator: number, denominator: number): number {
  return numerator - floorDiv(numerator, denominator) * denominator;
}

/** bps = basis points /10000 → part plancher de `amount` (ex. houseCut, INV-08). */
export function applyBpsFloor(amount: number, bps: number): number {
  assertIntegerAmount(amount, 'amount');
  assertIntegerAmount(bps, 'bps');
  return floorDiv(amount * bps, 10_000);
}

/** Addition signée sûre (ledger) : bornée aux entiers sûrs, jamais négative sur un solde (INV-02 vérifié par l'appelant SQL). */
export function addSigned(balance: number, delta: number): number {
  assertIntegerAmount(balance, 'balance');
  assertIntegerAmount(delta, 'delta');
  const next = balance + delta;
  if (!Number.isSafeInteger(next)) throw new RangeError('Money overflow: result exceeds safe integer range');
  if (next < 0) throw new InsufficientFundsError('in-memory', -delta, balance);
  return next;
}

/** Formatage d'affichage HARD : centimes → "12,34 €" (présentation uniquement, jamais de calcul). */
export function formatHardCents(cents: number, locale = 'fr-FR', currency = 'EUR'): string {
  assertIntegerAmount(cents, 'cents');
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}
