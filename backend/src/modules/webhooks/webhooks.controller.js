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
exports.WebhooksController = void 0;
/**
 * webhooks.controller.ts — endpoints publics SIGNÉS (INV-26) : /api/v1/webhooks/*.
 * Pas de JWT : l'auth est la signature provider vérifiée par le verifier enregistré.
 * Réponse toujours 2xx rapide (le provider retry sinon) ; le résultat métier est dans le corps.
 * rawBody est requis pour les HMAC : main.ts configure json({ verify }) qui le pose.
 */
var common_1 = require("@nestjs/common");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var roles_guard_1 = require("../../common/guards/roles.guard");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var common_2 = require("@nestjs/common");
var WebhooksController = function () {
    var _classDecorators = [(0, common_1.Controller)('webhooks')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _stripe_decorators;
    var _flutterwave_decorators;
    var _googlePlay_decorators;
    var _apple_decorators;
    var _huawei_decorators;
    var _recent_decorators;
    var _echo_decorators;
    var WebhooksController = _classThis = /** @class */ (function () {
        function WebhooksController_1(webhooks) {
            this.webhooks = (__runInitializers(this, _instanceExtraInitializers), webhooks);
        }
        /** POST /webhooks/stripe — payment_intent.* (Stripe-Signature t=,v1=). */
        WebhooksController_1.prototype.stripe = function (req, res) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    res.status(200);
                    return [2 /*return*/, this.webhooks.ingest('/webhooks/stripe', req)];
                });
            });
        };
        /** POST /webhooks/flutterwave — verif-hash. */
        WebhooksController_1.prototype.flutterwave = function (req) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.webhooks.ingest('/webhooks/flutterwave', req)];
                });
            });
        };
        /** POST /webhooks/google-play — RTDN Pub/Sub push. */
        WebhooksController_1.prototype.googlePlay = function (req) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.webhooks.ingest('/webhooks/google-play', req)];
                });
            });
        };
        /** POST /webhooks/apple — App Store Server Notifications V2. */
        WebhooksController_1.prototype.apple = function (req) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.webhooks.ingest('/webhooks/apple', req)];
                });
            });
        };
        /** POST /webhooks/huawei — HM IAP notifications. */
        WebhooksController_1.prototype.huawei = function (req) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.webhooks.ingest('/webhooks/huawei', req)];
                });
            });
        };
        /** GET /webhooks/recent — supervision back-office (MODERATOR+), jamais exposé aux joueurs. */
        WebhooksController_1.prototype.recent = function (provider, limit) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.webhooks.recent(provider, Number.parseInt(limit !== null && limit !== void 0 ? limit : '50', 10) || 50)];
                });
            });
        };
        /** Utilisé par les tests e2e : renvoie simplement le body reçu (sanity raw pipeline). */
        WebhooksController_1.prototype.echo = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, { received: body !== undefined && body !== null }];
                });
            });
        };
        return WebhooksController_1;
    }());
    __setFunctionName(_classThis, "WebhooksController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _stripe_decorators = [(0, jwt_auth_guard_1.Public)(), (0, common_1.Post)('stripe')];
        _flutterwave_decorators = [(0, jwt_auth_guard_1.Public)(), (0, common_1.Post)('flutterwave')];
        _googlePlay_decorators = [(0, jwt_auth_guard_1.Public)(), (0, common_1.Post)('google-play')];
        _apple_decorators = [(0, jwt_auth_guard_1.Public)(), (0, common_1.Post)('apple')];
        _huawei_decorators = [(0, jwt_auth_guard_1.Public)(), (0, common_1.Post)('huawei')];
        _recent_decorators = [(0, common_2.UseGuards)(roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)('MODERATOR', 'ADMIN'), (0, common_1.Get)('recent')];
        _echo_decorators = [(0, jwt_auth_guard_1.Public)(), (0, common_1.Post)('_echo')];
        __esDecorate(_classThis, null, _stripe_decorators, { kind: "method", name: "stripe", static: false, private: false, access: { has: function (obj) { return "stripe" in obj; }, get: function (obj) { return obj.stripe; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _flutterwave_decorators, { kind: "method", name: "flutterwave", static: false, private: false, access: { has: function (obj) { return "flutterwave" in obj; }, get: function (obj) { return obj.flutterwave; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _googlePlay_decorators, { kind: "method", name: "googlePlay", static: false, private: false, access: { has: function (obj) { return "googlePlay" in obj; }, get: function (obj) { return obj.googlePlay; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _apple_decorators, { kind: "method", name: "apple", static: false, private: false, access: { has: function (obj) { return "apple" in obj; }, get: function (obj) { return obj.apple; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _huawei_decorators, { kind: "method", name: "huawei", static: false, private: false, access: { has: function (obj) { return "huawei" in obj; }, get: function (obj) { return obj.huawei; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _recent_decorators, { kind: "method", name: "recent", static: false, private: false, access: { has: function (obj) { return "recent" in obj; }, get: function (obj) { return obj.recent; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _echo_decorators, { kind: "method", name: "echo", static: false, private: false, access: { has: function (obj) { return "echo" in obj; }, get: function (obj) { return obj.echo; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WebhooksController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WebhooksController = _classThis;
}();
exports.WebhooksController = WebhooksController;
