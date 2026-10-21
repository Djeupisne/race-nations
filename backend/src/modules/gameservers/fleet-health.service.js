"use strict";
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
exports.FleetHealthService = void 0;
/**
 * fleet-health.service.ts — watchdog de la flotte (cron interne, docs/stability.md).
 * Toutes les 10 s :
 *  - heartbeat manquant > 30 s sur un serveur REGISTERED/RESERVED → statut OFFLINE ;
 *  - les matchs WAITING_FOR_PLAYERS/LOADING attachés à un serveur mort retournent en
 *    file (ticket remis en QUEUED par matchmaking.worker via l'événement) ;
 *  - journalise un compteur d'incidents (observability.md §5 "fleet").
 * Ne touche JAMAIS les fonds : un match en IN_PROGRESS sur serveur mort est INVALIDÉ
 * côté résultats (result-validator), jamais réglé arbitrairement.
 */
var common_1 = require("@nestjs/common");
var schedule_1 = require("@nestjs/schedule");
var STALE_MS = 30000;
var FleetHealthService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _sweep_decorators;
    var FleetHealthService = _classThis = /** @class */ (function () {
        function FleetHealthService_1(prisma, clock) {
            this.prisma = (__runInitializers(this, _instanceExtraInitializers), prisma);
            this.clock = clock;
            this.logger = new common_1.Logger(FleetHealthService.name);
        }
        FleetHealthService_1.prototype.sweep = function () {
            return __awaiter(this, void 0, void 0, function () {
                var now, cutoff, dead, _i, dead_1, s, orphanCount;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            now = this.clock.nowMs();
                            cutoff = new Date(now - STALE_MS);
                            return [4 /*yield*/, this.prisma.gameServer.findMany({
                                    where: { status: { in: ['REGISTERED', 'RESERVED'] }, lastHeartbeatAt: { lt: cutoff } },
                                    select: { id: true, hostname: true },
                                })];
                        case 1:
                            dead = _a.sent();
                            if (dead.length === 0)
                                return [2 /*return*/];
                            _i = 0, dead_1 = dead;
                            _a.label = 2;
                        case 2:
                            if (!(_i < dead_1.length)) return [3 /*break*/, 6];
                            s = dead_1[_i];
                            return [4 /*yield*/, this.prisma.gameServer.update({ where: { id: s.id }, data: { status: 'OFFLINE' } })];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.match.updateMany({
                                    where: { serverId: s.id, status: { in: ['WAITING_FOR_PLAYERS', 'LOADING', 'IN_PROGRESS'] } },
                                    data: { status: 'INVALIDATED', invalidatedReason: 'SERVER_LOST', finishedAt: new Date(now) },
                                })];
                        case 4:
                            orphanCount = _a.sent();
                            this.logger.warn("Fleet health: server ".concat(s.hostname, " OFFLINE (stale heartbeat), ").concat(orphanCount.count, " match(es) invalidated"));
                            _a.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 2];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        /** Nombre de serveurs prêts — consommé par health.indicator gameservers. */
        FleetHealthService_1.prototype.readyCount = function () {
            return __awaiter(this, void 0, void 0, function () {
                var now;
                return __generator(this, function (_a) {
                    now = this.clock.nowMs();
                    return [2 /*return*/, this.prisma.gameServer.count({
                            where: { status: 'REGISTERED', lastHeartbeatAt: { gte: new Date(now - STALE_MS) } },
                        })];
                });
            });
        };
        return FleetHealthService_1;
    }());
    __setFunctionName(_classThis, "FleetHealthService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _sweep_decorators = [(0, schedule_1.Interval)(10000)];
        __esDecorate(_classThis, null, _sweep_decorators, { kind: "method", name: "sweep", static: false, private: false, access: { has: function (obj) { return "sweep" in obj; }, get: function (obj) { return obj.sweep; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FleetHealthService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FleetHealthService = _classThis;
}();
exports.FleetHealthService = FleetHealthService;
