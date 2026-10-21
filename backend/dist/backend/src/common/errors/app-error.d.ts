export declare const ERROR_CODES: readonly ["VALIDATION_FAILED", "AUTH_UNAUTHENTICATED", "TOKEN_EXPIRED", "REFRESH_REUSED", "FORBIDDEN_ADMIN", "AGE_VERIFICATION_REQUIRED", "REPUTATION_TOO_LOW", "JURISDICTION_BLOCKED", "INSUFFICIENT_FUNDS", "IDEMPOTENCY_CONFLICT", "INVALID_STATE_TRANSITION", "BET_ALREADY_SETTLED", "BET_STAKE_MISMATCH", "BET_STAKE_OUT_OF_RANGE", "BET_DAILY_LIMIT_EXCEEDED", "RATE_LIMITED", "NOT_FOUND", "API_VERSION_RETIRED", "INTERNAL", "SERVER_UNAVAILABLE"];
export type ErrorCode = (typeof ERROR_CODES)[number];
export declare const ERROR_HTTP_STATUS: Readonly<Record<ErrorCode, number>>;
export interface AppErrorOptions {
    details?: Record<string, unknown>;
    requestId?: string;
}
export declare class AppError extends Error {
    readonly code: ErrorCode;
    readonly statusCode: number;
    readonly details?: Record<string, unknown>;
    readonly requestId: string;
    constructor(code: ErrorCode, message: string, options?: AppErrorOptions);
    toJSON(): {
        statusCode: number;
        code: ErrorCode;
        message: string;
        details?: Record<string, unknown>;
        requestId: string;
    };
    static create(code: ErrorCode, message: string, options?: AppErrorOptions): AppError;
}
