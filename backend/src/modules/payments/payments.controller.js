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
exports.PaymentsController = void 0;
/**
 * payments.controller.ts — routes /api/v1/payments (docs/api.md §7).
 * - POST /checkout : mutation monétaire → JwtAuthGuard + OwnershipGuard + IdempotencyGuard
 *   (header obligatoire) + rate-limit fail-closed (money route).
 * - La juridiction est dérivée SERVEUR du profil joueur (countryCode), jamais du client
 *   (anti-contournement des plafonds LCB/FT, INV-20).
 * - Aucun endpoint de "crédit" côté client : seul le webhook signe le SUCCEEDED.
 */
var common_1 = require("@nestjs/common");
var zod_1 = require("zod");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var ownership_guard_1 = require("../../common/guards/ownership.guard");
var idempotency_guard_1 = require("../../common/guards/idempotency.guard");
var rate_limit_guard_1 = require("../../common/guards/rate-limit.guard");
var domain_errors_1 = require("../../common/errors/domain-errors");
var CheckoutInputSchema = zod_1.z
    .object({
    amountCents: zod_1.z.number().int().positive(),
    currencyCode: zod_1.z.enum(['EUR', 'NGN', 'MAD', 'GHS', 'KES']).default('EUR'),
    provider: zod_1.z.enum(['STRIPE', 'FLUTTERWAVE']),
})
    .strict();
var PaymentsController = function () {
    var _classDecorators = [(0, common_1.Controller)('payments'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _checkout_decorators;
    var _list_decorators;
    var _status_decorators;
    var PaymentsController = _classThis = /** @class */ (function () {
        function PaymentsController_1(payments, prisma) {
            this.payments = (__runInitializers(this, _instanceExtraInitializers), payments);
            this.prisma = prisma;
        }
        /** POST /payments/checkout — { paymentId, checkoutUrl, status }. 4xx enveloppe standard. */
        PaymentsController_1.prototype.checkout = function (user, input, req) {
            return __awaiter(this, void 0, void 0, function () {
                var player, key;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.player.findUnique({
                                where: { id: user.playerId },
                                select: { countryCode: true },
                            })];
                        case 1:
                            player = _a.sent();
                            if (!player)
                                throw new domain_errors_1.NotFoundError('Player', user.playerId);
                            key = req.idempotencyKey;
                            if (!key)
                                throw new domain_errors_1.ValidationError({ field: 'Idempotency-Key', reason: 'Missing after guard.' });
                            return [2 /*return*/, this.payments.createCheckout({
                                    playerId: user.playerId,
                                    amountCents: input.amountCents,
                                    currencyCode: input.currencyCode,
                                    jurisdiction: player.countryCode,
                                    provider: input.provider,
                                    idempotencyKey: key,
                                })];
                    }
                });
            });
        };
        /** GET /payments — historique paginé. */
        PaymentsController_1.prototype.list = function (user, query) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.payments.listForPlayer(user.playerId, query)];
                });
            });
        };
        /** GET /payments/:id — statut d'un paiement DU JOUEUR (OwnershipGuard, INV-28). */
        PaymentsController_1.prototype.status = function (user, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.payments.getStatus(user.playerId, id)];
                });
            });
        };
        return PaymentsController_1;
    }());
    __setFunctionName(_classThis, "PaymentsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _checkout_decorators = [(0, common_1.Post)('checkout'), (0, common_1.UseGuards)(idempotency_guard_1.IdempotencyGuard, rate_limit_guard_1.RateLimitGuard), (0, rate_limit_guard_1.rateLimit)({ bucket: 'money-write', points: 5, durationMs: 60000, failClosed: true })];
        _list_decorators = [(0, common_1.Get)()];
        _status_decorators = [(0, common_1.Get)(':id'), (0, common_1.UseGuards)(ownership_guard_1.OwnershipGuard)];
        __esDecorate(_classThis, null, _checkout_decorators, { kind: "method", name: "checkout", static: false, private: false, access: { has: function (obj) { return "checkout" in obj; }, get: function (obj) { return obj.checkout; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: function (obj) { return "list" in obj; }, get: function (obj) { return obj.list; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _status_decorators, { kind: "method", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PaymentsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PaymentsController = _classThis;
}();
exports.PaymentsController = PaymentsController;
