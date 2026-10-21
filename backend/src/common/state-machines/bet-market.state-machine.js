"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBetMarketTerminal = isBetMarketTerminal;
exports.allowedBetMarketTransitions = allowedBetMarketTransitions;
exports.canBetMarketTransition = canBetMarketTransition;
exports.assertBetMarketTransition = assertBetMarketTransition;
/**
 * Machine à états BetMarket (INV-22, INV-14, INV-19) :
 *   OPEN → CHALLENGED → LOCKED → SETTLING → SETTLED
 *   (+ DISPUTED depuis CHALLENGED/LOCKED/RUNNING-side ; CANCELLED avant settlement)
 *
 * - DISPUTED gèle tout payout (INV-19, ≤ 72h — BETTING_CONSTANTS.DISPUTE_MAX_AGE_MS) ;
 *   la résolution admin repasse par SETTLING (issue normale) ou CANCELLED (remboursement).
 * - SETTLED est terminal et verrouillé en base par UNIQUE(marketId) sur BetSettlement (INV-14).
 * - Un marché lié à un match INVALIDATED ne peut pas atteindre SETTLED sans passer
 *   par DISPUTED puis résolution (INV-24/25).
 */
var domain_errors_1 = require("../errors/domain-errors");
var BET_MARKET_TRANSITIONS = Object.freeze({
    OPEN: ['CHALLENGED', 'CANCELLED'],
    CHALLENGED: ['LOCKED', 'DISPUTED', 'CANCELLED'],
    LOCKED: ['SETTLING', 'DISPUTED', 'CANCELLED'], // LOCKED = escrows posés + match lancé (INV-15)
    SETTLING: ['SETTLED', 'DISPUTED'],
    SETTLED: [],
    DISPUTED: ['SETTLING', 'CANCELLED'], // résolution admin dans les 72h (INV-19)
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
