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
exports.AdminController = void 0;
/**
 * admin.controller.ts — routes back-office (docs/api.md §9). RBAC strict :
 *  - lecture supervision : MODERATOR+ ;
 *  - settlement manuel / résolution litige / reversal House : ADMIN uniquement ;
 *  - sanctions : MODERATOR+ (WARN/MUTE/RESTRICTION), TEMP_BAN/PERM_BAN via AdminService.
 * L'acteur est TOUJOURS req.user (jamais un champ du body — INV-28 anti-usurpation).
 */
var common_1 = require("@nestjs/common");
var zod_1 = require("zod");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var domain_errors_1 = require("../../common/errors/domain-errors");
var ManualSettleSchema = zod_1.z.object({
    marketId: zod_1.z.string().uuid(),
    winningSide: zod_1.z.number().int().min(0).max(15).optional(),
    push: zod_1.z.boolean().optional(),
    reason: zod_1.z.string().min(10).max(2000),
});
var SanctionSchema = zod_1.z.object({
    playerId: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['WARN', 'CHAT_MUTE', 'BET_RESTRICTION', 'TEMP_BAN_7D', 'PERM_BAN', 'REWARD_CLAWBACK']),
    reason: zod_1.z.string().min(5).max(2000),
    evidenceRef: zod_1.z.string().max(200).optional(),
});
var DisputeResolveSchema = zod_1.z.object({
    outcome: zod_1.z.enum(['REFUND_ALL', 'UPHELD']),
    note: zod_1.z.string().min(10).max(2000),
});
var DisputeReasonSchema = zod_1.z.enum(['CHEAT_SUSPECTED', 'RESULT_MISMATCH', 'DISCONNECT_DISPUTE', 'SERVER_FAULT', 'OTHER']);
var AdminController = function () {
    var _classDecorators = [(0, common_1.Controller)('v1/admin'), (0, roles_decorator_1.Roles)('MODERATOR', 'ADMIN')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _dashboard_decorators;
    var _settle_decorators;
    var _dispute_decorators;
    var _resolve_decorators;
    var _sanction_decorators;
    var _drain_decorators;
    var _audit_decorators;
    var AdminController = _classThis = /** @class */ (function () {
        function AdminController_1(admin, audit) {
            this.admin = (__runInitializers(this, _instanceExtraInitializers), admin);
            this.audit = audit;
        }
        AdminController_1.prototype.actor = function (req) {
            var u = req.user;
            if (!u)
                throw new domain_errors_1.AuthUnauthenticatedError();
            return { userId: u.userId, role: u.role === 'ADMIN' ? 'ADMIN' : 'MODERATOR' };
        };
        /** GET /v1/admin/dashboard — flotte + marchés litigieux/settling. */
        AdminController_1.prototype.dashboard = function () {
            return this.admin.dashboard();
        };
        /** POST /v1/admin/betting/markets/:id/settle — settlement manuel AUDITÉ (ADMIN only). */
        AdminController_1.prototype.settle = function (req, id, body) {
            return __awaiter(this, void 0, void 0, function () {
                var parsed;
                return __generator(this, function (_a) {
                    parsed = ManualSettleSchema.safeParse(body);
                    if (!parsed.success)
                        throw new domain_errors_1.ValidationError({ field: 'body', reason: parsed.error.message });
                    return [2 /*return*/, this.admin.manualSettleMarket(this.actor(req), __assign(__assign({}, parsed.data), { marketId: id }))];
                });
            });
        };
        /** POST /v1/admin/betting/markets/:id/dispute — ouverture litige (gel ≤ 72 h, INV-19). */
        AdminController_1.prototype.dispute = function (req, id, body) {
            var parsed = DisputeReasonSchema.safeParse(body === null || body === void 0 ? void 0 : body.reason);
            if (!parsed.success)
                throw new domain_errors_1.ValidationError({ field: 'reason', reason: parsed.error.message });
            return this.admin.openDispute(this.actor(req), id, parsed.data);
        };
        /** POST /v1/admin/betting/markets/:id/dispute/resolve — tranche le litige (ADMIN only). */
        AdminController_1.prototype.resolve = function (req, id, body) {
            return __awaiter(this, void 0, void 0, function () {
                var parsed;
                return __generator(this, function (_a) {
                    parsed = DisputeResolveSchema.safeParse(body);
                    if (!parsed.success)
                        throw new domain_errors_1.ValidationError({ field: 'body', reason: parsed.error.message });
                    return [2 /*return*/, this.admin.resolveDispute(this.actor(req), id, parsed.data.outcome, parsed.data.note)];
                });
            });
        };
        /** POST /v1/admin/sanctions — émission auditée. */
        AdminController_1.prototype.sanction = function (req, body) {
            return __awaiter(this, void 0, void 0, function () {
                var parsed;
                return __generator(this, function (_a) {
                    parsed = SanctionSchema.safeParse(body);
                    if (!parsed.success)
                        throw new domain_errors_1.ValidationError({ field: 'body', reason: parsed.error.message });
                    return [2 /*return*/, this.admin.issueSanction(this.actor(req), parsed.data)];
                });
            });
        };
        /** POST /v1/admin/servers/:id/drain — maintenance flotte. */
        AdminController_1.prototype.drain = function (req, id) {
            return this.admin.drainServer(this.actor(req), id);
        };
        /** GET /v1/admin/audit?targetType=&targetId=&limit= — consultation journal append-only. */
        AdminController_1.prototype.audit = function (targetType, targetId, limit) {
            return this.audit.search({ targetType: targetType, targetId: targetId, limit: limit ? Number(limit) : undefined });
        };
        return AdminController_1;
    }());
    __setFunctionName(_classThis, "AdminController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _dashboard_decorators = [(0, common_1.Get)('dashboard')];
        _settle_decorators = [(0, roles_decorator_1.Roles)('ADMIN'), (0, common_1.Post)('betting/markets/:id/settle'), (0, common_1.HttpCode)(200)];
        _dispute_decorators = [(0, common_1.Post)('betting/markets/:id/dispute'), (0, common_1.HttpCode)(200)];
        _resolve_decorators = [(0, roles_decorator_1.Roles)('ADMIN'), (0, common_1.Post)('betting/markets/:id/dispute/resolve'), (0, common_1.HttpCode)(200)];
        _sanction_decorators = [(0, common_1.Post)('sanctions')];
        _drain_decorators = [(0, common_1.Post)('servers/:id/drain'), (0, common_1.HttpCode)(200)];
        _audit_decorators = [(0, common_1.Get)('audit')];
        __esDecorate(_classThis, null, _dashboard_decorators, { kind: "method", name: "dashboard", static: false, private: false, access: { has: function (obj) { return "dashboard" in obj; }, get: function (obj) { return obj.dashboard; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _settle_decorators, { kind: "method", name: "settle", static: false, private: false, access: { has: function (obj) { return "settle" in obj; }, get: function (obj) { return obj.settle; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _dispute_decorators, { kind: "method", name: "dispute", static: false, private: false, access: { has: function (obj) { return "dispute" in obj; }, get: function (obj) { return obj.dispute; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _resolve_decorators, { kind: "method", name: "resolve", static: false, private: false, access: { has: function (obj) { return "resolve" in obj; }, get: function (obj) { return obj.resolve; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _sanction_decorators, { kind: "method", name: "sanction", static: false, private: false, access: { has: function (obj) { return "sanction" in obj; }, get: function (obj) { return obj.sanction; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _drain_decorators, { kind: "method", name: "drain", static: false, private: false, access: { has: function (obj) { return "drain" in obj; }, get: function (obj) { return obj.drain; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _audit_decorators, { kind: "method", name: "audit", static: false, private: false, access: { has: function (obj) { return "audit" in obj; }, get: function (obj) { return obj.audit; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AdminController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AdminController = _classThis;
}();
exports.AdminController = AdminController;
