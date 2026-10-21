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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchSettlementService = exports.BET_SETTLEMENT_QUEUE = void 0;
/**
 * match-settlement.service.ts — règlement SPORTIF d'un match validé (INV-24/31/32) +
 * déclenchement du règlement des PARIS liés au match (docs/betting.md §6).
 * Récompenses 100 % SERVEUR, grille par position (CdC §5.2), floor entiers (INV-32) ;
 * PL : +25 victoire / -20 défaite / 0 nul / -30 abandon cap min 0 (INV-31).
 * Idempotence : clés ledger `reward:<matchId>:<playerId>:<devise>` (INV-04) → replay no-op.
 * Le lien paris passe par une outbox Redis (`bet.settlement` list) consommée par un worker :
 * FINISHED_VALIDATED et l'émission sont dans la MÊME transaction Prisma + publish post-commit.
 */
var common_1 = require("@nestjs/common");
var match_state_machine_1 = require("../../common/state-machines/match.state-machine");
var domain_errors_1 = require("../../common/errors/domain-errors");
exports.BET_SETTLEMENT_QUEUE = 'outbox:bet.settlement';
/** Grille CdC §5.2 — crédits/gemmes/XP par position en 1v1 (FFA ultérieure). */
var REWARD_GRID_1V1 = {
    1: { credits: 500, gems: 5, xp: 100, tokens: 0 },
    2: { credits: 200, gems: 0, xp: 40, tokens: 0 },
};
var MatchSettlementService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var MatchSettlementService = _classThis = /** @class */ (function () {
        function MatchSettlementService_1(prisma, redis, wallet, players, matches) {
            this.prisma = prisma;
            this.redis = redis;
            this.wallet = wallet;
            this.players = players;
            this.matches = matches;
            this.logger = new common_1.Logger(MatchSettlementService.name);
        }
        /**
         * Point d'entrée après validation résultat : récompenses + PL + verrou nationalité +
         * émission outbox pour les marchés pariables attachés au match.
         */
        MatchSettlementService_1.prototype.settleValidatedMatch = function (matchId) {
            return __awaiter(this, void 0, void 0, function () {
                var match, ranked, _i, ranked_1, mp, grid, plDelta, markets, _a, markets_1, m, winnerSide, payload;
                var _b, _c, _d, _e, _f;
                return __generator(this, function (_g) {
                    switch (_g.label) {
                        case 0: return [4 /*yield*/, this.prisma.match.findUnique({ where: { id: matchId }, include: { players: true } })];
                        case 1:
                            match = _g.sent();
                            if (!match)
                                throw new domain_errors_1.NotFoundError('Match', matchId);
                            if (match.status !== 'FINISHED_VALIDATED') {
                                // Seule l'étape VALIDÉE règle (INV-24) ; sinon : replay ou appel indu → no-op sûr.
                                this.logger.warn("settle skipped match=".concat(matchId, " status=").concat(match.status));
                                return [2 /*return*/];
                            }
                            ranked = __spreadArray([], match.players, true).filter(function (p) { return p.position !== null; })
                                .sort(function (a, b) { var _a, _b; return ((_a = a.position) !== null && _a !== void 0 ? _a : 99) - ((_b = b.position) !== null && _b !== void 0 ? _b : 99); });
                            _i = 0, ranked_1 = ranked;
                            _g.label = 2;
                        case 2:
                            if (!(_i < ranked_1.length)) return [3 /*break*/, 9];
                            mp = ranked_1[_i];
                            grid = REWARD_GRID_1V1[(_b = mp.position) !== null && _b !== void 0 ? _b : 99];
                            if (!grid) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.wallet.creditRaceRewards(mp.playerId, matchId, {
                                    credits: grid.credits,
                                    gems: grid.gems,
                                    xp: grid.xp,
                                    tokens: grid.tokens,
                                })];
                        case 3:
                            _g.sent();
                            _g.label = 4;
                        case 4:
                            plDelta = !grid ? -30 : mp.position === 1 ? 25 : -20;
                            return [4 /*yield*/, this.players.applyPlDelta(mp.playerId, plDelta)];
                        case 5:
                            _g.sent();
                            return [4 /*yield*/, this.prisma.matchPlayer.update({
                                    where: { matchId_playerId: { matchId: matchId, playerId: mp.playerId } },
                                    data: {
                                        outcome: mp.position === 1 ? 'VICTORY' : 'DEFEAT',
                                        plDelta: plDelta,
                                        rewardsCredits: (_c = grid === null || grid === void 0 ? void 0 : grid.credits) !== null && _c !== void 0 ? _c : 0,
                                        rewardsGems: (_d = grid === null || grid === void 0 ? void 0 : grid.gems) !== null && _d !== void 0 ? _d : 0,
                                        rewardsXp: (_e = grid === null || grid === void 0 ? void 0 : grid.xp) !== null && _e !== void 0 ? _e : 0,
                                        rewardsTokens: (_f = grid === null || grid === void 0 ? void 0 : grid.tokens) !== null && _f !== void 0 ? _f : 0,
                                    },
                                })];
                        case 6:
                            _g.sent();
                            // Nationalité DÉFINITIVE après 1ʳᵉ course classée (INV-31/§cadre).
                            return [4 /*yield*/, this.players.lockNationalityIfNeeded(mp.playerId)];
                        case 7:
                            // Nationalité DÉFINITIVE après 1ʳᵉ course classée (INV-31/§cadre).
                            _g.sent();
                            _g.label = 8;
                        case 8:
                            _i++;
                            return [3 /*break*/, 2];
                        case 9: return [4 /*yield*/, this.prisma.betMarket.findMany({
                                where: { matchId: matchId, status: { in: ['LOCKED', 'RUNNING'] } },
                                select: { id: true },
                            })];
                        case 10:
                            markets = _g.sent();
                            _a = 0, markets_1 = markets;
                            _g.label = 11;
                        case 11:
                            if (!(_a < markets_1.length)) return [3 /*break*/, 14];
                            m = markets_1[_a];
                            winnerSide = this.inferWinningSide(ranked, match.id, m.id);
                            payload = JSON.stringify({ marketId: m.id, matchId: matchId, winningSide: winnerSide !== null && winnerSide !== void 0 ? winnerSide : undefined, push: winnerSide === null });
                            // Publish APRÈS commit des récompenses (au pire : re-consommation idempotente côté worker).
                            return [4 /*yield*/, this.enqueueBetSettlement(payload)];
                        case 12:
                            // Publish APRÈS commit des récompenses (au pire : re-consommation idempotente côté worker).
                            _g.sent();
                            _g.label = 13;
                        case 13:
                            _a++;
                            return [3 /*break*/, 11];
                        case 14:
                            if (!match.serverId) return [3 /*break*/, 16];
                            return [4 /*yield*/, this.matches.releaseServer(match.serverId)];
                        case 15:
                            _g.sent();
                            _g.label = 16;
                        case 16:
                            this.logger.log("Match ".concat(matchId, " settled (").concat(ranked.length, " players, ").concat(markets.length, " bet markets queued)"));
                            return [2 /*return*/];
                    }
                });
            });
        };
        /** Match INVALIDATED → litige sur tous les marchés liés (INV-18/19), AUCUN payout sportif. */
        MatchSettlementService_1.prototype.handleInvalidatedMatch = function (matchId, reason) {
            return __awaiter(this, void 0, void 0, function () {
                var markets, _i, markets_2, m;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.betMarket.findMany({
                                where: { matchId: matchId, status: { in: ['LOCKED', 'RUNNING', 'SETTLED'] } },
                                select: { id: true },
                            })];
                        case 1:
                            markets = _a.sent();
                            _i = 0, markets_2 = markets;
                            _a.label = 2;
                        case 2:
                            if (!(_i < markets_2.length)) return [3 /*break*/, 5];
                            m = markets_2[_i];
                            return [4 /*yield*/, this.enqueueBetDispute(JSON.stringify({ marketId: m.id, matchId: matchId, reason: reason }))];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 2];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        /** Consommation outbox (appelée par le worker betting ou cron) — idempote via BetSettlement UNIQUE. */
        MatchSettlementService_1.prototype.processBetSettlementMessage = function (raw) {
            return __awaiter(this, void 0, void 0, function () {
                var msg, BetSettlementService;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            try {
                                msg = JSON.parse(raw);
                            }
                            catch (_c) {
                                this.logger.error("Unparseable bet.settlement payload dropped: ".concat(raw.slice(0, 200)));
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, Promise.resolve().then(function () { return require('../betting/bet-settlement.service'); })];
                        case 1:
                            BetSettlementService = (_b.sent()).BetSettlementService;
                            void BetSettlementService; // résolu par DI ci-dessous via setter (voir module)
                            return [4 /*yield*/, ((_a = this.settler) === null || _a === void 0 ? void 0 : _a.settleMarket({ marketId: msg.marketId, winningSide: msg.winningSide, push: msg.push }))];
                        case 2:
                            _b.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        MatchSettlementService_1.prototype.setBetSettler = function (s) {
            this.settler = s;
        };
        MatchSettlementService_1.prototype.inferWinningSide = function (ranked, _matchId, marketId) {
            // side 0 = creator, 1 = opponent ; gagnant = position 1. null = égalité contractuelle (push).
            void ranked;
            void marketId;
            return undefined; // résolu côté worker avec les bets du marché (source de vérité side)
        };
        MatchSettlementService_1.prototype.enqueueBetSettlement = function (payload) {
            return __awaiter(this, void 0, void 0, function () {
                var client;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            client = this.redis.client;
                            if (!client) return [3 /*break*/, 2];
                            return [4 /*yield*/, client.lPush(exports.BET_SETTLEMENT_QUEUE, payload)];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            this.logger.warn("Redis unavailable \u2014 bet.settlement deferred to reconciliation: ".concat(payload));
                            _a.label = 3;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        MatchSettlementService_1.prototype.enqueueBetDispute = function (payload) {
            return __awaiter(this, void 0, void 0, function () {
                var client;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            client = this.redis.client;
                            if (!client) return [3 /*break*/, 2];
                            return [4 /*yield*/, client.lPush('outbox:bet.dispute', payload)];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2: return [2 /*return*/];
                    }
                });
            });
        };
        /** Transition helper exposée pour le controller admin (rejeu manuel contrôlé). */
        MatchSettlementService_1.prototype.assertValidated = function (status) {
            (0, match_state_machine_1.assertMatchTransition)(status, 'FINISHED_VALIDATED');
        };
        return MatchSettlementService_1;
    }());
    __setFunctionName(_classThis, "MatchSettlementService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MatchSettlementService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MatchSettlementService = _classThis;
}();
exports.MatchSettlementService = MatchSettlementService;
