"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerUnavailableError = exports.ApiVersionRetiredError = exports.RateLimitedError = exports.ValidationError = exports.RefreshReusedError = exports.TokenExpiredError = exports.AuthUnauthenticatedError = exports.ForbiddenAdminError = exports.NotFoundError = exports.InvalidStateTransitionError = exports.IdempotencyConflictError = exports.InsufficientFundsError = void 0;
const app_error_1 = require("./app-error");
class InsufficientFundsError extends app_error_1.AppError {
    walletId;
    required;
    available;
    constructor(walletId, required, available, options = {}) {
        super('INSUFFICIENT_FUNDS', `Insufficient funds: required ${required}, available ${available}.`, { details: { walletId, required, available }, ...options });
        this.walletId = walletId;
        this.required = required;
        this.available = available;
    }
}
exports.InsufficientFundsError = InsufficientFundsError;
class IdempotencyConflictError extends app_error_1.AppError {
    idempotencyKey;
    constructor(idempotencyKey, options = {}) {
        super('IDEMPOTENCY_CONFLICT', `Idempotency key already used with a different request: ${idempotencyKey}.`, {
            details: { idempotencyKey },
            ...options,
        });
        this.idempotencyKey = idempotencyKey;
    }
}
exports.IdempotencyConflictError = IdempotencyConflictError;
class InvalidStateTransitionError extends app_error_1.AppError {
    machine;
    from;
    to;
    constructor(machine, from, to, options = {}) {
        super('INVALID_STATE_TRANSITION', `Invalid ${machine} state transition: ${from} -> ${to}.`, {
            details: { machine, from, to },
            ...options,
        });
        this.machine = machine;
        this.from = from;
        this.to = to;
    }
}
exports.InvalidStateTransitionError = InvalidStateTransitionError;
class NotFoundError extends app_error_1.AppError {
    resource;
    id;
    constructor(resource, id, options = {}) {
        super('NOT_FOUND', `${resource} not found${id ? `: ${id}` : '.'}`, { details: { resource, id }, ...options });
        this.resource = resource;
        this.id = id;
    }
}
exports.NotFoundError = NotFoundError;
class ForbiddenAdminError extends app_error_1.AppError {
    constructor(options = {}, message = 'Administrator privileges required.') {
        super('FORBIDDEN_ADMIN', message, options);
    }
}
exports.ForbiddenAdminError = ForbiddenAdminError;
class AuthUnauthenticatedError extends app_error_1.AppError {
    constructor(options = {}, message = 'Authentication required.') {
        super('AUTH_UNAUTHENTICATED', message, options);
    }
}
exports.AuthUnauthenticatedError = AuthUnauthenticatedError;
class TokenExpiredError extends app_error_1.AppError {
    constructor(options = {}) {
        super('TOKEN_EXPIRED', 'Access token has expired.', options);
    }
}
exports.TokenExpiredError = TokenExpiredError;
class RefreshReusedError extends app_error_1.AppError {
    family;
    constructor(family, options = {}) {
        super('REFRESH_REUSED', 'Refresh token reuse detected; token family revoked.', {
            details: { family },
            ...options,
        });
        this.family = family;
    }
}
exports.RefreshReusedError = RefreshReusedError;
class ValidationError extends app_error_1.AppError {
    constructor(issues, options = {}) {
        super('VALIDATION_FAILED', 'Request validation failed.', { details: { issues }, ...options });
    }
}
exports.ValidationError = ValidationError;
class RateLimitedError extends app_error_1.AppError {
    retryAfterSeconds;
    constructor(retryAfterSeconds, options = {}) {
        super('RATE_LIMITED', `Too many requests. Retry after ${retryAfterSeconds}s.`, {
            details: { retryAfterSeconds },
            ...options,
        });
        this.retryAfterSeconds = retryAfterSeconds;
    }
}
exports.RateLimitedError = RateLimitedError;
class ApiVersionRetiredError extends app_error_1.AppError {
    version;
    constructor(version, options = {}) {
        super('API_VERSION_RETIRED', `API version ${version} is retired.`, { details: { version }, ...options });
        this.version = version;
    }
}
exports.ApiVersionRetiredError = ApiVersionRetiredError;
class ServerUnavailableError extends app_error_1.AppError {
    dependency;
    constructor(dependency, options = {}) {
        super('SERVER_UNAVAILABLE', `Dependency unavailable: ${dependency}.`, { details: { dependency }, ...options });
        this.dependency = dependency;
    }
}
exports.ServerUnavailableError = ServerUnavailableError;
//# sourceMappingURL=domain-errors.js.map