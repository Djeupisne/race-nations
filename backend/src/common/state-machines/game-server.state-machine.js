"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGameServerTerminal = isGameServerTerminal;
exports.allowedGameServerTransitions = allowedGameServerTransitions;
exports.canGameServerTransition = canGameServerTransition;
exports.assertGameServerTransition = assertGameServerTransition;
/**
 * Machine à états GameServer (INV-22) :
 *   REGISTERED → RESERVED → DRAINING → OFFLINE
 *
 * - REGISTERED : serveur upserté par le heartbeat de la fleet, éligible à l'allocation.
 * - RESERVED : verrouillé pour un match (allocation atomique dans matchmaking.worker).
 * - DRAINING : maintenance volontaire — finit ses matchs, n'accepte plus d'allocation.
 * - OFFLINE : perdu par heartbeat timeout ou arrêt déclaré ; retour possible en REGISTERED
 *   après re-registration (le serveur repart d'un cycle propre).
 */
var domain_errors_1 = require("../errors/domain-errors");
var GAME_SERVER_TRANSITIONS = Object.freeze({
    REGISTERED: ['RESERVED', 'DRAINING', 'OFFLINE'],
    RESERVED: ['REGISTERED', 'DRAINING', 'OFFLINE'], // REGISTERED une fois le match libéré
    DRAINING: ['OFFLINE'],
    OFFLINE: ['REGISTERED'], // re-registration après redémarrage
});
function isGameServerTerminal(state) {
    return state === 'OFFLINE';
}
function allowedGameServerTransitions(from) {
    return GAME_SERVER_TRANSITIONS[from];
}
function canGameServerTransition(from, to) {
    return GAME_SERVER_TRANSITIONS[from].includes(to);
}
function assertGameServerTransition(from, to) {
    if (!canGameServerTransition(from, to)) {
        throw new domain_errors_1.InvalidStateTransitionError('GameServer', from, to);
    }
}
