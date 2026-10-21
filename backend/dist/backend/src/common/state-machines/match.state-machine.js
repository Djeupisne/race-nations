"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMatchTerminal = isMatchTerminal;
exports.allowedMatchTransitions = allowedMatchTransitions;
exports.canMatchTransition = canMatchTransition;
exports.assertMatchTransition = assertMatchTransition;
const domain_errors_1 = require("../errors/domain-errors");
const MATCH_TRANSITIONS = Object.freeze({
    WAITING_FOR_PLAYERS: ['LOADING', 'INVALIDATED'],
    LOADING: ['IN_PROGRESS', 'INVALIDATED'],
    IN_PROGRESS: ['FINISHED', 'INVALIDATED'],
    FINISHED: ['FINISHED_VALIDATED', 'INVALIDATED'],
    FINISHED_VALIDATED: [],
    INVALIDATED: [],
});
function isMatchTerminal(state) {
    return MATCH_TRANSITIONS[state].length === 0;
}
function allowedMatchTransitions(from) {
    return MATCH_TRANSITIONS[from];
}
function canMatchTransition(from, to) {
    return MATCH_TRANSITIONS[from].includes(to);
}
function assertMatchTransition(from, to) {
    if (!canMatchTransition(from, to)) {
        throw new domain_errors_1.InvalidStateTransitionError('Match', from, to);
    }
}
//# sourceMappingURL=match.state-machine.js.map