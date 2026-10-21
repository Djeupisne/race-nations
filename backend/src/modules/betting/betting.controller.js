"use strict";
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
exports.BettingController = void 0;
/**
 * betting.controller.ts — API publique des paris (docs/api.md §5, shared/api-contracts/src/betting.ts).
 * Zod partout (DTOs = schémas contrats), guards : JWT global (deny-by-default INV-28),
 * ownership sur les actions sensibles, rate-limit fail-closed sur l'écriture d'argent.
 * Le countryCode de juridiction est TOUJOURS lu du profil serveur (jamais du client).
 */
var common_1 = require("@nestjs/common");
var api_contracts_1 = require("@race-nations/api-contracts");
var zod_validation_pipe_1 = require("../../common/pipes/zod-validation.pipe");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var ownership_guard_1 = require("../../common/guards/ownership.guard");
var rate_limit_guard_1 = require("../../common/guards/rate-limit.guard");
var createMarketPipe = new zod_validation_pipe_1.ZodValidationPipe(api_contracts_1.CreateMarketInputSchema);
var acceptPipe = new zod_validation_pipe_1.ZodValidationPipe(api_contracts_1.AcceptChallengeInputSchema);
var disputePipe = new zod_validation_pipe_1.ZodValidationPipe(api_contracts_1.OpenDisputeInputSchema);
var BettingController = function () {
    var _classDecorators = [(0, common_1.Controller)('v1/betting')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _createMarket_decorators;
    var _joinMarket_decorators;
    var _listMarkets_decorators;
    var _getMarket_decorators;
    var _odds_decorators;
    var _myBets_decorators;
    var _limitsUsage_decorators;
    var _cancel_decorators;
    var _dispute_decorators;
    var _manualSettle_decorators;
    var _resolveDispute_decorators;
    var BettingController = _classThis = /** @class */ (function () {
        function BettingController_1(betting, settlement, limits, prisma) {
            this.betting = (__runInitializers(this, _instanceExtraInitializers), betting);
            this.settlement = settlement;
            this.limits = limits;
            this.prisma = prisma;
        }
        /** POST /v1/betting/markets — créer un défi 1v1 (escrow créateur à terme via join flow). */
        BettingController_1.prototype.createMarket = function (user, body) {
            return __awaiter(this, void 0, void 0, function () {
                var player;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.mustPlayer(user)];
                        case 1:
                            player = _a.sent();
                            return [2 /*return*/, this.betting.createMarket(__assign({ creator: player }, body))];
                    }
                });
            });
        };
        /** POST /v1/betting/markets/:id/join — accepter un défi : escrow atomique + verrouillage. */
        BettingController_1.prototype.joinMarket = function (id, user, _body) {
            var _this = this;
            return this.mustPlayer(user).then(function (player) { return _this.betting.joinMarket(id, player); });
        };
        /** GET /v1/betting/markets — liste filtrable (statut, devise, piste). */
        BettingController_1.prototype.listMarkets = function (query) {
            return this.betting.listMarkets(query);
        };
        /** GET /v1/betting/markets/:id — détail marché + positions. */
        BettingController_1.prototype.getMarket = function (id) {
            return this.betting.getMarket(id);
        };
        /** GET /v1/betting/markets/:id/odds — cotes implicites live (mutuel, INV-08). */
        BettingController_1.prototype.odds = function (id) {
            return this.betting.oddsOf(id);
        };
        /** GET /v1/betting/me — mes positions. */
        BettingController_1.prototype.myBets = function (user, status) {
            var _this = this;
            return this.mustPlayer(user).then(function (p) { return _this.betting.myBets(p.id, status); });
        };
        /** GET /v1/betting/limits — consommation fenêtre glissante (jeu responsable, INV-12). */
        BettingController_1.prototype.limitsUsage = function (user) {
            return __awaiter(this, void 0, void 0, function () {
                var p;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.mustPlayer(user)];
                        case 1:
                            p = _b.sent();
                            _a = {};
                            return [4 /*yield*/, this.limits.usage(p.id, 'SOFT')];
                        case 2:
                            _a.soft = _b.sent();
                            return [4 /*yield*/, this.limits.usage(p.id, 'HARD')];
                        case 3: return [2 /*return*/, (_a.hard = _b.sent(),
                                _a.reputation = p.reputation,
                                _a.minReputationHard = 30,
                                _a)];
                    }
                });
            });
        };
        /** POST /v1/betting/markets/:id/cancel — créateur seul, avant engagement adverse. */
        BettingController_1.prototype.cancel = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                var player;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.mustPlayer(user)];
                        case 1:
                            player = _a.sent();
                            return [2 /*return*/, this.betting.cancelMarket(id, player)];
                    }
                });
            });
        };
        /** POST /v1/betting/markets/:id/dispute — ouverture litige par un participant impliqué. */
        BettingController_1.prototype.dispute = function (id, user, body) {
            return __awaiter(this, void 0, void 0, function () {
                var player, involved, _a, ForbiddenAdminError;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.mustPlayer(user)];
                        case 1:
                            player = _c.sent();
                            return [4 /*yield*/, this.prisma.bet.findUnique({ where: { marketId_playerId: { marketId: id, playerId: player.id } } })];
                        case 2:
                            involved = _c.sent();
                            _a = !involved;
                            if (!_a) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.prisma.betMarket.findUnique({ where: { id: id }, select: { creatorId: true } })];
                        case 3:
                            _a = ((_b = (_c.sent())) === null || _b === void 0 ? void 0 : _b.creatorId) !== player.id;
                            _c.label = 4;
                        case 4:
                            if (!_a) return [3 /*break*/, 6];
                            return [4 /*yield*/, Promise.resolve().then(function () { return require('../../common/errors/domain-errors'); })];
                        case 5:
                            ForbiddenAdminError = (_c.sent()).ForbiddenAdminError;
                            throw new ForbiddenAdminError({}, 'Only participants can open a dispute.');
                        case 6: return [4 /*yield*/, this.settlement.openDispute(id, body.reason)];
                        case 7:
                            _c.sent();
                            return [2 /*return*/, { ok: true }];
                    }
                });
            });
        };
        /** POST /v1/betting/markets/:id/settle — settlement MANUEL admin (runbook §6 ; sinon outbox). */
        BettingController_1.prototype.manualSettle = function (id, user, body) {
            return this.settlement.settleMarket({ marketId: id, winningSide: body.winningSide, push: body.push, settledById: user.userId });
        };
        /** POST /v1/betting/markets/:id/dispute/resolve — résolution admin litige (INV-19 ≤72 h). */
        BettingController_1.prototype.resolveDispute = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.settlement.resolveDispute(id, body.outcome)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, { ok: true }];
                    }
                });
            });
        };
        BettingController_1.prototype.mustPlayer = function (user) {
            return __awaiter(this, void 0, void 0, function () {
                var player, NotFoundError;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.player.findUnique({ where: { id: user.playerId } })];
                        case 1:
                            player = _a.sent();
                            if (!!player) return [3 /*break*/, 3];
                            return [4 /*yield*/, Promise.resolve().then(function () { return require('../../common/errors/domain-errors'); })];
                        case 2:
                            NotFoundError = (_a.sent()).NotFoundError;
                            throw new NotFoundError('Player', user.playerId);
                        case 3: return [2 /*return*/, player];
                    }
                });
            });
        };
        return BettingController_1;
    }());
    __setFunctionName(_classThis, "BettingController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createMarket_decorators = [(0, common_1.Post)('markets'), (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard), (0, rate_limit_guard_1.rateLimit)({ keyPrefix: 'bet:create', limit: 10, windowSeconds: 60 })];
        _joinMarket_decorators = [(0, common_1.Post)('markets/:id/join'), (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard), (0, rate_limit_guard_1.rateLimit)({ keyPrefix: 'bet:join', limit: 20, windowSeconds: 60 })];
        _listMarkets_decorators = [(0, common_1.Get)('markets')];
        _getMarket_decorators = [(0, common_1.Get)('markets/:id')];
        _odds_decorators = [(0, common_1.Get)('markets/:id/odds')];
        _myBets_decorators = [(0, common_1.Get)('me')];
        _limitsUsage_decorators = [(0, common_1.Get)('limits')];
        _cancel_decorators = [(0, common_1.Post)('markets/:id/cancel'), (0, common_1.UseGuards)(ownership_guard_1.OwnershipGuard)];
        _dispute_decorators = [(0, common_1.Post)('markets/:id/dispute')];
        _manualSettle_decorators = [(0, common_1.Post)('markets/:id/settle'), (0, roles_decorator_1.Roles)('ADMIN')];
        _resolveDispute_decorators = [(0, common_1.Post)('markets/:id/dispute/resolve'), (0, roles_decorator_1.Roles)('MODERATOR', 'ADMIN')];
        __esDecorate(_classThis, null, _createMarket_decorators, { kind: "method", name: "createMarket", static: false, private: false, access: { has: function (obj) { return "createMarket" in obj; }, get: function (obj) { return obj.createMarket; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _joinMarket_decorators, { kind: "method", name: "joinMarket", static: false, private: false, access: { has: function (obj) { return "joinMarket" in obj; }, get: function (obj) { return obj.joinMarket; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _listMarkets_decorators, { kind: "method", name: "listMarkets", static: false, private: false, access: { has: function (obj) { return "listMarkets" in obj; }, get: function (obj) { return obj.listMarkets; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMarket_decorators, { kind: "method", name: "getMarket", static: false, private: false, access: { has: function (obj) { return "getMarket" in obj; }, get: function (obj) { return obj.getMarket; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _odds_decorators, { kind: "method", name: "odds", static: false, private: false, access: { has: function (obj) { return "odds" in obj; }, get: function (obj) { return obj.odds; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _myBets_decorators, { kind: "method", name: "myBets", static: false, private: false, access: { has: function (obj) { return "myBets" in obj; }, get: function (obj) { return obj.myBets; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _limitsUsage_decorators, { kind: "method", name: "limitsUsage", static: false, private: false, access: { has: function (obj) { return "limitsUsage" in obj; }, get: function (obj) { return obj.limitsUsage; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _cancel_decorators, { kind: "method", name: "cancel", static: false, private: false, access: { has: function (obj) { return "cancel" in obj; }, get: function (obj) { return obj.cancel; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _dispute_decorators, { kind: "method", name: "dispute", static: false, private: false, access: { has: function (obj) { return "dispute" in obj; }, get: function (obj) { return obj.dispute; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _manualSettle_decorators, { kind: "method", name: "manualSettle", static: false, private: false, access: { has: function (obj) { return "manualSettle" in obj; }, get: function (obj) { return obj.manualSettle; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _resolveDispute_decorators, { kind: "method", name: "resolveDispute", static: false, private: false, access: { has: function (obj) { return "resolveDispute" in obj; }, get: function (obj) { return obj.resolveDispute; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BettingController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BettingController = _classThis;
}();
exports.BettingController = BettingController;
