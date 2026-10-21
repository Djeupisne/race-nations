"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.ERROR_HTTP_STATUS = exports.ERROR_CODES = void 0;
/**
 * AppError — socle d'erreur unique du backend (docs/api.md §1.2, RFC-7807 simplifié).
 *
 * Règles :
 *  - Tout code métier provient de `ErrorCode` (shared/api-contracts/src/enums.ts) ;
 *    jamais de code inventé localement (contrat stable, ne jamais changer le HTTP status).
 *  - `toJSON()` produit exactement l'enveloppe API : { statusCode, code, message, details?, requestId }.
 *  - Les erreurs de domaine (domain-errors.ts) et betting (betting-errors.ts) étendent cette classe.
 */
var node_crypto_1 = require("node:crypto");
/** Codes métier stables — miroir exact de ErrorCodeSchema (shared/api-contracts/src/enums.ts). */
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
/** Mapping code → HTTP status (docs/api.md §1.2). figé — contrat d'API. */
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
/**
 * Erreur applicative de base. C'est LE seul type d'erreur que le filtre global
 * (all-exceptions.filter.ts) mappe vers l'enveloppe API ; toute autre erreur
 * remontée est convertie en INTERNAL (500) sans fuite de stack.
 */
var AppError = /** @class */ (function (_super) {
    __extends(AppError, _super);
    function AppError(code, message, options) {
        if (options === void 0) { options = {}; }
        var _newTarget = this.constructor;
        var _a, _b;
        var _this = _super.call(this, message) || this;
        _this.name = _newTarget.name;
        _this.code = code;
        _this.statusCode = exports.ERROR_HTTP_STATUS[code];
        _this.details = options.details;
        _this.requestId = (_a = options.requestId) !== null && _a !== void 0 ? _a : (0, node_crypto_1.randomUUID)();
        (_b = Error.captureStackTrace) === null || _b === void 0 ? void 0 : _b.call(Error, _this, _newTarget);
        return _this;
    }
    /** Enveloppe d'erreur API (docs/api.md §1.2). */
    AppError.prototype.toJSON = function () {
        return __assign(__assign({ statusCode: this.statusCode, code: this.code, message: this.message }, (this.details !== undefined ? { details: this.details } : {})), { requestId: this.requestId });
    };
    /** Fabrique générique — utile pour les cas simples sans classe dédiée. */
    AppError.create = function (code, message, options) {
        return new AppError(code, message, options);
    };
    return AppError;
}(Error));
exports.AppError = AppError;
