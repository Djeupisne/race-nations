"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTicketTerminal = isTicketTerminal;
exports.allowedTicketTransitions = allowedTicketTransitions;
exports.canTicketTransition = canTicketTransition;
exports.assertTicketTransition = assertTicketTransition;
const domain_errors_1 = require("../errors/domain-errors");
const TICKET_TRANSITIONS = Object.freeze({
    QUEUED: ['MATCHED', 'CANCELLED', 'EXPIRED'],
    MATCHED: ['JOINED', 'CANCELLED', 'EXPIRED'],
    JOINED: ['COMPLETED', 'EXPIRED'],
    COMPLETED: [],
    CANCELLED: [],
    EXPIRED: [],
});
function isTicketTerminal(state) {
    return TICKET_TRANSITIONS[state].length === 0;
}
function allowedTicketTransitions(from) {
    return TICKET_TRANSITIONS[from];
}
function canTicketTransition(from, to) {
    return TICKET_TRANSITIONS[from].includes(to);
}
function assertTicketTransition(from, to) {
    if (!canTicketTransition(from, to)) {
        throw new domain_errors_1.InvalidStateTransitionError('Ticket', from, to);
    }
}
//# sourceMappingURL=ticket.state-machine.js.map