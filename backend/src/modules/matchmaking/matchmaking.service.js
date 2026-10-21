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
exports.MatchmakingService = void 0;
/**
 * matchmaking.service.ts — files de match (docs/api.md §4, machine Ticket INV-22).
 * Un joueur = UN ticket actif par mode. Le worker (matchmaking.worker) apparie ; ici :
 * enqueue / status / cancel. Expiration contractuelle par mode (CdC §4.1) :
 * classée 120 s, rapide 60 s, BR 120 s — stockée en expiresAt, scannée par le worker.
 */
var common_1 = require("@nestjs/common");
var ticket_state_machine_1 = require("../../common/state-machines/ticket.state-machine");
var domain_errors_1 = require("../../common/errors/domain-errors");
/** Durées max d'attente par mode (ms) — CdC game-modes §4.1. */
var QUEUE_TTL_MS = {
    RANKED_1V1: 120000,
    RANKED_FFA: 120000,
    QUICK_RACE: 60000,
    BATTLE_ROYALE: 120000,
    TOURNAMENT: 300000,
    CLAN_WARS: 180000,
    PRACTICE: 60000,
};
var MatchmakingService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var MatchmakingService = _classThis = /** @class */ (function () {
        function MatchmakingService_1(prisma, clock) {
            this.prisma = prisma;
            this.clock = clock;
            this.logger = new common_1.Logger(MatchmakingService.name);
        }
        /** POST /v1/matchmaking/queue — crée un ticket QUEUED (refus si déjà en file sur ce mode). */
        MatchmakingService_1.prototype.enqueue = function (playerId, mode, preferredTrackId) {
            return __awaiter(this, void 0, void 0, function () {
                var player, active, ttl, now, ticket, queueDepth, estimatedWaitMs;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.player.findUnique({ where: { id: playerId }, select: { plPoints: true } })];
                        case 1:
                            player = _b.sent();
                            if (!player)
                                throw new domain_errors_1.NotFoundError('Player', playerId);
                            return [4 /*yield*/, this.prisma.matchmakingTicket.findFirst({
                                    where: { playerId: playerId, mode: mode, status: { in: ['QUEUED', 'MATCHED'] } },
                                    select: { id: true },
                                })];
                        case 2:
                            active = _b.sent();
                            if (active)
                                throw new domain_errors_1.ValidationError({ field: 'mode', reason: "Already queued (ticket ".concat(active.id, ").") });
                            ttl = (_a = QUEUE_TTL_MS[mode]) !== null && _a !== void 0 ? _a : 120000;
                            now = this.clock.nowMs();
                            return [4 /*yield*/, this.prisma.matchmakingTicket.create({
                                    data: {
                                        playerId: playerId,
                                        mode: mode,
                                        status: 'QUEUED',
                                        plAtQueue: player.plPoints,
                                        requestedAt: new Date(now),
                                        expiresAt: new Date(now + ttl),
                                    },
                                })];
                        case 3:
                            ticket = _b.sent();
                            void preferredTrackId; // PRACTICE uniquement — réservé phase rooms
                            return [4 /*yield*/, this.prisma.matchmakingTicket.count({ where: { mode: mode, status: 'QUEUED' } })];
                        case 4:
                            queueDepth = _b.sent();
                            estimatedWaitMs = Math.min(ttl, Math.max(5000, queueDepth * 3000));
                            this.logger.log("Queued ticket=".concat(ticket.id, " player=").concat(playerId, " mode=").concat(mode, " pl=").concat(player.plPoints));
                            return [2 /*return*/, { ticketId: ticket.id, estimatedWaitMs: estimatedWaitMs }];
                    }
                });
            });
        };
        /** GET /v1/matchmaking/ticket/:id — état + position estimée dans la file. */
        MatchmakingService_1.prototype.ticket = function (ticketId, ownerId) {
            return __awaiter(this, void 0, void 0, function () {
                var t, queuePosition;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.matchmakingTicket.findUnique({ where: { id: ticketId } })];
                        case 1:
                            t = _a.sent();
                            if (!t)
                                throw new domain_errors_1.NotFoundError('MatchmakingTicket', ticketId);
                            if (t.playerId !== ownerId)
                                throw new domain_errors_1.NotFoundError('MatchmakingTicket', ticketId); // pas de fuite d'existence
                            queuePosition = null;
                            if (!(t.status === 'QUEUED')) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.prisma.matchmakingTicket.count({
                                    where: { mode: t.mode, status: 'QUEUED', requestedAt: { lt: t.requestedAt } },
                                })];
                        case 2:
                            queuePosition = _a.sent();
                            _a.label = 3;
                        case 3: return [2 /*return*/, __assign(__assign({}, t), { queuePosition: queuePosition })];
                    }
                });
            });
        };
        /** DELETE /v1/matchmaking/queue/:id — annulation joueur (QUEUED/MATCHED → CANCELLED, INV-22). */
        MatchmakingService_1.prototype.cancel = function (ticketId_1, playerId_1) {
            return __awaiter(this, arguments, void 0, function (ticketId, playerId, reason) {
                var t;
                if (reason === void 0) { reason = 'PLAYER_CANCEL'; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.matchmakingTicket.findUnique({ where: { id: ticketId } })];
                        case 1:
                            t = _a.sent();
                            if (!t)
                                throw new domain_errors_1.NotFoundError('MatchmakingTicket', ticketId);
                            if (t.playerId !== playerId)
                                throw new domain_errors_1.NotFoundError('MatchmakingTicket', ticketId);
                            if (t.status === 'CANCELLED')
                                return [2 /*return*/, t]; // idempotent
                            (0, ticket_state_machine_1.assertTicketTransition)(t.status, 'CANCELLED');
                            return [2 /*return*/, this.prisma.matchmakingTicket.update({
                                    where: { id: ticketId },
                                    data: { status: 'CANCELLED', cancelReason: reason },
                                })];
                    }
                });
            });
        };
        /** Mes tickets actifs (lobby UI). */
        MatchmakingService_1.prototype.myActiveTickets = function (playerId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.matchmakingTicket.findMany({
                            where: { playerId: playerId, status: { in: ['QUEUED', 'MATCHED', 'JOINED'] } },
                            orderBy: { requestedAt: 'desc' },
                        })];
                });
            });
        };
        /** Profondeurs de files pour supervision/admin + estimation client. */
        MatchmakingService_1.prototype.queueStats = function () {
            return __awaiter(this, void 0, void 0, function () {
                var grouped;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.matchmakingTicket.groupBy({
                                by: ['mode'],
                                where: { status: 'QUEUED' },
                                _count: { _all: true },
                            })];
                        case 1:
                            grouped = _a.sent();
                            return [2 /*return*/, grouped.map(function (g) { return ({ mode: g.mode, depth: g._count._all }); })];
                    }
                });
            });
        };
        /** Recherche de partenaire pour le worker : même mode, PL dans la fenêtre, FIFO. */
        MatchmakingService_1.prototype.findCandidates = function (plCenter, plWindow, excludeTicketId, mode, limit) {
            if (limit === void 0) { limit = 10; }
            return this.prisma.matchmakingTicket.findMany({
                where: {
                    mode: mode,
                    status: 'QUEUED',
                    id: { not: excludeTicketId },
                    plAtQueue: { gte: plCenter - plWindow, lte: plCenter + plWindow },
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date(this.clock.nowMs()) } }],
                },
                orderBy: { requestedAt: 'asc' },
                take: limit,
                select: { id: true, playerId: true, plAtQueue: true },
            });
        };
        return MatchmakingService_1;
    }());
    __setFunctionName(_classThis, "MatchmakingService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MatchmakingService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MatchmakingService = _classThis;
}();
exports.MatchmakingService = MatchmakingService;
