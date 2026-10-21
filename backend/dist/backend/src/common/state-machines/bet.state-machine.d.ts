export type BetState = 'PENDING' | 'ACCEPTED' | 'ESCROWED' | 'RUNNING' | 'WON' | 'LOST' | 'PUSH' | 'REFUNDED' | 'VOIDED';
export declare function isBetTerminal(state: BetState): boolean;
export declare function allowedBetTransitions(from: BetState): readonly BetState[];
export declare function canBetTransition(from: BetState, to: BetState): boolean;
export declare function assertBetTransition(from: BetState, to: BetState): void;
