export declare const BETTING_CONSTANTS: {
    readonly HOUSE_EDGE_BPS: 500;
    readonly SOFT_STAKE_MIN: 10;
    readonly SOFT_STAKE_MAX: 10000;
    readonly HARD_STAKE_MIN_CENTS: 100;
    readonly HARD_STAKE_MAX_CENTS: 10000;
    readonly TOURNAMENT_STAKE_MIN: 50;
    readonly TOURNAMENT_STAKE_MAX: 50000;
    readonly DAILY_SOFT_LIMIT: 10000;
    readonly DAILY_WINDOW_MS: number;
    readonly PL_DELTA_MAX: 300;
    readonly DISCONNECT_TOLERANCE_MS: 30000;
    readonly DISPUTE_MAX_AGE_MS: number;
    readonly MIN_REPUTATION_HARD: 30;
    readonly MIN_AGE_HARD: 18;
    readonly MONTHLY_HARD_CAP_CENTS: 1000000;
};
export interface BettingFlags {
    hardEnabled: boolean;
    softEnabled: boolean;
    matchmakingPaused: boolean;
    depositsPaused: boolean;
}
export declare function loadBettingConfig(env?: NodeJS.ProcessEnv): {
    constants: typeof BETTING_CONSTANTS;
    flags: () => BettingFlags;
};
export declare const BETTING_CONFIG: unique symbol;
export type BettingConfig = ReturnType<typeof loadBettingConfig>;
export declare function stakeBounds(currency: 'SOFT' | 'HARD'): {
    min: number;
    max: number;
};
