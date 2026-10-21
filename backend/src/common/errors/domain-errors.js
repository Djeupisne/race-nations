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
exports.ServerUnavailableError = exports.ApiVersionRetiredError = exports.RateLimitedError = exports.ValidationError = exports.RefreshReusedError = exports.TokenExpiredError = exports.AuthUnauthenticatedError = exports.ForbiddenAdminError = exports.NotFoundError = exports.InvalidStateTransitionError = exports.IdempotencyConflictError = exports.InsufficientFundsError = void 0;
/**
 * Erreurs de domaine transverses (wallet, auth, états, ressources).
 * Chaque classe porte le code métier stable et le HTTP status associé
 * (docs/api.md §1.2) — ne jamais instancier AppError directement pour
 * un cas couvert par une de ces classes (lisibilité + tests d'invariants).
 */
var app_error_1 = require("./app-error");
/** INV-02 — débit refusé : `UPDATE ... WHERE balance >= amount` n'a rien matché. */
var InsufficientFundsError = /** @class */ (function (_super) {
    __extends(InsufficientFundsError, _super);
    function InsufficientFundsError(walletId, required, available, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, 'INSUFFICIENT_FUNDS', "Insufficient funds: required ".concat(required, ", available ").concat(available, "."), __assign({ details: { walletId: walletId, required: required, available: available } }, options)) || this;
        _this.walletId = walletId;
        _this.required = required;
        _this.available = available;
        return _this;
    }
    return InsufficientFundsError;
}(app_error_1.AppError));
exports.InsufficientFundsError = InsufficientFundsError;
/** INV-04 — même idempotencyKey avec un payload différent → conflit (le replay strict est renvoyé ailleurs). */
var IdempotencyConflictError = /** @class */ (function (_super) {
    __extends(IdempotencyConflictError, _super);
    function IdempotencyConflictError(idempotencyKey, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, 'IDEMPOTENCY_CONFLICT', "Idempotency key already used with a different request: ".concat(idempotencyKey, "."), __assign({ details: { idempotencyKey: idempotencyKey } }, options)) || this;
        _this.idempotencyKey = idempotencyKey;
        return _this;
    }
    return IdempotencyConflictError;
}(app_error_1.AppError));
exports.IdempotencyConflictError = IdempotencyConflictError;
/** INV-22 — transition hors graphe autorisé ; N'EST JAMAIS persistée. */
var InvalidStateTransitionError = /** @class */ (function (_super) {
    __extends(InvalidStateTransitionError, _super);
    function InvalidStateTransitionError(machine, from, to, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, 'INVALID_STATE_TRANSITION', "Invalid ".concat(machine, " state transition: ").concat(from, " -> ").concat(to, "."), __assign({ details: { machine: machine, from: from, to: to } }, options)) || this;
        _this.machine = machine;
        _this.from = from;
        _this.to = to;
        return _this;
    }
    return InvalidStateTransitionError;
}(app_error_1.AppError));
exports.InvalidStateTransitionError = InvalidStateTransitionError;
/** Ressource inexistante ou invisible pour l'appelant (pas d'enumeration : 404 uniforme). */
var NotFoundError = /** @class */ (function (_super) {
    __extends(NotFoundError, _super);
    function NotFoundError(resource, id, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, 'NOT_FOUND', "".concat(resource, " not found").concat(id ? ": ".concat(id) : '.'), __assign({ details: { resource: resource, id: id } }, options)) || this;
        _this.resource = resource;
        _this.id = id;
        return _this;
    }
    return NotFoundError;
}(app_error_1.AppError));
exports.NotFoundError = NotFoundError;
/** Authz INV-28 — rôle ADMIN/MODERATOR requis (settle manuel, sanctions, House Wallet). */
var ForbiddenAdminError = /** @class */ (function (_super) {
    __extends(ForbiddenAdminError, _super);
    function ForbiddenAdminError(options, message) {
        if (options === void 0) { options = {}; }
        if (message === void 0) { message = 'Administrator privileges required.'; }
        return _super.call(this, 'FORBIDDEN_ADMIN', message, options) || this;
    }
    return ForbiddenAdminError;
}(app_error_1.AppError));
exports.ForbiddenAdminError = ForbiddenAdminError;
/** Auth — JWT absent/expiré/valide mais non authentifié. */
var AuthUnauthenticatedError = /** @class */ (function (_super) {
    __extends(AuthUnauthenticatedError, _super);
    function AuthUnauthenticatedError(options, message) {
        if (options === void 0) { options = {}; }
        if (message === void 0) { message = 'Authentication required.'; }
        return _super.call(this, 'AUTH_UNAUTHENTICATED', message, options) || this;
    }
    return AuthUnauthenticatedError;
}(app_error_1.AppError));
exports.AuthUnauthenticatedError = AuthUnauthenticatedError;
/** Access token expiré → le client doit appeler /auth/refresh. */
var TokenExpiredError = /** @class */ (function (_super) {
    __extends(TokenExpiredError, _super);
    function TokenExpiredError(options) {
        if (options === void 0) { options = {}; }
        return _super.call(this, 'TOKEN_EXPIRED', 'Access token has expired.', options) || this;
    }
    return TokenExpiredError;
}(app_error_1.AppError));
exports.TokenExpiredError = TokenExpiredError;
/** Rotation INV-23/auth : un refresh déjà consommé est réutilisé → famille révoquée. */
var RefreshReusedError = /** @class */ (function (_super) {
    __extends(RefreshReusedError, _super);
    function RefreshReusedError(family, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, 'REFRESH_REUSED', 'Refresh token reuse detected; token family revoked.', __assign({ details: { family: family } }, options)) || this;
        _this.family = family;
        return _this;
    }
    return RefreshReusedError;
}(app_error_1.AppError));
exports.RefreshReusedError = RefreshReusedError;
/** Validation Zod échouée (INV-27) — portée par ZodValidationPipe. */
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(issues, options) {
        if (options === void 0) { options = {}; }
        return _super.call(this, 'VALIDATION_FAILED', 'Request validation failed.', __assign({ details: { issues: issues } }, options)) || this;
    }
    return ValidationError;
}(app_error_1.AppError));
exports.ValidationError = ValidationError;
/** Rate limiting dépassé (guard). */
var RateLimitedError = /** @class */ (function (_super) {
    __extends(RateLimitedError, _super);
    function RateLimitedError(retryAfterSeconds, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, 'RATE_LIMITED', "Too many requests. Retry after ".concat(retryAfterSeconds, "s."), __assign({ details: { retryAfterSeconds: retryAfterSeconds } }, options)) || this;
        _this.retryAfterSeconds = retryAfterSeconds;
        return _this;
    }
    return RateLimitedError;
}(app_error_1.AppError));
exports.RateLimitedError = RateLimitedError;
/** Version d'API retirée (docs/api-versioning.md). */
var ApiVersionRetiredError = /** @class */ (function (_super) {
    __extends(ApiVersionRetiredError, _super);
    function ApiVersionRetiredError(version, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, 'API_VERSION_RETIRED', "API version ".concat(version, " is retired."), __assign({ details: { version: version } }, options)) || this;
        _this.version = version;
        return _this;
    }
    return ApiVersionRetiredError;
}(app_error_1.AppError));
exports.ApiVersionRetiredError = ApiVersionRetiredError;
/** Dépendance critique indisponible (DB/Redis/fleet) → 503, jamais de semi-écritures. */
var ServerUnavailableError = /** @class */ (function (_super) {
    __extends(ServerUnavailableError, _super);
    function ServerUnavailableError(dependency, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, 'SERVER_UNAVAILABLE', "Dependency unavailable: ".concat(dependency, "."), __assign({ details: { dependency: dependency } }, options)) || this;
        _this.dependency = dependency;
        return _this;
    }
    return ServerUnavailableError;
}(app_error_1.AppError));
exports.ServerUnavailableError = ServerUnavailableError;
