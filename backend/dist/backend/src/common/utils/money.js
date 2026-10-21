"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertIntegerAmount = assertIntegerAmount;
exports.floorDiv = floorDiv;
exports.floorRemainder = floorRemainder;
exports.applyBpsFloor = applyBpsFloor;
exports.addSigned = addSigned;
exports.formatHardCents = formatHardCents;
const domain_errors_1 = require("../errors/domain-errors");
function assertIntegerAmount(amount, label = 'amount') {
    if (!Number.isSafeInteger(amount)) {
        throw new TypeError(`Money invariant INV-01 violated: ${label} must be a safe integer, got ${String(amount)}`);
    }
    return amount;
}
function floorDiv(numerator, denominator) {
    assertIntegerAmount(numerator, 'numerator');
    assertIntegerAmount(denominator, 'denominator');
    if (denominator === 0)
        throw new RangeError('floorDiv: denominator must be non-zero');
    return Math.floor(numerator / denominator);
}
function floorRemainder(numerator, denominator) {
    return numerator - floorDiv(numerator, denominator) * denominator;
}
function applyBpsFloor(amount, bps) {
    assertIntegerAmount(amount, 'amount');
    assertIntegerAmount(bps, 'bps');
    return floorDiv(amount * bps, 10_000);
}
function addSigned(balance, delta) {
    assertIntegerAmount(balance, 'balance');
    assertIntegerAmount(delta, 'delta');
    const next = balance + delta;
    if (!Number.isSafeInteger(next))
        throw new RangeError('Money overflow: result exceeds safe integer range');
    if (next < 0)
        throw new domain_errors_1.InsufficientFundsError('in-memory', -delta, balance);
    return next;
}
function formatHardCents(cents, locale = 'fr-FR', currency = 'EUR') {
    assertIntegerAmount(cents, 'cents');
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}
//# sourceMappingURL=money.js.map