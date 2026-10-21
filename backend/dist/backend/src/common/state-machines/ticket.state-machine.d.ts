export type TicketState = 'QUEUED' | 'MATCHED' | 'JOINED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
export declare function isTicketTerminal(state: TicketState): boolean;
export declare function allowedTicketTransitions(from: TicketState): readonly TicketState[];
export declare function canTicketTransition(from: TicketState, to: TicketState): boolean;
export declare function assertTicketTransition(from: TicketState, to: TicketState): void;
