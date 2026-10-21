export type SanctionState = 'ISSUED' | 'ACTIVE' | 'APPEALED' | 'LIFTED' | 'UPHELD';
export declare function isSanctionTerminal(state: SanctionState): boolean;
export declare function allowedSanctionTransitions(from: SanctionState): readonly SanctionState[];
export declare function canSanctionTransition(from: SanctionState, to: SanctionState): boolean;
export declare function assertSanctionTransition(from: SanctionState, to: SanctionState): void;
