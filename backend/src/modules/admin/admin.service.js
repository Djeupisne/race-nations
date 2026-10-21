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
exports.AdminService = void 0;
/**
 * admin.service.ts — façade des opérations sensibles du back-office (docs/api.md §9).
 * RÈGLE ABSOLUE (INV-28) : chaque mutation passe par ici, qui écrit l'AdminAuditLog
 * AVANT l'effet métier, avec requestId de corrélation. Un échec d'audit ⇒ pas d'effet.
 * Le settlement manuel de marché (litige > 72 h ou incident) délègue à BetSettlementService
 * en conservant la garantie INV-14 (UNIQUE marketId → jamais un double règlement).
 */
var common_1 = require("@nestjs/common");
var node_crypto_1 = require("node:crypto");
var domain_errors_1 = require("../../common/errors/domain-errors");
var AdminService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AdminService = _classThis = /** @class */ (function () {
        function AdminService_1(audit, settlements, gameservers, sanctions, prisma) {
            this.audit = audit;
            this.settlements = settlements;
            this.gameservers = gameservers;
            this.sanctions = sanctions;
            this.prisma = prisma;
        }
        AdminService_1.prototype.rid = function (actor) {
            var _a;
            return (_a = actor.requestId) !== null && _a !== void 0 ? _a : (0, node_crypto_1.randomUUID)();
        };
        /** Settlement MANUAL d'un marché (litige tranché, incident serveur). ADMIN only. */
        AdminService_1.prototype.manualSettleMarket = function (actor, params) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!params.reason || params.reason.trim().length < 10) {
                                throw new domain_errors_1.ValidationError({ field: 'reason', reason: 'Manual settlement requires a documented reason.' });
                            }
                            return [4 /*yield*/, this.audit.record({
                                    actorUserId: actor.userId,
                                    action: 'BET_MANUAL_SETTLE',
                                    targetType: 'BetMarket',
                                    targetId: params.marketId,
                                    metadata: { winningSide: (_a = params.winningSide) !== null && _a !== void 0 ? _a : null, push: (_b = params.push) !== null && _b !== void 0 ? _b : false, reason: params.reason },
                                    requestId: this.rid(actor),
                                })];
                        case 1:
                            _c.sent();
                            return [2 /*return*/, this.settlements.settleMarket({
                                    marketId: params.marketId,
                                    winningSide: params.winningSide,
                                    push: params.push,
                                    settledById: actor.userId,
                                })];
                    }
                });
            });
        };
        /** Issue de sanction déléquée + auditée (le MODERATOR peut WARN/MUTE/RESTRICTION). */
        AdminService_1.prototype.issueSanction = function (actor, params) {
            return __awaiter(this, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.sanctions.issue(__assign(__assign({}, params), { issuedById: actor.userId }))];
                        case 1:
                            result = _a.sent();
                            return [4 /*yield*/, this.audit.record({
                                    actorUserId: actor.userId,
                                    action: 'SANCTION_ISSUE',
                                    targetType: 'Sanction',
                                    targetId: result.sanctionId,
                                    metadata: { playerId: params.playerId, type: params.type, reason: params.reason },
                                    requestId: this.rid(actor),
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, result];
                    }
                });
            });
        };
        /** Drain d'un game server (maintenance) — fin des matchs en cours puis OFFLINE. */
        AdminService_1.prototype.drainServer = function (actor, serverId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.audit.record({
                                actorUserId: actor.userId,
                                action: 'SERVER_DRAIN',
                                targetType: 'GameServer',
                                targetId: serverId,
                                requestId: this.rid(actor),
                            })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.gameservers.drain(serverId)];
                    }
                });
            });
        };
        /** Ouverture d'un litige marché depuis le back-office (INV-19 gel ≤ 72 h). */
        AdminService_1.prototype.openDispute = function (actor, marketId, reason) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.audit.record({
                                actorUserId: actor.userId,
                                action: 'BET_DISPUTE_OPEN',
                                targetType: 'BetMarket',
                                targetId: marketId,
                                metadata: { reason: reason },
                                requestId: this.rid(actor),
                            })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.settlements.openDispute(marketId, reason)];
                    }
                });
            });
        };
        /** Clôture d'un litige : remboursement intégral (REFUND_ALL) ou règlement maintenu (UPHELD). */
        AdminService_1.prototype.resolveDispute = function (actor, marketId, outcome, note) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.audit.record({
                                actorUserId: actor.userId,
                                action: 'BET_DISPUTE_RESOLVE',
                                targetType: 'BetMarket',
                                targetId: marketId,
                                metadata: { outcome: outcome, note: note },
                                requestId: this.rid(actor),
                            })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.settlements.resolveDispute(marketId, outcome)];
                    }
                });
            });
        };
        /** Vue globale supervision : flotte + files + marchés litigieux (lecture simple). */
        AdminService_1.prototype.dashboard = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, fleet, disputed, settling;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.gameservers.fleet(),
                                this.prisma.betMarket.count({ where: { status: 'DISPUTED' } }),
                                this.prisma.betMarket.count({ where: { status: 'SETTLING' } }),
                            ])];
                        case 1:
                            _a = _b.sent(), fleet = _a[0], disputed = _a[1], settling = _a[2];
                            return [2 /*return*/, { fleet: fleet, disputedMarkets: disputed, settlingMarkets: settling }];
                    }
                });
            });
        };
        return AdminService_1;
    }());
    __setFunctionName(_classThis, "AdminService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AdminService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AdminService = _classThis;
}();
exports.AdminService = AdminService;
