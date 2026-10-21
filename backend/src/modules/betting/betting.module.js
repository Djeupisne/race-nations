"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BettingModule = void 0;
/**
 * betting.module.ts — module pari mutuel 1v1 (docs/betting.md).
 * WalletModule fournit le repository ledger (INV-03) ; BettingService et
 * BetSettlementService sont exportés pour MatchesModule (outbox settlement).
 */
var common_1 = require("@nestjs/common");
var prisma_module_1 = require("../../prisma/prisma.module");
var wallet_module_1 = require("../wallet/wallet.module");
var jurisdiction_service_1 = require("./jurisdiction.service");
var bet_limits_service_1 = require("./bet-limits.service");
var bet_validator_service_1 = require("./bet-validator.service");
var bet_odds_service_1 = require("./bet-odds.service");
var betting_service_1 = require("./betting.service");
var bet_settlement_service_1 = require("./bet-settlement.service");
var betting_controller_1 = require("./betting.controller");
var BettingModule = function () {
    var _classDecorators = [(0, common_1.Module)({
            imports: [prisma_module_1.PrismaModule, wallet_module_1.WalletModule],
            providers: [jurisdiction_service_1.JurisdictionService, bet_limits_service_1.BetLimitsService, bet_validator_service_1.BetValidatorService, bet_odds_service_1.BetOddsService, betting_service_1.BettingService, bet_settlement_service_1.BetSettlementService],
            controllers: [betting_controller_1.BettingController],
            exports: [betting_service_1.BettingService, bet_settlement_service_1.BetSettlementService, jurisdiction_service_1.JurisdictionService],
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var BettingModule = _classThis = /** @class */ (function () {
        function BettingModule_1() {
        }
        return BettingModule_1;
    }());
    __setFunctionName(_classThis, "BettingModule");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BettingModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BettingModule = _classThis;
}();
exports.BettingModule = BettingModule;
