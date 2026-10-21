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
exports.SanctionsController = void 0;
/**
 * sanctions.controller.ts — cycle de vie des sanctions (docs/api.md §9).
 * Émission/décision/levée : MODERATOR+ ; appel + consultation historique : PLAYER
 * sur SES PROPRES sanctions uniquement (ownership vérifié dans le service).
 */
var common_1 = require("@nestjs/common");
var sanctions_dto_1 = require("./sanctions.dto");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var domain_errors_1 = require("../../common/errors/domain-errors");
var SanctionsController = function () {
    var _classDecorators = [(0, common_1.Controller)('v1/sanctions')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _mine_decorators;
    var _appeal_decorators;
    var _issue_decorators;
    var _decide_decorators;
    var _lift_decorators;
    var SanctionsController = _classThis = /** @class */ (function () {
        function SanctionsController_1(sanctions) {
            this.sanctions = (__runInitializers(this, _instanceExtraInitializers), sanctions);
        }
        SanctionsController_1.prototype.user = function (req) {
            var u = req.user;
            if (!u)
                throw new domain_errors_1.AuthUnauthenticatedError();
            return u;
        };
        /** GET /v1/sanctions/me — historique du joueur connecté. */
        SanctionsController_1.prototype.mine = function (req) {
            var u = this.user(req);
            if (!u.playerId)
                throw new domain_errors_1.AuthUnauthenticatedError();
            return this.sanctions.listForPlayer(u.playerId);
        };
        /** POST /v1/sanctions/:id/appeal — appel par le joueur sanctionné (note ≥ 10 caractères). */
        SanctionsController_1.prototype.appeal = function (req, id, body) {
            return __awaiter(this, void 0, void 0, function () {
                var u, parsed;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            u = this.user(req);
                            if (!u.playerId)
                                throw new domain_errors_1.AuthUnauthenticatedError();
                            parsed = sanctions_dto_1.AppealSanctionSchema.safeParse(body);
                            if (!parsed.success)
                                throw new domain_errors_1.ValidationError({ field: 'body', reason: parsed.error.message });
                            return [4 /*yield*/, this.sanctions.appeal(id, u.playerId, parsed.data.note)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, { ok: true }];
                    }
                });
            });
        };
        /** POST /v1/sanctions — émission (MODERATOR+, auditée via AdminService côté back-office). */
        SanctionsController_1.prototype.issue = function (req, body) {
            var u = this.user(req);
            var parsed = sanctions_dto_1.IssueSanctionSchema.safeParse(body);
            if (!parsed.success)
                throw new domain_errors_1.ValidationError({ field: 'body', reason: parsed.error.message });
            return this.sanctions.issue(__assign(__assign({}, parsed.data), { issuedById: u.userId }));
        };
        /** POST /v1/sanctions/:id/decide — UPHELD | LIFTED sur un appel (MODERATOR+). */
        SanctionsController_1.prototype.decide = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                var parsed;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            parsed = sanctions_dto_1.DecideAppealSchema.safeParse(body);
                            if (!parsed.success)
                                throw new domain_errors_1.ValidationError({ field: 'body', reason: parsed.error.message });
                            return [4 /*yield*/, this.sanctions.decideAppeal(id, parsed.data.decision)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, { ok: true }];
                    }
                });
            });
        };
        /** POST /v1/sanctions/:id/lift — levée anticipée (ADMIN). */
        SanctionsController_1.prototype.lift = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.sanctions.lift(id)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, { ok: true }];
                    }
                });
            });
        };
        return SanctionsController_1;
    }());
    __setFunctionName(_classThis, "SanctionsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _mine_decorators = [(0, common_1.Get)('me')];
        _appeal_decorators = [(0, common_1.Post)(':id/appeal'), (0, common_1.HttpCode)(200)];
        _issue_decorators = [(0, roles_decorator_1.Roles)('MODERATOR', 'ADMIN'), (0, common_1.Post)()];
        _decide_decorators = [(0, roles_decorator_1.Roles)('MODERATOR', 'ADMIN'), (0, common_1.Post)(':id/decide'), (0, common_1.HttpCode)(200)];
        _lift_decorators = [(0, roles_decorator_1.Roles)('ADMIN'), (0, common_1.Post)(':id/lift'), (0, common_1.HttpCode)(200)];
        __esDecorate(_classThis, null, _mine_decorators, { kind: "method", name: "mine", static: false, private: false, access: { has: function (obj) { return "mine" in obj; }, get: function (obj) { return obj.mine; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _appeal_decorators, { kind: "method", name: "appeal", static: false, private: false, access: { has: function (obj) { return "appeal" in obj; }, get: function (obj) { return obj.appeal; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _issue_decorators, { kind: "method", name: "issue", static: false, private: false, access: { has: function (obj) { return "issue" in obj; }, get: function (obj) { return obj.issue; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _decide_decorators, { kind: "method", name: "decide", static: false, private: false, access: { has: function (obj) { return "decide" in obj; }, get: function (obj) { return obj.decide; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _lift_decorators, { kind: "method", name: "lift", static: false, private: false, access: { has: function (obj) { return "lift" in obj; }, get: function (obj) { return obj.lift; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SanctionsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SanctionsController = _classThis;
}();
exports.SanctionsController = SanctionsController;
