"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BETTING_CONFIG = exports.BETTING_CONSTANTS = void 0;
exports.loadBettingConfig = loadBettingConfig;
exports.stakeBounds = stakeBounds;
exports.BETTING_CONSTANTS = {
    HOUSE_EDGE_BPS: 500,
    SOFT_STAKE_MIN: 10,
    SOFT_STAKE_MAX: 10_000,
    HARD_STAKE_MIN_CENTS: 100,
    HARD_STAKE_MAX_CENTS: 10_000,
    TOURNAMENT_STAKE_MIN: 50,
    TOURNAMENT_STAKE_MAX: 50_000,
    DAILY_SOFT_LIMIT: 10_000,
    DAILY_WINDOW_MS: 24 * 3_600_000,
    PL_DELTA_MAX: 300,
    DISCONNECT_TOLERANCE_MS: 30_000,
    DISPUTE_MAX_AGE_MS: 72 * 3_600_000,
    MIN_REPUTATION_HARD: 30,
    MIN_AGE_HARD: 18,
    MONTHLY_HARD_CAP_CENTS: 1_000_000,
};
const TRUTHY = new Set(['1', 'true', 'yes', 'on']);
function readFlag(env, name, fallback) {
    const raw = env[name];
    if (raw === undefined || raw === '')
        return fallback;
    return TRUTHY.has(raw.toLowerCase());
}
function loadBettingConfig(env = process.env) {
    return {
        constants: exports.BETTING_CONSTANTS,
        flags: () => ({
            hardEnabled: readFlag(env, 'BETTING_HARD_ENABLED', true),
            softEnabled: readFlag(env, 'BETTING_SOFT_ENABLED', true),
            matchmakingPaused: readFlag(env, 'MATCHMAKING_PAUSED', false),
            depositsPaused: readFlag(env, 'PAYMENTS_DEPOSITS_PAUSED', false),
        }),
    };
}
exports.BETTING_CONFIG = Symbol('BETTING_CONFIG');
function stakeBounds(currency) {
    return currency === 'SOFT'
        ? { min: exports.BETTING_CONSTANTS.SOFT_STAKE_MIN, max: exports.BETTING_CONSTANTS.SOFT_STAKE_MAX }
        : { min: exports.BETTING_CONSTANTS.HARD_STAKE_MIN_CENTS, max: exports.BETTING_CONSTANTS.HARD_STAKE_MAX_CENTS };
}
//# sourceMappingURL=betting.config.js.map