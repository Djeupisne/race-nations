"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBetTerminal = isBetTerminal;
exports.allowedBetTransitions = allowedBetTransitions;
exports.canBetTransition = canBetTransition;
exports.assertBetTransition = assertBetTransition;
const domain_errors_1 = require("../errors/domain-errors");
const BET_TRANSITIONS = Object.freeze({
    PENDING: ['ACCEPTED', 'REFUNDED', 'VOIDED'],
    ACCEPTED: ['ESCROWED', 'REFUNDED', 'VOIDED'],
    ESCROWED: ['RUNNING', 'REFUNDED', 'VOIDED'],
    RUNNING: ['WON', 'LOST', 'PUSH', 'REFUNDED', 'VOIDED'],
    WON: [],
    LOST: [],
    PUSH: [],
    REFUNDED: [],
    VOIDED: [],
});
function isBetTerminal(state) {
    return BET_TRANSITIONS[state].length === 0;
}
function allowedBetTransitions(from) {
    return BET_TRANSITIONS[from];
}
function canBetTransition(from, to) {
    return BET_TRANSITIONS[from].includes(to);
}
function assertBetTransition(from, to) {
    if (!canBetTransition(from, to)) {
        throw new domain_errors_1.InvalidStateTransitionError('Bet', from, to);
    }
}
//# sourceMappingURL=bet.state-machine.js.map