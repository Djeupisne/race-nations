/**
 * Machine à états MatchmakingTicket (INV-22) :
 *   QUEUED → MATCHED → JOINED → COMPLETED | CANCELLED | EXPIRED
 *
 * - CANCELLED possible tant que le joueur n'est pas engagé (QUEUED/MATCHED) ;
 *   après JOINED l'abandon relève du match (INV-17), plus du ticket.
 * - EXPIRED posée par le worker matchmaking quand la fenêtre max du mode est dépassée.
 */
import { InvalidStateTransitionError } from '../errors/domain-errors';

export type TicketState = 'QUEUED' | 'MATCHED' | 'JOINED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

const TICKET_TRANSITIONS: Readonly<Record<TicketState, readonly TicketState[]>> = Object.freeze({
  QUEUED: ['MATCHED', 'CANCELLED', 'EXPIRED'],
  MATCHED: ['JOINED', 'CANCELLED', 'EXPIRED'],
  JOINED: ['COMPLETED', 'EXPIRED'],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
});

export function isTicketTerminal(state: TicketState): boolean {
  return TICKET_TRANSITIONS[state].length === 0;
}

export function allowedTicketTransitions(from: TicketState): readonly TicketState[] {
  return TICKET_TRANSITIONS[from];
}

export function canTicketTransition(from: TicketState, to: TicketState): boolean {
  return TICKET_TRANSITIONS[from].includes(to);
}

export function assertTicketTransition(from: TicketState, to: TicketState): void {
  if (!canTicketTransition(from, to)) {
    throw new InvalidStateTransitionError('Ticket', from, to);
  }
}
