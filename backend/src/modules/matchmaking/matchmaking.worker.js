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
exports.MatchmakingWorker = void 0;
exports.computePlWindow = computePlWindow;
/**
 * matchmaking.worker.ts — cerveau d'appariement (docs/api.md §4, INV-22 machine Ticket).
 * Tick 500 ms : scan des tickets QUEUED par mode, fenêtre PL dynamique (±200 → ±500
 * selon attente, CdC game-modes §4.1), appariement 1v1/FFA, création du Match +
 * MatchPlayer + tickets MATCHED dans UNE transaction atomique, puis allocation
 * game-server APRÈS commit (l'allocation échoue → le match reste WAITING_FOR_PLAYERS,
 * jamais de fonds ni d'état incohérent).
 * Kill-switch : MATCHMAKING_PAUSED=true → le worker ne marie plus (files conservées,
 * les tickets expirent normalement). Expiration : status=EXPIRED uniquement QUEUED→EXPIRED.
 */
var common_1 = require("@nestjs/common");
var betting_config_1 = require("../../config/betting.config");
/** Paliers d'élargissement de la fenêtre PL en fonction de l'attente (ms). */
var PL_WINDOW_STEPS = [
    { afterMs: 0, window: 200 }, // 0–20 s : ±200 strict
    { afterMs: 20000, window: 350 }, // 20–40 s
    { afterMs: 40000, window: 500 }, // > 40 s : plafond contractuel ±500
];
/** Tailles de plateau par mode (CdC §4) — 1v1 = 2, FFA/QUICK = 8, BR = 12. */
var SEAT_COUNT = {
    RANKED_1V1: 2,
    RANKED_FFA: 8,
    QUICK_RACE: 6,
    BATTLE_ROYALE: 12,
    TOURNAMENT: 8,
    CLAN_WARS: 8,
    PRACTICE: 4,
};
var TRACKS = ['lome', 'accra', 'lagos', 'dakar', 'paris', 'tokyo'];
function computePlWindow(waitMs) {
    var window = PL_WINDOW_STEPS[0].window;
    for (var _i = 0, PL_WINDOW_STEPS_1 = PL_WINDOW_STEPS; _i < PL_WINDOW_STEPS_1.length; _i++) {
        var step = PL_WINDOW_STEPS_1[_i];
        if (waitMs >= step.afterMs)
            window = step.window;
    }
    return window;
}
var MatchmakingWorker = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var MatchmakingWorker = _classThis = /** @class */ (function () {
        function MatchmakingWorker_1(prisma, gameservers, clock) {
            this.prisma = prisma;
            this.gameservers = gameservers;
            this.clock = clock;
            this.logger = new common_1.Logger(MatchmakingWorker.name);
            this.running = false;
            this.config = (0, betting_config_1.loadBettingConfig)();
        }
        MatchmakingWorker_1.prototype.onModuleInit = function () {
            var _this = this;
            var _a, _b;
            // Un seul worker actif par réplique est garanti en prod par un lock Redis
            // (SET rn:mm:worker NX PX) — ici le tick est idempotent grâce aux UPDATE
            // conditionnels status='QUEUED' (count===1 ⇒ je suis bien le propriétaire).
            this.timer = setInterval(function () { return void _this.tick().catch(function (err) { return _this.logger.error(err); }); }, 500);
            (_b = (_a = this.timer).unref) === null || _b === void 0 ? void 0 : _b.call(_a);
        };
        MatchmakingWorker_1.prototype.onModuleDestroy = function () {
            if (this.timer)
                clearInterval(this.timer);
        };
        /** Un tour d'appariement : expiration puis pairing. Verrou applicatif anti-reentrance. */
        MatchmakingWorker_1.prototype.tick = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _i, _a, mode;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (this.running)
                                return [2 /*return*/]; // le tick précédent n'est pas fini (backpressure naturelle)
                            this.running = true;
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, , 7, 8]);
                            return [4 /*yield*/, this.expireStaleTickets()];
                        case 2:
                            _b.sent();
                            if (this.config.flags().matchmakingPaused)
                                return [2 /*return*/]; // kill-switch : plus de mariages
                            _i = 0, _a = Object.keys(SEAT_COUNT);
                            _b.label = 3;
                        case 3:
                            if (!(_i < _a.length)) return [3 /*break*/, 6];
                            mode = _a[_i];
                            return [4 /*yield*/, this.pairMode(mode)];
                        case 4:
                            _b.sent();
                            _b.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 3];
                        case 6: return [3 /*break*/, 8];
                        case 7:
                            this.running = false;
                            return [7 /*endfinally*/];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        /** QUEUED dont expiresAt est dépassé → EXPIRED (transition légale UNIQUEMENT depuis QUEUED). */
        MatchmakingWorker_1.prototype.expireStaleTickets = function () {
            return __awaiter(this, void 0, void 0, function () {
                var now, stale, _i, stale_1, t;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            now = new Date(this.clock.nowMs());
                            return [4 /*yield*/, this.prisma.matchmakingTicket.findMany({
                                    where: { status: 'QUEUED', expiresAt: { lte: now } },
                                    select: { id: true },
                                    take: 200,
                                })];
                        case 1:
                            stale = _a.sent();
                            _i = 0, stale_1 = stale;
                            _a.label = 2;
                        case 2:
                            if (!(_i < stale_1.length)) return [3 /*break*/, 5];
                            t = stale_1[_i];
                            // UPDATE conditionnel : si le pairing a gagné entre-temps, count=0 → on ne touche pas.
                            return [4 /*yield*/, this.prisma.matchmakingTicket.updateMany({
                                    where: { id: t.id, status: 'QUEUED' },
                                    data: { status: 'EXPIRED' },
                                })];
                        case 3:
                            // UPDATE conditionnel : si le pairing a gagné entre-temps, count=0 → on ne touche pas.
                            _a.sent();
                            _a.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 2];
                        case 5:
                            if (stale.length > 0)
                                this.logger.debug("Expired ".concat(stale.length, " stale tickets"));
                            return [2 /*return*/];
                    }
                });
            });
        };
        /** Apparie jusqu'à 1 plateau par mode et par tick (débit volontairement borné). */
        MatchmakingWorker_1.prototype.pairMode = function (mode) {
            return __awaiter(this, void 0, void 0, function () {
                var seats, tickets, nowMs, group, _i, tickets_1, candidate, anchor, waitMs, window_1, trackId;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            seats = SEAT_COUNT[mode];
                            return [4 /*yield*/, this.prisma.matchmakingTicket.findMany({
                                    where: { mode: mode, status: 'QUEUED' },
                                    orderBy: { requestedAt: 'asc' },
                                    take: 64, // fenêtre de scan bornée — au-delà, la file est simplement trop longue
                                })];
                        case 1:
                            tickets = _a.sent();
                            if (tickets.length < 2 && seats === 2)
                                return [2 /*return*/];
                            if (tickets.length === 0)
                                return [2 /*return*/];
                            nowMs = this.clock.nowMs();
                            group = [];
                            for (_i = 0, tickets_1 = tickets; _i < tickets_1.length; _i++) {
                                candidate = tickets_1[_i];
                                if (group.length === 0) {
                                    group.push(candidate);
                                    continue;
                                }
                                anchor = group[0];
                                waitMs = nowMs - anchor.requestedAt.getTime();
                                window_1 = computePlWindow(waitMs);
                                if (Math.abs(candidate.plAtQueue - anchor.plAtQueue) <= window_1)
                                    group.push(candidate);
                                if (group.length >= seats)
                                    break;
                            }
                            // 1v1 exige exactement 2 ; les plateaux multiples acceptent au moins 2 (remplissage partiel toléré côté serveur).
                            if (group.length < (seats === 2 ? 2 : 2))
                                return [2 /*return*/];
                            trackId = TRACKS[(anchor_hash(group.map(function (g) { return g.id; }))) % TRACKS.length];
                            return [4 /*yield*/, this.createMatchAndAssign(mode, trackId, group)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /** TX atomique : tickets→MATCHED + Match + MatchPlayer. Échec total ou rien. */
        MatchmakingWorker_1.prototype.createMatchAndAssign = function (mode, trackId, group) {
            return __awaiter(this, void 0, void 0, function () {
                var now, match, err_1;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            now = new Date(this.clock.nowMs());
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var created, _i, group_1, g, updated;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, tx.match.create({
                                                    data: {
                                                        status: 'WAITING_FOR_PLAYERS',
                                                        mode: mode,
                                                        trackId: trackId,
                                                        players: { create: group.map(function (g) { return ({ playerId: g.playerId }); }) },
                                                    },
                                                })];
                                            case 1:
                                                created = _a.sent();
                                                _i = 0, group_1 = group;
                                                _a.label = 2;
                                            case 2:
                                                if (!(_i < group_1.length)) return [3 /*break*/, 5];
                                                g = group_1[_i];
                                                return [4 /*yield*/, tx.matchmakingTicket.updateMany({
                                                        where: { id: g.id, status: 'QUEUED' },
                                                        data: { status: 'MATCHED', matchId: created.id, matchedAt: now },
                                                    })];
                                            case 3:
                                                updated = _a.sent();
                                                if (updated.count !== 1) {
                                                    throw new MatchAssignmentRaceError(); // rollback complet : le match créé est annulé avec la tx
                                                }
                                                _a.label = 4;
                                            case 4:
                                                _i++;
                                                return [3 /*break*/, 2];
                                            case 5: return [2 /*return*/, created];
                                        }
                                    });
                                }); }).catch(function (err) {
                                    if (err instanceof MatchAssignmentRaceError) {
                                        _this.logger.warn("Pairing race on mode=".concat(mode, ", retry next tick"));
                                        return null;
                                    }
                                    throw err;
                                })];
                        case 1:
                            match = _a.sent();
                            if (!match)
                                return [2 /*return*/];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 5, , 6]);
                            return [4 /*yield*/, this.gameservers.allocate(match.id)];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.match.update({ where: { id: match.id }, data: { status: 'LOADING' } })];
                        case 4:
                            _a.sent();
                            this.logger.log("Match ".concat(match.id, " created mode=").concat(mode, " players=").concat(group.length));
                            return [3 /*break*/, 6];
                        case 5:
                            err_1 = _a.sent();
                            // Pas de serveur dispo → le match reste WAITING_FOR_PLAYERS ; fleet-health / prochain tick réessaieront.
                            this.logger.warn("No server available for match ".concat(match.id, ": ").concat(err_1.message));
                            return [3 /*break*/, 6];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        return MatchmakingWorker_1;
    }());
    __setFunctionName(_classThis, "MatchmakingWorker");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MatchmakingWorker = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MatchmakingWorker = _classThis;
}();
exports.MatchmakingWorker = MatchmakingWorker;
/** Sentinelle interne : course sur un ticket → rollback de la tx d'appariement. */
var MatchAssignmentRaceError = /** @class */ (function (_super) {
    __extends(MatchAssignmentRaceError, _super);
    function MatchAssignmentRaceError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return MatchAssignmentRaceError;
}(Error));
/** Petit hash déterministe pour varier le circuit sans Random non reproductible. */
function anchor_hash(ids) {
    var h = 0;
    for (var _i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
        var id = ids_1[_i];
        for (var i = 0; i < id.length; i++)
            h = (h * 31 + id.charCodeAt(i)) >>> 0;
    }
    return h;
}
