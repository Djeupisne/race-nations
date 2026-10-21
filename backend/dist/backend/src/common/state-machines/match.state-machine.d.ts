export type MatchState = 'WAITING_FOR_PLAYERS' | 'LOADING' | 'IN_PROGRESS' | 'FINISHED' | 'FINISHED_VALIDATED' | 'INVALIDATED';
export declare function isMatchTerminal(state: MatchState): boolean;
export declare function allowedMatchTransitions(from: MatchState): readonly MatchState[];
export declare function canMatchTransition(from: MatchState, to: MatchState): boolean;
export declare function assertMatchTransition(from: MatchState, to: MatchState): void;
