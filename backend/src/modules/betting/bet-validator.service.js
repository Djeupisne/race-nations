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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetValidatorService = void 0;
/**
 * bet-validator.service.ts — garde centralisée d'une position de pari (INV-10..INV-21).
 * Orchestration pure SANS effet de bord monétaire : le wallet.repository est appelé
 * uniquement par betting.service après passage de TOUS les contrôles.
 * Contrôles : kill-switch → juridiction → bornes → limites glissantes → équité des
 * mises 1v1 (INV-10) → écart de PL ≤ 300 (game-modes §10.1) → auto-pari interdit →
 * marché dans un état acceptant (OPEN/CHALLENGED) → pas de double position.
 */
var common_1 = require("@nestjs/common");
var betting_errors_1 = require("../../common/errors/betting-errors");
var domain_errors_1 = require("../../common/errors/domain-errors");
var bet_market_state_machine_1 = require("../../common/state-machines/bet-market.state-machine");
var BetValidatorService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var BetValidatorService = _classThis = /** @class */ (function () {
        function BetValidatorService_1(prisma, config, jurisdictions, limits) {
            this.prisma = prisma;
            this.config = config;
            this.jurisdictions = jurisdictions;
            this.limits = limits;
        }
        /** Validation complète pour CRÉER un marché (défi). */
        BetValidatorService_1.prototype.validateMarketCreation = function (player, currency, stake) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.assertKillSwitch(currency);
                            return [4 /*yield*/, this.jurisdictions.assertAllowed(player.countryCode, currency)];
                        case 1:
                            _a.sent();
                            this.limits.assertStakeBounds(currency, stake);
                            return [4 /*yield*/, this.limits.assertWithinLimits({ playerId: player.id, countryCode: player.countryCode, currency: currency }, stake)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Validation complète pour REJOINDRE un marché existant (acceptation de défi / pari ouvert).
         * Retourne le contexte vérifié ; l'appelant (betting.service) exécute l'escrow atomique.
         */
        BetValidatorService_1.prototype.validateJoin = function (marketId, player) {
            return __awaiter(this, void 0, void 0, function () {
                var market, existing, currency, creator;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.betMarket.findUnique({ where: { id: marketId } })];
                        case 1:
                            market = _a.sent();
                            if (!market)
                                throw new domain_errors_1.NotFoundError('BetMarket', marketId);
                            // Auto-pari / double position : un joueur déjà engagé sur le marché ne peut pas se rejoindre.
                            if (market.creatorId === player.id) {
                                throw new domain_errors_1.ForbiddenAdminError({}, 'You cannot bet against yourself.');
                            }
                            return [4 /*yield*/, this.prisma.bet.findUnique({
                                    where: { marketId_playerId: { marketId: marketId, playerId: player.id } },
                                    select: { id: true },
                                })];
                        case 2:
                            existing = _a.sent();
                            if (existing)
                                throw new domain_errors_1.ValidationError({ field: 'marketId', reason: 'Already positioned on this market.' });
                            // État du marché : seul OPEN (public) ou CHALLENGED ciblant ce joueur accepte une entrée.
                            if (market.status !== 'OPEN' && market.status !== 'CHALLENGED') {
                                throw new domain_errors_1.ValidationError({ field: 'status', reason: "Market is ".concat(market.status, "; joining requires OPEN or CHALLENGED.") });
                            }
                            if (!(0, bet_market_state_machine_1.canBetMarketTransition)(market.status, 'LOCKED')) {
                                // Garde de cohérence graphe : LOCKED doit rester atteignable depuis l'état courant.
                                throw new domain_errors_1.ValidationError({ field: 'status', reason: 'Illegal market transition for join.' });
                            }
                            if (market.opponentId && market.opponentId !== player.id) {
                                throw new domain_errors_1.ForbiddenAdminError({}, 'This challenge is reserved for another player.');
                            }
                            currency = market.currency;
                            this.assertKillSwitch(currency);
                            return [4 /*yield*/, this.jurisdictions.assertAllowed(player.countryCode, currency)];
                        case 3:
                            _a.sent();
                            // INV-10 : mises strictement identiques — le rejoignant paie market.stake, pas un choix libre.
                            this.limits.assertStakeBounds(currency, market.stake);
                            return [4 /*yield*/, this.limits.assertWithinLimits({ playerId: player.id, countryCode: player.countryCode, currency: currency }, market.stake)];
                        case 4:
                            _a.sent();
                            if (!(market.opponentId === null || market.opponentId === player.id)) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.prisma.player.findUnique({
                                    where: { id: market.creatorId },
                                    select: { plPoints: true },
                                })];
                        case 5:
                            creator = _a.sent();
                            if (creator && Math.abs(creator.plPoints - player.plPoints) > this.config.constants.PL_DELTA_MAX) {
                                throw new domain_errors_1.ValidationError({
                                    field: 'plDelta',
                                    reason: "PL gap ".concat(Math.abs(creator.plPoints - player.plPoints), " exceeds max ").concat(this.config.constants.PL_DELTA_MAX, "."),
                                });
                            }
                            _a.label = 6;
                        case 6: return [2 /*return*/, { market: market, player: player }];
                    }
                });
            });
        };
        /** Contrôle d'équité explicite utilisé aussi au verrouillage (double escrow simultané). */
        BetValidatorService_1.prototype.assertEqualStakes = function (stakeA, stakeB) {
            if (stakeA !== stakeB)
                throw new betting_errors_1.BetStakeMismatchError(stakeA, stakeB);
        };
        BetValidatorService_1.prototype.assertKillSwitch = function (currency) {
            var flags = this.config.flags();
            if (currency === 'HARD' && !flags.hardEnabled) {
                throw new domain_errors_1.ValidationError({ field: 'currency', reason: 'Hard-currency betting is temporarily disabled.' });
            }
            if (currency === 'SOFT' && !flags.softEnabled) {
                throw new domain_errors_1.ValidationError({ field: 'currency', reason: 'Soft-currency betting is temporarily disabled.' });
            }
        };
        return BetValidatorService_1;
    }());
    __setFunctionName(_classThis, "BetValidatorService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BetValidatorService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BetValidatorService = _classThis;
}();
exports.BetValidatorService = BetValidatorService;
