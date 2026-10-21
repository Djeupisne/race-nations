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
exports.WalletController = void 0;
/**
 * wallet.controller.ts — routes /api/v1/wallet (docs/api.md §6).
 * - GET balances + GET transactions : lecture pure, JWT requis.
 * - POST purchase : mutation monétaire → IdempotencyGuard OBLIGATOIRE (header
 *   `Idempotency-Key`, INV-04) + OwnershipGuard (INV-28) + rate-limit fail-closed.
 * - Aucun endpoint n'accepte un montant "à créditer" venant du client : les débits
 *   sont calculés serveur-side à partir de refs produits/tickets (anti-injection de prix).
 */
var common_1 = require("@nestjs/common");
var zod_1 = require("zod");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var ownership_guard_1 = require("../../common/guards/ownership.guard");
var idempotency_guard_1 = require("../../common/guards/idempotency.guard");
var rate_limit_guard_1 = require("../../common/guards/rate-limit.guard");
/** Achat d'un item boutique / ticket par RÉFÉRENCE serveur (le prix vient du catalogue DB). */
var PurchaseInputSchema = zod_1.z
    .object({
    itemRef: zod_1.z.string().min(1).max(64), // ex. "ticket:matchday", "skin:neon-lagos"
    quantity: zod_1.z.number().int().min(1).max(10).default(1),
})
    .strict();
var WalletController = function () {
    var _classDecorators = [(0, common_1.Controller)('wallet'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _balances_decorators;
    var _transactions_decorators;
    var _purchase_decorators;
    var WalletController = _classThis = /** @class */ (function () {
        function WalletController_1(wallet) {
            this.wallet = (__runInitializers(this, _instanceExtraInitializers), wallet);
        }
        /** GET /wallet/balances — `{ credits, gems, tokens, hardCents }` entiers (INV-01/02/07). */
        WalletController_1.prototype.balances = function (user) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.wallet.balances(user.playerId)];
                });
            });
        };
        /** GET /wallet/transactions — ledger append-only paginé (INV-06). */
        WalletController_1.prototype.transactions = function (user, query) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.wallet.transactions(user.playerId, query)];
                });
            });
        };
        /**
         * POST /wallet/purchase — débit SOFT idempotent. Clé client obligatoire (guard) ;
         * la clé ledger finale est dérivée `purchase:<playerKey>:<itemRef>` côté service pour
         * coller à l'UNIQUE DB même si le client rejoue avec une autre clé (protection double achat).
         */
        WalletController_1.prototype.purchase = function (user, input, req) {
            return __awaiter(this, void 0, void 0, function () {
                var catalogPrice;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.priceOf(input.itemRef)];
                        case 1:
                            catalogPrice = _b.sent();
                            return [2 /*return*/, this.wallet.purchase(user.playerId, {
                                    column: catalogPrice.column,
                                    amount: catalogPrice.amount * input.quantity,
                                    itemRef: "".concat(input.itemRef, "#x").concat(input.quantity),
                                    idempotencyKey: (_a = req.idempotencyKey) !== null && _a !== void 0 ? _a : "purchase:".concat(user.playerId, ":").concat(req.headers['idempotency-key']),
                                })];
                    }
                });
            });
        };
        /** Prix catalogue serveur (phase 2 : table ShopItem ; ici refs stables codées, single source). */
        WalletController_1.prototype.priceOf = function (itemRef) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (itemRef) {
                        case 'ticket:tournament': return [2 /*return*/, { column: 'credits', amount: 500 }];
                        case 'ticket:matchday': return [2 /*return*/, { column: 'credits', amount: 500 }];
                        case 'ticket:clan-wars': return [2 /*return*/, { column: 'credits', amount: 500 }];
                        case 'ticket:premium': return [2 /*return*/, { column: 'gems', amount: 10 }];
                        default:
                            throw Object.assign(new Error("Unknown catalog item: ".concat(itemRef)), { status: 404 });
                    }
                    return [2 /*return*/];
                });
            });
        };
        return WalletController_1;
    }());
    __setFunctionName(_classThis, "WalletController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _balances_decorators = [(0, common_1.Get)('balances')];
        _transactions_decorators = [(0, common_1.Get)('transactions')];
        _purchase_decorators = [(0, common_1.Post)('purchase'), (0, common_1.UseGuards)(idempotency_guard_1.IdempotencyGuard, ownership_guard_1.OwnershipGuard, rate_limit_guard_1.RateLimitGuard), (0, rate_limit_guard_1.rateLimit)({ bucket: 'wallet.purchase', limit: 30, windowMs: 60000, failClosed: true })];
        __esDecorate(_classThis, null, _balances_decorators, { kind: "method", name: "balances", static: false, private: false, access: { has: function (obj) { return "balances" in obj; }, get: function (obj) { return obj.balances; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _transactions_decorators, { kind: "method", name: "transactions", static: false, private: false, access: { has: function (obj) { return "transactions" in obj; }, get: function (obj) { return obj.transactions; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _purchase_decorators, { kind: "method", name: "purchase", static: false, private: false, access: { has: function (obj) { return "purchase" in obj; }, get: function (obj) { return obj.purchase; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WalletController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WalletController = _classThis;
}();
exports.WalletController = WalletController;
