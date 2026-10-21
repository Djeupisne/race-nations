import { AppError, AppErrorOptions } from './app-error';
export declare class BetStakeMismatchError extends AppError {
    readonly stakeA: number;
    readonly stakeB: number;
    constructor(stakeA: number, stakeB: number, options?: AppErrorOptions);
}
export declare class BetStakeOutOfRangeError extends AppError {
    readonly min: number;
    readonly max: number;
    readonly received: number;
    constructor(min: number, max: number, received: number, options?: AppErrorOptions);
}
export declare class BetDailyLimitExceededError extends AppError {
    readonly limit: number;
    readonly alreadyWagered: number;
    readonly attempted: number;
    constructor(limit: number, alreadyWagered: number, attempted: number, options?: AppErrorOptions);
}
export declare class BetAlreadySettledError extends AppError {
    readonly marketId: string;
    constructor(marketId: string, options?: AppErrorOptions);
}
export declare class JurisdictionBlockedError extends AppError {
    readonly countryCode: string;
    readonly currency: 'SOFT' | 'HARD';
    constructor(countryCode: string, currency: 'SOFT' | 'HARD', options?: AppErrorOptions);
}
export declare class AgeVerificationRequiredError extends AppError {
    constructor(options?: AppErrorOptions);
}
export declare class ReputationTooLowError extends AppError {
    readonly reputation: number;
    readonly required: number;
    constructor(reputation: number, required: number, options?: AppErrorOptions);
}
