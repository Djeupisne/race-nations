"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPaymentTerminal = isPaymentTerminal;
exports.allowedPaymentTransitions = allowedPaymentTransitions;
exports.canPaymentTransition = canPaymentTransition;
exports.assertPaymentTransition = assertPaymentTransition;
const domain_errors_1 = require("../errors/domain-errors");
const PAYMENT_TRANSITIONS = Object.freeze({
    CREATED: ['PROVIDER_PENDING', 'FAILED', 'CANCELLED'],
    PROVIDER_PENDING: ['SUCCEEDED', 'FAILED', 'CANCELLED'],
    SUCCEEDED: [],
    FAILED: [],
    CANCELLED: [],
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
//# sourceMappingURL=payment.state-machine.js.map