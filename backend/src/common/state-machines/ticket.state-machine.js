"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTicketTerminal = isTicketTerminal;
exports.allowedTicketTransitions = allowedTicketTransitions;
exports.canTicketTransition = canTicketTransition;
exports.assertTicketTransition = assertTicketTransition;
/**
 * Machine à états MatchmakingTicket (INV-22) :
 *   QUEUED → MATCHED → JOINED → COMPLETED | CANCELLED | EXPIRED
 *
 * - CANCELLED possible tant que le joueur n'est pas engagé (QUEUED/MATCHED) ;
 *   après JOINED l'abandon relève du match (INV-17), plus du ticket.
 * - EXPIRED posée par le worker matchmaking quand la fenêtre max du mode est dépassée.
 */
var domain_errors_1 = require("../errors/domain-errors");
var TICKET_TRANSITIONS = Object.freeze({
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
