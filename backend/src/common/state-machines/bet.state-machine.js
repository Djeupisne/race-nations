"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBetTerminal = isBetTerminal;
exports.allowedBetTransitions = allowedBetTransitions;
exports.canBetTransition = canBetTransition;
exports.assertBetTransition = assertBetTransition;
/**
 * Machine à états Bet (INV-22, INV-23) :
 *   PENDING → ACCEPTED → ESCROWED → RUNNING → WON | LOST | PUSH
 *   Annulation/push admin avant course → REFUNDED | VOIDED.
 *   Toute position monétaire réglée une seule fois (INV-23) : les états finaux
 *   WON/LOST/PUSH/REFUNDED/VOIDED sont terminaux et UNIQUE(marketId) côté
 *   BetSettlement empêche le double settlement (INV-14).
 *
 * Transitions clés :
 *  - ACCEPTED → ESCROWED exige le mouvement ledger BET_ESCROW correspondant (INV-15).
 *  - PUSH = égalité → remboursement intégral, houseCut = 0 (INV-16).
 *  - VOIDED = marché annulé avant course ; REFUNDED = argent rendu (push/annulation/litige résolu).
 */
var domain_errors_1 = require("../errors/domain-errors");
var BET_TRANSITIONS = Object.freeze({
    PENDING: ['ACCEPTED', 'REFUNDED', 'VOIDED'], // refus/expiration → remboursement, annulation marché → VOIDED
    ACCEPTED: ['ESCROWED', 'REFUNDED', 'VOIDED'],
    ESCROWED: ['RUNNING', 'REFUNDED', 'VOIDED'], // INV-15 : escrow posé par le ledger BET_ESCROW
    RUNNING: ['WON', 'LOST', 'PUSH', 'REFUNDED', 'VOIDED'], // PUSH = égalité (INV-16) ; REFUNDED = litige résolu (INV-18)
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
