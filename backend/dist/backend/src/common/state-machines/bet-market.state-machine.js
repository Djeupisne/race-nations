"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBetMarketTerminal = isBetMarketTerminal;
exports.allowedBetMarketTransitions = allowedBetMarketTransitions;
exports.canBetMarketTransition = canBetMarketTransition;
exports.assertBetMarketTransition = assertBetMarketTransition;
const domain_errors_1 = require("../errors/domain-errors");
const BET_MARKET_TRANSITIONS = Object.freeze({
    OPEN: ['CHALLENGED', 'CANCELLED'],
    CHALLENGED: ['LOCKED', 'DISPUTED', 'CANCELLED'],
    LOCKED: ['RUNNING', 'SETTLING', 'DISPUTED', 'CANCELLED'],
    RUNNING: ['SETTLING', 'DISPUTED', 'CANCELLED'],
    SETTLING: ['SETTLED', 'DISPUTED'],
    SETTLED: [],
    DISPUTED: ['SETTLING', 'CANCELLED'],
    CANCELLED: [],
});
function isBetMarketTerminal(state) {
    return BET_MARKET_TRANSITIONS[state].length === 0;
}
function allowedBetMarketTransitions(from) {
    return BET_MARKET_TRANSITIONS[from];
}
function canBetMarketTransition(from, to) {
    return BET_MARKET_TRANSITIONS[from].includes(to);
}
function assertBetMarketTransition(from, to) {
    if (!canBetMarketTransition(from, to)) {
        throw new domain_errors_1.InvalidStateTransitionError('BetMarket', from, to);
    }
}
//# sourceMappingURL=bet-market.state-machine.js.map