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
exports.ReputationTooLowError = exports.AgeVerificationRequiredError = exports.JurisdictionBlockedError = exports.BetAlreadySettledError = exports.BetDailyLimitExceededError = exports.BetStakeOutOfRangeError = exports.BetStakeMismatchError = void 0;
/**
 * Erreurs spécifiques au domaine paris (docs/betting.md, INV-10..INV-21).
 * Codes et HTTP status figés par docs/api.md §1.2.
 */
var app_error_1 = require("./app-error");
/** INV-10 — défi 1v1 accepté uniquement si stakeB === stakeA. */
var BetStakeMismatchError = /** @class */ (function (_super) {
    __extends(BetStakeMismatchError, _super);
    function BetStakeMismatchError(stakeA, stakeB, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, 'BET_STAKE_MISMATCH', "Challenge stakes must be equal: got ".concat(stakeA, " vs ").concat(stakeB, "."), __assign({ details: { stakeA: stakeA, stakeB: stakeB } }, options)) || this;
        _this.stakeA = stakeA;
        _this.stakeB = stakeB;
        return _this;
    }
    return BetStakeMismatchError;
}(app_error_1.AppError));
exports.BetStakeMismatchError = BetStakeMismatchError;
/** INV-11 — mise hors bornes (SOFT 10..10000 cr ; HARD 100..10000 ct ; tournoi 50..50000 cr). */
var BetStakeOutOfRangeError = /** @class */ (function (_super) {
    __extends(BetStakeOutOfRangeError, _super);
    function BetStakeOutOfRangeError(min, max, received, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, 'BET_STAKE_OUT_OF_RANGE', "Stake must be between ".concat(min, " and ").concat(max, "."), __assign({ details: { min: min, max: max, received: received } }, options)) || this;
        _this.min = min;
        _this.max = max;
        _this.received = received;
        return _this;
    }
    return BetStakeOutOfRangeError;
}(app_error_1.AppError));
exports.BetStakeOutOfRangeError = BetStakeOutOfRangeError;
/** INV-12 — somme des mises sur fenêtre glissante 24h dépassée. */
var BetDailyLimitExceededError = /** @class */ (function (_super) {
    __extends(BetDailyLimitExceededError, _super);
    function BetDailyLimitExceededError(limit, alreadyWagered, attempted, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, 'BET_DAILY_LIMIT_EXCEEDED', "Daily betting limit exceeded: limit ".concat(limit, ", already wagered ").concat(alreadyWagered, "."), __assign({ details: { limit: limit, alreadyWagered: alreadyWagered, attempted: attempted } }, options)) || this;
        _this.limit = limit;
        _this.alreadyWagered = alreadyWagered;
        _this.attempted = attempted;
        return _this;
    }
    return BetDailyLimitExceededError;
}(app_error_1.AppError));
exports.BetDailyLimitExceededError = BetDailyLimitExceededError;
/** INV-14 — UNIQUE(marketId) sur BetSettlement : second settlement refusé, sans effet de bord. */
var BetAlreadySettledError = /** @class */ (function (_super) {
    __extends(BetAlreadySettledError, _super);
    function BetAlreadySettledError(marketId, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, 'BET_ALREADY_SETTLED', "Market already settled: ".concat(marketId, "."), __assign({ details: { marketId: marketId } }, options)) || this;
        _this.marketId = marketId;
        return _this;
    }
    return BetAlreadySettledError;
}(app_error_1.AppError));
exports.BetAlreadySettledError = BetAlreadySettledError;
/** INV-20 — pari HARD sans licence active dans la juridiction du joueur (ou pays bloqué en SOFT). */
var JurisdictionBlockedError = /** @class */ (function (_super) {
    __extends(JurisdictionBlockedError, _super);
    function JurisdictionBlockedError(countryCode, currency, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, 'JURISDICTION_BLOCKED', "Betting (".concat(currency, ") is not available in jurisdiction ").concat(countryCode, "."), __assign({ details: { countryCode: countryCode, currency: currency } }, options)) || this;
        _this.countryCode = countryCode;
        _this.currency = currency;
        return _this;
    }
    return JurisdictionBlockedError;
}(app_error_1.AppError));
exports.JurisdictionBlockedError = JurisdictionBlockedError;
/** INV-21 — KYC âge ≥ 18 non vérifié pour un pari HARD. */
var AgeVerificationRequiredError = /** @class */ (function (_super) {
    __extends(AgeVerificationRequiredError, _super);
    function AgeVerificationRequiredError(options) {
        if (options === void 0) { options = {}; }
        return _super.call(this, 'AGE_VERIFICATION_REQUIRED', 'Age verification (18+) is required for real-money betting.', options) || this;
    }
    return AgeVerificationRequiredError;
}(app_error_1.AppError));
exports.AgeVerificationRequiredError = AgeVerificationRequiredError;
/** INV-21 — réputation < 30 : pas de paris HARD ni tournois payants. */
var ReputationTooLowError = /** @class */ (function (_super) {
    __extends(ReputationTooLowError, _super);
    function ReputationTooLowError(reputation, required, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, 'REPUTATION_TOO_LOW', "Reputation ".concat(reputation, " is below the required ").concat(required, "."), __assign({ details: { reputation: reputation, required: required } }, options)) || this;
        _this.reputation = reputation;
        _this.required = required;
        return _this;
    }
    return ReputationTooLowError;
}(app_error_1.AppError));
exports.ReputationTooLowError = ReputationTooLowError;
