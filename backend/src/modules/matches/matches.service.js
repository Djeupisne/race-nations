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
exports.MatchesService = void 0;
/**
 * matches.service.ts — cycle de vie Match (docs/api.md §4, machine d'état INV-22/25).
 * Les transitions WAITING→LOADING→IN_PROGRESS→FINISHED sont pilotées par le game server
 * (routes ServerAuthGuard) ; FINISHED→FINISHED_VALIDATED arrive via result-validator
 * (INV-25/26) puis déclenche le settlement (match-settlement.service). INVALIDATED est
 * terminal et route vers les litiges paris (jamais un règlement arbitraire des fonds).
 */
var common_1 = require("@nestjs/common");
var match_state_machine_1 = require("../../common/state-machines/match.state-machine");
var domain_errors_1 = require("../../common/errors/domain-errors");
var MatchesService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var MatchesService = _classThis = /** @class */ (function () {
        function MatchesService_1(prisma, clock) {
            this.prisma = prisma;
            this.clock = clock;
            this.logger = new common_1.Logger(MatchesService.name);
        }
        /** Lecture publique profil réduit (pas de secrets serveur). */
        MatchesService_1.prototype.getMatch = function (matchId) {
            return __awaiter(this, void 0, void 0, function () {
                var match;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.match.findUnique({
                                where: { id: matchId },
                                include: { players: { include: { player: { select: { id: true, username: true, nationality: true, plPoints: true } } } } },
                            })];
                        case 1:
                            match = _a.sent();
                            if (!match)
                                throw new domain_errors_1.NotFoundError('Match', matchId);
                            return [2 /*return*/, match];
                    }
                });
            });
        };
        /** Historique d'un joueur (pagination curseur simple sur createdAt/id). */
        MatchesService_1.prototype.historyForPlayer = function (playerId, query) {
            return __awaiter(this, void 0, void 0, function () {
                var where, rows, hasMore;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            where = {};
                            if (query.cursor)
                                where.createdAt = { lt: new Date(query.cursor) };
                            return [4 /*yield*/, this.prisma.match.findMany({
                                    where: __assign(__assign({}, where), { players: { some: { playerId: playerId } } }),
                                    orderBy: [{ createdAt: 'desc' }],
                                    take: query.limit + 1,
                                    include: { players: true },
                                })];
                        case 1:
                            rows = _a.sent();
                            hasMore = rows.length > query.limit;
                            return [2 /*return*/, { items: rows.slice(0, query.limit), nextCursor: hasMore ? rows[query.limit - 1].createdAt.toISOString() : null }];
                    }
                });
            });
        };
        /** JOIN : un joueur rejoint un match WAITING_FOR_PLAYERS assigné (ticket MATCHED). */
        MatchesService_1.prototype.join = function (matchId, playerId) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var match, allJoined;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, tx.match.findUnique({ where: { id: matchId }, include: { players: true } })];
                                    case 1:
                                        match = _a.sent();
                                        if (!match)
                                            throw new domain_errors_1.NotFoundError('Match', matchId);
                                        if (match.status !== 'WAITING_FOR_PLAYERS') {
                                            throw new domain_errors_1.ValidationError({ field: 'status', reason: "Match is ".concat(match.status, "; joining requires WAITING_FOR_PLAYERS.") });
                                        }
                                        if (!match.players.some(function (p) { return p.playerId === playerId; })) {
                                            throw new domain_errors_1.ValidationError({ field: 'playerId', reason: 'Not invited to this match.' });
                                        }
                                        allJoined = match.players.length >= 2;
                                        if (allJoined && match.status === 'WAITING_FOR_PLAYERS') {
                                            (0, match_state_machine_1.assertMatchTransition)(match.status, 'LOADING');
                                            return [2 /*return*/, tx.match.update({ where: { id: matchId }, data: { status: 'LOADING' } })];
                                        }
                                        return [2 /*return*/, match];
                                }
                            });
                        }); })];
                });
            });
        };
        /** Callback serveur : statut de la course (LOADING→IN_PROGRESS, IN_PROGRESS→FINISHED). */
        MatchesService_1.prototype.updateStatusFromServer = function (matchId, to) {
            return __awaiter(this, void 0, void 0, function () {
                var match, data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.match.findUnique({ where: { id: matchId } })];
                        case 1:
                            match = _a.sent();
                            if (!match)
                                throw new domain_errors_1.NotFoundError('Match', matchId);
                            if (match.status === to)
                                return [2 /*return*/, match]; // heartbeat dupliqué → no-op idempotent
                            (0, match_state_machine_1.assertMatchTransition)(match.status, to);
                            data = { status: to };
                            if (to === 'IN_PROGRESS')
                                data.startedAt = new Date(this.clock.nowMs());
                            if (to === 'FINISHED')
                                data.finishedAt = new Date(this.clock.nowMs());
                            this.logger.log("Match ".concat(matchId, ": ").concat(match.status, " -> ").concat(to));
                            return [2 /*return*/, this.prisma.match.update({ where: { id: matchId }, data: data })];
                    }
                });
            });
        };
        /**
         * Résultat VALIDÉ par result-validator → FINISHED_VALIDATED (terminal, gate INV-24).
         * Écrit aussi positions/outcomes bruts dans MatchPlayer pour audit (les récompenses
         * chiffrées sont calculées par match-settlement, source unique INV-32).
         */
        MatchesService_1.prototype.markValidated = function (matchId, rows) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var match, _i, rows_1, r;
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, tx.match.findUniqueOrThrow({ where: { id: matchId } })];
                                    case 1:
                                        match = _b.sent();
                                        if (match.status === 'FINISHED_VALIDATED')
                                            return [2 /*return*/, match]; // replay webhook/résultat dupliqué
                                        (0, match_state_machine_1.assertMatchTransition)(match.status, 'FINISHED_VALIDATED');
                                        _i = 0, rows_1 = rows;
                                        _b.label = 2;
                                    case 2:
                                        if (!(_i < rows_1.length)) return [3 /*break*/, 5];
                                        r = rows_1[_i];
                                        return [4 /*yield*/, tx.matchPlayer.update({
                                                where: { matchId_playerId: { matchId: matchId, playerId: r.playerId } },
                                                data: { position: r.position, finishMs: r.finishMs, bestLapMs: r.bestLapMs, driftPoints: (_a = r.driftPoints) !== null && _a !== void 0 ? _a : 0 },
                                            })];
                                    case 3:
                                        _b.sent();
                                        _b.label = 4;
                                    case 4:
                                        _i++;
                                        return [3 /*break*/, 2];
                                    case 5: return [2 /*return*/, tx.match.update({
                                            where: { id: matchId },
                                            data: { status: 'FINISHED_VALIDATED', validatedAt: new Date(this.clock.nowMs()) },
                                        })];
                                }
                            });
                        }); })];
                });
            });
        };
        /** Invalidation (refus résultat / panne serveur) — terminal, motive les litiges INV-18/19. */
        MatchesService_1.prototype.invalidate = function (matchId, reason) {
            return __awaiter(this, void 0, void 0, function () {
                var match;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.match.findUnique({ where: { id: matchId } })];
                        case 1:
                            match = _b.sent();
                            if (!match)
                                throw new domain_errors_1.NotFoundError('Match', matchId);
                            if (match.status === 'INVALIDATED')
                                return [2 /*return*/, match];
                            (0, match_state_machine_1.assertMatchTransition)(match.status, 'INVALIDATED');
                            this.logger.warn("Match ".concat(matchId, " INVALIDATED: ").concat(reason));
                            return [2 /*return*/, this.prisma.match.update({
                                    where: { id: matchId },
                                    data: { status: 'INVALIDATED', invalidatedReason: reason, finishedAt: (_a = match.finishedAt) !== null && _a !== void 0 ? _a : new Date(this.clock.nowMs()) },
                                })];
                    }
                });
            });
        };
        /** Libération du serveur après terminal (count activeMatches -1, clamp ≥ 0). */
        MatchesService_1.prototype.releaseServer = function (serverId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.gameServer.updateMany({
                                where: { id: serverId, activeMatches: { gt: 0 } },
                                data: { activeMatches: { decrement: 1 } },
                            })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.gameServer.updateMany({
                                    where: { id: serverId, status: 'RESERVED', activeMatches: 0 },
                                    data: { status: 'REGISTERED' },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        return MatchesService_1;
    }());
    __setFunctionName(_classThis, "MatchesService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MatchesService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MatchesService = _classThis;
}();
exports.MatchesService = MatchesService;
