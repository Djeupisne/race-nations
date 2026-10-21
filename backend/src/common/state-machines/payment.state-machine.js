"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPaymentTerminal = isPaymentTerminal;
exports.allowedPaymentTransitions = allowedPaymentTransitions;
exports.canPaymentTransition = canPaymentTransition;
exports.assertPaymentTransition = assertPaymentTransition;
/**
 * Machine à états Payment (INV-22, INV-23) :
 *   CREATED → PROVIDER_PENDING → SUCCEEDED | FAILED | CANCELLED
 *
 * - SUCCEEDED / FAILED / CANCELLED sont TERMINAUX (INV-23) : un webhook tardif ne
 *   doit jamais rouvrir un paiement ; toute correction = nouvelle écriture ledger REVERSAL.
 * - Seul le webhook provider (signature vérifiée, INV-26 + idempotence 0003) fait
 *   avancer PROVIDER_PENDING → terminal ; le client peut CANCELLED tant que CREATED.
 */
var domain_errors_1 = require("../errors/domain-errors");
var PAYMENT_TRANSITIONS = Object.freeze({
    CREATED: ['PROVIDER_PENDING', 'FAILED', 'CANCELLED'],
    PROVIDER_PENDING: ['SUCCEEDED', 'FAILED', 'CANCELLED'],
    SUCCEEDED: [], // terminal — crédit HARD déjà passé par wallet.repository (INV-03)
    FAILED: [], // terminal
    CANCELLED: [], // terminal
});
function isPaymentTerminal(state) {
    return PAYMENT_TRANSITIONS[state].length === 0;
}
function allowedPaymentTransitions(from) {
    return PAYMENT_TRANSITIONS[from];
}
function canPaymentTransition(from, to) {
    return PAYMENT_TRANSITIONS[from].includes(to);
}
function assertPaymentTransition(from, to) {
    if (!canPaymentTransition(from, to)) {
        throw new domain_errors_1.InvalidStateTransitionError('Payment', from, to);
    }
}
