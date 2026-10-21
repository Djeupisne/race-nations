import { AppError, AppErrorOptions } from './app-error';
export declare class InsufficientFundsError extends AppError {
    readonly walletId: string;
    readonly required: number;
    readonly available: number;
    constructor(walletId: string, required: number, available: number, options?: AppErrorOptions);
}
export declare class IdempotencyConflictError extends AppError {
    readonly idempotencyKey: string;
    constructor(idempotencyKey: string, options?: AppErrorOptions);
}
export declare class InvalidStateTransitionError extends AppError {
    readonly machine: string;
    readonly from: string;
    readonly to: string;
    constructor(machine: string, from: string, to: string, options?: AppErrorOptions);
}
export declare class NotFoundError extends AppError {
    readonly resource: string;
    readonly id?: string | undefined;
    constructor(resource: string, id?: string | undefined, options?: AppErrorOptions);
}
export declare class ForbiddenAdminError extends AppError {
    constructor(options?: AppErrorOptions, message?: string);
}
export declare class AuthUnauthenticatedError extends AppError {
    constructor(options?: AppErrorOptions, message?: string);
}
export declare class TokenExpiredError extends AppError {
    constructor(options?: AppErrorOptions);
}
export declare class RefreshReusedError extends AppError {
    readonly family: number;
    constructor(family: number, options?: AppErrorOptions);
}
export declare class ValidationError extends AppError {
    constructor(issues: unknown, options?: AppErrorOptions);
}
export declare class RateLimitedError extends AppError {
    readonly retryAfterSeconds: number;
    constructor(retryAfterSeconds: number, options?: AppErrorOptions);
}
export declare class ApiVersionRetiredError extends AppError {
    readonly version: string;
    constructor(version: string, options?: AppErrorOptions);
}
export declare class ServerUnavailableError extends AppError {
    readonly dependency: string;
    constructor(dependency: string, options?: AppErrorOptions);
}
