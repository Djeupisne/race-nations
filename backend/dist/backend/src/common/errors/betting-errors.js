"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReputationTooLowError = exports.AgeVerificationRequiredError = exports.JurisdictionBlockedError = exports.BetAlreadySettledError = exports.BetDailyLimitExceededError = exports.BetStakeOutOfRangeError = exports.BetStakeMismatchError = void 0;
const app_error_1 = require("./app-error");
class BetStakeMismatchError extends app_error_1.AppError {
    stakeA;
    stakeB;
    constructor(stakeA, stakeB, options = {}) {
        super('BET_STAKE_MISMATCH', `Challenge stakes must be equal: got ${stakeA} vs ${stakeB}.`, {
            details: { stakeA, stakeB },
            ...options,
        });
        this.stakeA = stakeA;
        this.stakeB = stakeB;
    }
}
exports.BetStakeMismatchError = BetStakeMismatchError;
class BetStakeOutOfRangeError extends app_error_1.AppError {
    min;
    max;
    received;
    constructor(min, max, received, options = {}) {
        super('BET_STAKE_OUT_OF_RANGE', `Stake must be between ${min} and ${max}.`, {
            details: { min, max, received },
            ...options,
        });
        this.min = min;
        this.max = max;
        this.received = received;
    }
}
exports.BetStakeOutOfRangeError = BetStakeOutOfRangeError;
class BetDailyLimitExceededError extends app_error_1.AppError {
    limit;
    alreadyWagered;
    attempted;
    constructor(limit, alreadyWagered, attempted, options = {}) {
        super('BET_DAILY_LIMIT_EXCEEDED', `Daily betting limit exceeded: limit ${limit}, already wagered ${alreadyWagered}.`, {
            details: { limit, alreadyWagered, attempted },
            ...options,
        });
        this.limit = limit;
        this.alreadyWagered = alreadyWagered;
        this.attempted = attempted;
    }
}
exports.BetDailyLimitExceededError = BetDailyLimitExceededError;
class BetAlreadySettledError extends app_error_1.AppError {
    marketId;
    constructor(marketId, options = {}) {
        super('BET_ALREADY_SETTLED', `Market already settled: ${marketId}.`, { details: { marketId }, ...options });
        this.marketId = marketId;
    }
}
exports.BetAlreadySettledError = BetAlreadySettledError;
class JurisdictionBlockedError extends app_error_1.AppError {
    countryCode;
    currency;
    constructor(countryCode, currency, options = {}) {
        super('JURISDICTION_BLOCKED', `Betting (${currency}) is not available in jurisdiction ${countryCode}.`, {
            details: { countryCode, currency },
            ...options,
        });
        this.countryCode = countryCode;
        this.currency = currency;
    }
}
exports.JurisdictionBlockedError = JurisdictionBlockedError;
class AgeVerificationRequiredError extends app_error_1.AppError {
    constructor(options = {}) {
        super('AGE_VERIFICATION_REQUIRED', 'Age verification (18+) is required for real-money betting.', options);
    }
}
exports.AgeVerificationRequiredError = AgeVerificationRequiredError;
class ReputationTooLowError extends app_error_1.AppError {
    reputation;
    required;
    constructor(reputation, required, options = {}) {
        super('REPUTATION_TOO_LOW', `Reputation ${reputation} is below the required ${required}.`, {
            details: { reputation, required },
            ...options,
        });
        this.reputation = reputation;
        this.required = required;
    }
}
exports.ReputationTooLowError = ReputationTooLowError;
//# sourceMappingURL=betting-errors.js.map