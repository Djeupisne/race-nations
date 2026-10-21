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
exports.MatchesController = void 0;
/**
 * matches.controller.ts — API publique/serveur des matchs (docs/api.md §4).
 * Routes joueur : JWT global + ownership. Routes game server : ServerAuthGuard (HMAC INV-26),
 * jamais accessibles à un JWT joueur. Les transitions d'état sont validées par la machine
 * Match côté service — le controller ne fait que router et authentifier.
 */
var common_1 = require("@nestjs/common");
var api_contracts_1 = require("@race-nations/api-contracts");
var zod_1 = require("zod");
var zod_validation_pipe_1 = require("../../common/pipes/zod-validation.pipe");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var server_auth_guard_1 = require("../../common/guards/server-auth.guard");
var ownership_guard_1 = require("../../common/guards/ownership.guard");
var joinPipe = new zod_validation_pipe_1.ZodValidationPipe(api_contracts_1.JoinMatchInputSchema);
var StatusReportSchema = zod_1.z
    .object({ status: zod_1.z.enum(['LOADING', 'IN_PROGRESS', 'FINISHED']) })
    .strict();
var InvalidateSchema = zod_1.z.object({ reason: zod_1.z.string().min(3).max(500) }).strict();
var MatchesController = function () {
    var _classDecorators = [(0, common_1.Controller)('v1/matches')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _get_decorators;
    var _history_decorators;
    var _join_decorators;
    var _statusReport_decorators;
    var _invalidateByServer_decorators;
    var _manualSettle_decorators;
    var MatchesController = _classThis = /** @class */ (function () {
        function MatchesController_1(matches, settlement) {
            this.matches = (__runInitializers(this, _instanceExtraInitializers), matches);
            this.settlement = settlement;
        }
        /** GET /v1/matches/:id — fiche match (joueurs, statut, piste). */
        MatchesController_1.prototype.get = function (id) {
            return this.matches.getMatch(id);
        };
        /** GET /v1/matches/me/history — mes courses passées. */
        MatchesController_1.prototype.history = function (user, limit, cursor) {
            return this.matches.historyForPlayer(user.playerId, { limit: Math.min(parseInt(limit !== null && limit !== void 0 ? limit : '20', 10) || 20, 50), cursor: cursor });
        };
        /** POST /v1/matches/:id/join — acceptation après assignation matchmaking. */
        MatchesController_1.prototype.join = function (id, user, body) {
            // body.matchId contrôlé égal à :id (le pipe strict l'a validé ; cohérence défensive ici).
            if (body.matchId !== id) {
                return Promise.reject(new Error('path/body matchId mismatch'));
            }
            return this.matches.join(id, user.playerId);
        };
        /* --------------------------- Routes game server -------------------------- */
        /** PATCH /v1/matches/:id/status — progression de course signalée par le serveur dédié. */
        MatchesController_1.prototype.statusReport = function (id, body) {
            return this.matches.updateStatusFromServer(id, body.status);
        };
        /** POST /v1/matches/:id/invalidate — le serveur s'auto-invalide (crash, anti-triche). */
        MatchesController_1.prototype.invalidateByServer = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                var m;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.matches.invalidate(id, "SERVER:".concat(body.reason))];
                        case 1:
                            m = _a.sent();
                            return [4 /*yield*/, this.settlement.handleInvalidatedMatch(id, body.reason)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, m];
                    }
                });
            });
        };
        /** POST /v1/matches/:id/settle — rejeu manuel du règlement (ADMIN, runbook §6). */
        MatchesController_1.prototype.manualSettle = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.settlement.settleValidatedMatch(id)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, { ok: true }];
                    }
                });
            });
        };
        return MatchesController_1;
    }());
    __setFunctionName(_classThis, "MatchesController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _get_decorators = [(0, common_1.Get)(':id')];
        _history_decorators = [(0, common_1.Get)('me/history'), (0, common_1.UseGuards)(ownership_guard_1.OwnershipGuard), (0, ownership_guard_1.ownership)({ resource: 'self' })];
        _join_decorators = [(0, common_1.Post)(':id/join'), (0, common_1.UseGuards)(ownership_guard_1.OwnershipGuard), (0, ownership_guard_1.ownership)({ resource: 'matchParticipant' })];
        _statusReport_decorators = [(0, common_1.Post)(':id/status-report'), (0, common_1.UseGuards)(server_auth_guard_1.ServerAuthGuard)];
        _invalidateByServer_decorators = [(0, common_1.Post)(':id/invalidate'), (0, common_1.UseGuards)(server_auth_guard_1.ServerAuthGuard)];
        _manualSettle_decorators = [(0, common_1.Post)(':id/settle'), (0, roles_decorator_1.Roles)('ADMIN')];
        __esDecorate(_classThis, null, _get_decorators, { kind: "method", name: "get", static: false, private: false, access: { has: function (obj) { return "get" in obj; }, get: function (obj) { return obj.get; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _history_decorators, { kind: "method", name: "history", static: false, private: false, access: { has: function (obj) { return "history" in obj; }, get: function (obj) { return obj.history; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _join_decorators, { kind: "method", name: "join", static: false, private: false, access: { has: function (obj) { return "join" in obj; }, get: function (obj) { return obj.join; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _statusReport_decorators, { kind: "method", name: "statusReport", static: false, private: false, access: { has: function (obj) { return "statusReport" in obj; }, get: function (obj) { return obj.statusReport; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _invalidateByServer_decorators, { kind: "method", name: "invalidateByServer", static: false, private: false, access: { has: function (obj) { return "invalidateByServer" in obj; }, get: function (obj) { return obj.invalidateByServer; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _manualSettle_decorators, { kind: "method", name: "manualSettle", static: false, private: false, access: { has: function (obj) { return "manualSettle" in obj; }, get: function (obj) { return obj.manualSettle; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MatchesController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MatchesController = _classThis;
}();
exports.MatchesController = MatchesController;
