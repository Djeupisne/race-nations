export type BetMarketState = 'OPEN' | 'CHALLENGED' | 'LOCKED' | 'RUNNING' | 'SETTLING' | 'SETTLED' | 'DISPUTED' | 'CANCELLED';
export declare function isBetMarketTerminal(state: BetMarketState): boolean;
export declare function allowedBetMarketTransitions(from: BetMarketState): readonly BetMarketState[];
export declare function canBetMarketTransition(from: BetMarketState, to: BetMarketState): boolean;
export declare function assertBetMarketTransition(from: BetMarketState, to: BetMarketState): void;
