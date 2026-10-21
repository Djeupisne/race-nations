"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSanctionTerminal = isSanctionTerminal;
exports.allowedSanctionTransitions = allowedSanctionTransitions;
exports.canSanctionTransition = canSanctionTransition;
exports.assertSanctionTransition = assertSanctionTransition;
const domain_errors_1 = require("../errors/domain-errors");
const SANCTION_TRANSITIONS = Object.freeze({
    ISSUED: ['ACTIVE', 'LIFTED'],
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
//# sourceMappingURL=sanction.state-machine.js.map