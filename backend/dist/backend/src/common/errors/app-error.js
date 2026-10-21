"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.ERROR_HTTP_STATUS = exports.ERROR_CODES = void 0;
const node_crypto_1 = require("node:crypto");
exports.ERROR_CODES = [
    'VALIDATION_FAILED',
    'AUTH_UNAUTHENTICATED',
    'TOKEN_EXPIRED',
    'REFRESH_REUSED',
    'FORBIDDEN_ADMIN',
    'AGE_VERIFICATION_REQUIRED',
    'REPUTATION_TOO_LOW',
    'JURISDICTION_BLOCKED',
    'INSUFFICIENT_FUNDS',
    'IDEMPOTENCY_CONFLICT',
    'INVALID_STATE_TRANSITION',
    'BET_ALREADY_SETTLED',
    'BET_STAKE_MISMATCH',
    'BET_STAKE_OUT_OF_RANGE',
    'BET_DAILY_LIMIT_EXCEEDED',
    'RATE_LIMITED',
    'NOT_FOUND',
    'API_VERSION_RETIRED',
    'INTERNAL',
    'SERVER_UNAVAILABLE',
];
exports.ERROR_HTTP_STATUS = {
    VALIDATION_FAILED: 422,
    AUTH_UNAUTHENTICATED: 401,
    TOKEN_EXPIRED: 401,
    REFRESH_REUSED: 401,
    FORBIDDEN_ADMIN: 403,
    AGE_VERIFICATION_REQUIRED: 403,
    REPUTATION_TOO_LOW: 403,
    JURISDICTION_BLOCKED: 403,
    INSUFFICIENT_FUNDS: 409,
    IDEMPOTENCY_CONFLICT: 409,
    INVALID_STATE_TRANSITION: 409,
    BET_ALREADY_SETTLED: 409,
    BET_STAKE_MISMATCH: 422,
    BET_STAKE_OUT_OF_RANGE: 422,
    BET_DAILY_LIMIT_EXCEEDED: 422,
    RATE_LIMITED: 429,
    NOT_FOUND: 404,
    API_VERSION_RETIRED: 410,
    INTERNAL: 500,
    SERVER_UNAVAILABLE: 503,
};
class AppError extends Error {
    code;
    statusCode;
    details;
    requestId;
    constructor(code, message, options = {}) {
        super(message);
        this.name = new.target.name;
        this.code = code;
        this.statusCode = exports.ERROR_HTTP_STATUS[code];
        this.details = options.details;
        this.requestId = options.requestId ?? (0, node_crypto_1.randomUUID)();
        Error.captureStackTrace?.(this, new.target);
    }
    toJSON() {
        return {
            statusCode: this.statusCode,
            code: this.code,
            message: this.message,
            ...(this.details !== undefined ? { details: this.details } : {}),
            requestId: this.requestId,
        };
    }
    static create(code, message, options) {
        return new AppError(code, message, options);
    }
}
exports.AppError = AppError;
//# sourceMappingURL=app-error.js.map