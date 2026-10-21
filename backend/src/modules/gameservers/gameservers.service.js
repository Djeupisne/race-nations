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
exports.GameserversService = void 0;
/**
 * gameservers.service.ts — gestion de la flotte de game servers (docs/networking.md).
 * Machine à états : REGISTERED → RESERVED → DRAINING → OFFLINE (game-server.state-machine).
 * - allocate() : choix du serveur REGISTERED le moins chargé dans la région demandée ;
 *   la réservation est une UPDATE conditionnelle (count===1) pour éviter la double
 *   attribution en concurrence (pas de SELECT FOR UPDATE ici : colonne compteur atomique).
 * - heartbeat() : rafraîchit lastHeartbeatAt ; un serveur sans HB depuis 30 s est
 *   considéré mort par fleet-health (marquage OFFLINE + réaffectation des matchs vides).
 * - drain : arrêt gracieux — plus d'allocation, les matchs en cours terminent.
 */
var common_1 = require("@nestjs/common");
var game_server_state_machine_1 = require("../../common/state-machines/game-server.state-machine");
var domain_errors_1 = require("../../common/errors/domain-errors");
var HEARTBEAT_STALE_MS = 30000;
var GameserversService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var GameserversService = _classThis = /** @class */ (function () {
        function GameserversService_1(prisma, clock) {
            this.prisma = prisma;
            this.clock = clock;
            this.logger = new common_1.Logger(GameserversService.name);
        }
        /** Enregistrement au boot du game server (route signée ServerAuthGuard). */
        GameserversService_1.prototype.register = function (input) {
            return __awaiter(this, void 0, void 0, function () {
                var existing;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.gameServer.findUnique({ where: { hostname: input.hostname } })];
                        case 1:
                            existing = _b.sent();
                            if (existing) {
                                return [2 /*return*/, this.prisma.gameServer.update({
                                        where: { id: existing.id },
                                        data: { wsUrl: input.wsUrl, region: input.region, status: 'REGISTERED', lastHeartbeatAt: new Date(this.clock.nowMs()) },
                                    })];
                            }
                            return [2 /*return*/, this.prisma.gameServer.create({
                                    data: {
                                        hostname: input.hostname,
                                        wsUrl: input.wsUrl,
                                        region: input.region,
                                        capacity: (_a = input.capacity) !== null && _a !== void 0 ? _a : 8,
                                        status: 'REGISTERED',
                                        sharedSecretRef: "kms:gameserver/".concat(input.hostname),
                                        lastHeartbeatAt: new Date(this.clock.nowMs()),
                                    },
                                })];
                    }
                });
            });
        };
        /**
         * Allocation pour un match : serveur REGISTERED de la région, moins chargé, avec
         * capacité restante. UPDATE WHERE status='REGISTERED' AND activeMatches < capacity
         * → count===1 garantit l'exclusivité en concurrence (deux allocations parallèles ne
         * peuvent pas prendre la même dernière place).
         */
        GameserversService_1.prototype.allocate = function (region) {
            return __awaiter(this, void 0, void 0, function () {
                var candidates, _i, candidates_1, c, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.gameServer.findMany({
                                where: { region: region, status: 'REGISTERED', activeMatches: { lt: this.prisma.gameServer.fields ? undefined : undefined } },
                                orderBy: [{ activeMatches: 'asc' }, { lastHeartbeatAt: 'desc' }],
                                take: 5,
                                select: { id: true, wsUrl: true, capacity: true, activeMatches: true },
                            })];
                        case 1:
                            candidates = _a.sent();
                            _i = 0, candidates_1 = candidates;
                            _a.label = 2;
                        case 2:
                            if (!(_i < candidates_1.length)) return [3 /*break*/, 5];
                            c = candidates_1[_i];
                            if (c.activeMatches >= c.capacity)
                                return [3 /*break*/, 4];
                            return [4 /*yield*/, this.prisma.gameServer.updateMany({
                                    where: { id: c.id, status: 'REGISTERED', activeMatches: { lt: c.capacity } },
                                    data: { activeMatches: { increment: 1 } },
                                })];
                        case 3:
                            updated = _a.sent();
                            if (updated.count === 1) {
                                return [2 /*return*/, { serverId: c.id, wsUrl: c.wsUrl }];
                            }
                            _a.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 2];
                        case 5: throw new domain_errors_1.ServerUnavailableError("No game server available in region ".concat(region, "."));
                    }
                });
            });
        };
        /** Libération après fin de match (settlement) — décrément plancher 0. */
        GameserversService_1.prototype.release = function (serverId) {
            return __awaiter(this, void 0, void 0, function () {
                var server;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.gameServer.findUnique({ where: { id: serverId } })];
                        case 1:
                            server = _a.sent();
                            if (!server)
                                return [2 /*return*/]; // déjà retiré de la flotte — no-op
                            return [4 /*yield*/, this.prisma.gameServer.update({
                                    where: { id: serverId },
                                    data: { activeMatches: Math.max(0, server.activeMatches - 1) },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /** Heartbeat signé : rafraîchit l'horodatage + renvoie la consigne (continue|drain). */
        GameserversService_1.prototype.heartbeat = function (serverId, activeMatches) {
            return __awaiter(this, void 0, void 0, function () {
                var server;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.gameServer.findUnique({ where: { id: serverId } })];
                        case 1:
                            server = _a.sent();
                            if (!server)
                                throw new domain_errors_1.NotFoundError('GameServer', serverId);
                            return [4 /*yield*/, this.prisma.gameServer.update({
                                    where: { id: serverId },
                                    data: { lastHeartbeatAt: new Date(this.clock.nowMs()), activeMatches: Math.max(0, Math.floor(activeMatches)) },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { command: server.status === 'DRAINING' ? 'drain' : 'continue' }];
                    }
                });
            });
        };
        /** Drain gracieux (admin ou shutdown planifié). */
        GameserversService_1.prototype.drain = function (serverId) {
            return __awaiter(this, void 0, void 0, function () {
                var server;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.gameServer.findUnique({ where: { id: serverId } })];
                        case 1:
                            server = _a.sent();
                            if (!server)
                                throw new domain_errors_1.NotFoundError('GameServer', serverId);
                            (0, game_server_state_machine_1.assertGameServerTransition)(server.status, 'DRAINING');
                            return [4 /*yield*/, this.prisma.gameServer.update({
                                    where: { id: serverId },
                                    data: { status: 'DRAINING', drainedAt: new Date(this.clock.nowMs()) },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /** Passage OFFLINE explicite (après drain complet ou retrait manuel). */
        GameserversService_1.prototype.retire = function (serverId) {
            return __awaiter(this, void 0, void 0, function () {
                var server;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.gameServer.findUnique({ where: { id: serverId } })];
                        case 1:
                            server = _a.sent();
                            if (!server)
                                throw new domain_errors_1.NotFoundError('GameServer', serverId);
                            (0, game_server_state_machine_1.assertGameServerTransition)(server.status, 'OFFLINE');
                            return [4 /*yield*/, this.prisma.gameServer.update({ where: { id: serverId }, data: { status: 'OFFLINE' } })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /** Vue flotte pour l'admin/health indicator. */
        GameserversService_1.prototype.fleet = function () {
            return __awaiter(this, void 0, void 0, function () {
                var now, servers;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            now = this.clock.nowMs();
                            return [4 /*yield*/, this.prisma.gameServer.findMany({ orderBy: [{ region: 'asc' }, { hostname: 'asc' }] })];
                        case 1:
                            servers = _a.sent();
                            return [2 /*return*/, servers.map(function (s) { return ({
                                    id: s.id,
                                    hostname: s.hostname,
                                    region: s.region,
                                    status: s.status,
                                    activeMatches: s.activeMatches,
                                    capacity: s.capacity,
                                    stale: !s.lastHeartbeatAt || now - s.lastHeartbeatAt.getTime() > HEARTBEAT_STALE_MS,
                                }); })];
                    }
                });
            });
        };
        return GameserversService_1;
    }());
    __setFunctionName(_classThis, "GameserversService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        GameserversService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return GameserversService = _classThis;
}();
exports.GameserversService = GameserversService;
