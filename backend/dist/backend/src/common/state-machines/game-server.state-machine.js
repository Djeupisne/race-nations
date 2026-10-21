"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGameServerTerminal = isGameServerTerminal;
exports.allowedGameServerTransitions = allowedGameServerTransitions;
exports.canGameServerTransition = canGameServerTransition;
exports.assertGameServerTransition = assertGameServerTransition;
const domain_errors_1 = require("../errors/domain-errors");
const GAME_SERVER_TRANSITIONS = Object.freeze({
    REGISTERED: ['RESERVED', 'DRAINING', 'OFFLINE'],
    RESERVED: ['REGISTERED', 'DRAINING', 'OFFLINE'],
    DRAINING: ['OFFLINE'],
    OFFLINE: ['REGISTERED'],
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
//# sourceMappingURL=game-server.state-machine.js.map