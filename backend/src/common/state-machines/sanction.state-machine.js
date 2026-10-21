"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSanctionTerminal = isSanctionTerminal;
exports.allowedSanctionTransitions = allowedSanctionTransitions;
exports.canSanctionTransition = canSanctionTransition;
exports.assertSanctionTransition = assertSanctionTransition;
/**
 * Machine à états Sanction (INV-22, INV-18/21) :
 *   ISSUED → ACTIVE → APPEALED → LIFTED | UPHELD
 *
 * - ISSUED → ACTIVE est posée par la modération au moment de l'application effective
 *   (mute/ban/restriction de paris). Une sanction expirée (TEMP_BAN_7D) devient LIFTED.
 * - APPEALED gèle les effets conservatifs mais ne suspend pas une PERM_BAN sans décision admin.
 * - LIFTED et UPHELD sont terminaux : une récidive crée une NOUVELLE sanction (audit trail).
 */
var domain_errors_1 = require("../errors/domain-errors");
var SANCTION_TRANSITIONS = Object.freeze({
    ISSUED: ['ACTIVE', 'LIFTED'], // LIFTED possible si erreur reconnue avant application
    ACTIVE: ['APPEALED', 'LIFTED'],
    APPEALED: ['LIFTED', 'UPHELD'],
    LIFTED: [],
    UPHELD: [],
});
function isSanctionTerminal(state) {
    return SANCTION_TRANSITIONS[state].length === 0;
}
function allowedSanctionTransitions(from) {
    return SANCTION_TRANSITIONS[from];
}
function canSanctionTransition(from, to) {
    return SANCTION_TRANSITIONS[from].includes(to);
}
function assertSanctionTransition(from, to) {
    if (!canSanctionTransition(from, to)) {
        throw new domain_errors_1.InvalidStateTransitionError('Sanction', from, to);
    }
}
