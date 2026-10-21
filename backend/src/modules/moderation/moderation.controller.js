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
exports.ModerationController = void 0;
/**
 * moderation.controller.ts — routes MODERATOR+ (docs/api.md §9, docs/moderation.md).
 * Lecture file de reports + test de filtre ; les actions disciplinaires vivent dans
 * SanctionsController/AdminController (une seule voie d'écriture par prérogative).
 */
var common_1 = require("@nestjs/common");
var moderation_dto_1 = require("./moderation.dto");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var domain_errors_1 = require("../../common/errors/domain-errors");
var ModerationController = function () {
    var _classDecorators = [(0, roles_decorator_1.Roles)('MODERATOR', 'ADMIN'), (0, common_1.Controller)('v1/moderation')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _queue_decorators;
    var _detail_decorators;
    var _dismiss_decorators;
    var _filterTest_decorators;
    var ModerationController = _classThis = /** @class */ (function () {
        function ModerationController_1(moderation, audit) {
            this.moderation = (__runInitializers(this, _instanceExtraInitializers), moderation);
            this.audit = audit;
        }
        /** GET /v1/moderation/reports?limit= — file anti-triche (payloads invalides). */
        ModerationController_1.prototype.queue = function (query) {
            var parsed = moderation_dto_1.ModerationQueueQuerySchema.safeParse(query);
            if (!parsed.success)
                throw new domain_errors_1.ValidationError({ field: 'query', reason: parsed.error.message });
            return this.moderation.queue(parsed.data.limit);
        };
        /** GET /v1/moderation/reports/:id — détail d'un report. */
        ModerationController_1.prototype.detail = function (id) {
            return this.moderation.reportDetail(id);
        };
        /** POST /v1/moderation/reports/:id/dismiss — clôture sans suite, AUDITÉE (INV-28). */
        ModerationController_1.prototype.dismiss = function (req, id, body) {
            return __awaiter(this, void 0, void 0, function () {
                var parsed;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            parsed = moderation_dto_1.DismissReportSchema.safeParse(body);
                            if (!parsed.success)
                                throw new domain_errors_1.ValidationError({ field: 'body', reason: parsed.error.message });
                            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId))
                                throw new domain_errors_1.AuthUnauthenticatedError();
                            return [4 /*yield*/, this.moderation.dismissReport(id, parsed.data.note)];
                        case 1:
                            _c.sent();
                            return [4 /*yield*/, this.audit.record({
                                    actorUserId: req.user.userId,
                                    action: 'REPORT_DISMISS',
                                    targetType: 'ResultPayload',
                                    targetId: id,
                                    metadata: { note: parsed.data.note },
                                    requestId: (_b = req.headers['x-request-id']) !== null && _b !== void 0 ? _b : 'unknown',
                                })];
                        case 2:
                            _c.sent();
                            return [2 /*return*/, { ok: true }];
                    }
                });
            });
        };
        /** POST /v1/moderation/filter-test — outil interne : verdict du lexique. */
        ModerationController_1.prototype.filterTest = function (body) {
            var parsed = moderation_dto_1.FilterTextSchema.safeParse(body);
            if (!parsed.success)
                throw new domain_errors_1.ValidationError({ field: 'body', reason: parsed.error.message });
            return this.moderation.filterText(parsed.data.text);
        };
        return ModerationController_1;
    }());
    __setFunctionName(_classThis, "ModerationController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _queue_decorators = [(0, common_1.Get)('reports')];
        _detail_decorators = [(0, common_1.Get)('reports/:id')];
        _dismiss_decorators = [(0, common_1.Post)('reports/:id/dismiss'), (0, common_1.HttpCode)(200)];
        _filterTest_decorators = [(0, common_1.Post)('filter-test')];
        __esDecorate(_classThis, null, _queue_decorators, { kind: "method", name: "queue", static: false, private: false, access: { has: function (obj) { return "queue" in obj; }, get: function (obj) { return obj.queue; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _detail_decorators, { kind: "method", name: "detail", static: false, private: false, access: { has: function (obj) { return "detail" in obj; }, get: function (obj) { return obj.detail; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _dismiss_decorators, { kind: "method", name: "dismiss", static: false, private: false, access: { has: function (obj) { return "dismiss" in obj; }, get: function (obj) { return obj.dismiss; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _filterTest_decorators, { kind: "method", name: "filterTest", static: false, private: false, access: { has: function (obj) { return "filterTest" in obj; }, get: function (obj) { return obj.filterTest; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ModerationController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ModerationController = _classThis;
}();
exports.ModerationController = ModerationController;
