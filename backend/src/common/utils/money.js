"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertIntegerAmount = assertIntegerAmount;
exports.floorDiv = floorDiv;
exports.floorRemainder = floorRemainder;
exports.applyBpsFloor = applyBpsFloor;
exports.addSigned = addSigned;
exports.formatHardCents = formatHardCents;
/**
 * Money — manipulation monétaire 100% entiers (INV-01).
 * SOFT : unités entières (credits/gems/tokens). HARD : centimes entiers.
 * Interdiction absolue : float, Decimal, arrondi bancaire implicite.
 * Toute division passe par floorDiv et le résidu est explicite (INV-05/INV-09).
 */
var domain_errors_1 = require("../errors/domain-errors");
/** Garde-fou runtime : valeur monétaire = entier non vide. Lève si float/NaN/infini. */
function assertIntegerAmount(amount, label) {
    if (label === void 0) { label = 'amount'; }
    if (!Number.isSafeInteger(amount)) {
        throw new TypeError("Money invariant INV-01 violated: ".concat(label, " must be a safe integer, got ").concat(String(amount)));
    }
    return amount;
}
/** Division plancher — le résidu n'est JAMAIS perdu (appelé doit le créditer au House, INV-09). */
function floorDiv(numerator, denominator) {
    assertIntegerAmount(numerator, 'numerator');
    assertIntegerAmount(denominator, 'denominator');
    if (denominator === 0)
        throw new RangeError('floorDiv: denominator must be non-zero');
    return Math.floor(numerator / denominator);
}
/** Résidu du plancher : numerator - floorDiv*denominator (>= 0 si numerator >= 0). */
function floorRemainder(numerator, denominator) {
    return numerator - floorDiv(numerator, denominator) * denominator;
}
/** bps = basis points /10000 → part plancher de `amount` (ex. houseCut, INV-08). */
function applyBpsFloor(amount, bps) {
    assertIntegerAmount(amount, 'amount');
    assertIntegerAmount(bps, 'bps');
    return floorDiv(amount * bps, 10000);
}
/** Addition signée sûre (ledger) : bornée aux entiers sûrs, jamais négative sur un solde (INV-02 vérifié par l'appelant SQL). */
function addSigned(balance, delta) {
    assertIntegerAmount(balance, 'balance');
    assertIntegerAmount(delta, 'delta');
    var next = balance + delta;
    if (!Number.isSafeInteger(next))
        throw new RangeError('Money overflow: result exceeds safe integer range');
    if (next < 0)
        throw new domain_errors_1.InsufficientFundsError('in-memory', -delta, balance);
    return next;
}
/** Formatage d'affichage HARD : centimes → "12,34 €" (présentation uniquement, jamais de calcul). */
function formatHardCents(cents, locale, currency) {
    if (locale === void 0) { locale = 'fr-FR'; }
    if (currency === void 0) { currency = 'EUR'; }
    assertIntegerAmount(cents, 'cents');
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(cents / 100);
}
