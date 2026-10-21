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
exports.WalletService = void 0;
/**
 * wallet.service.ts — façade applicative du wallet joueur (docs/api.md §6).
 * Toutes les écritures monétaires délèguent à WalletRepository (INV-03) ; ce service
 * n'écrit JAMAIS une colonne de balance lui-même. Rôles :
 *  - balances / ledger paginé en lecture (sorties entières, jamais négatives — INV-02),
 *  - crédit récompenses de course (REWARD, clés dérivées `reward:<matchId>:<playerId>` → idempotent INV-04),
 *  - achat boutique/tickets (PURCHASE via repository, prix entiers serveur-side — jamais le client),
 *  - ajustements admin tracés audit (ADMIN_ADJUSTMENT + AdminAuditLog par l'appelant).
 */
var common_1 = require("@nestjs/common");
var transactional_decorator_1 = require("../../common/decorators/transactional.decorator");
var domain_errors_1 = require("../../common/errors/domain-errors");
var idempotency_guard_1 = require("../../common/guards/idempotency.guard");
var WalletService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _creditRaceRewards_decorators;
    var _purchase_decorators;
    var _adminAdjust_decorators;
    var WalletService = _classThis = /** @class */ (function () {
        function WalletService_1(prisma, repo, clock) {
            this.prisma = (__runInitializers(this, _instanceExtraInitializers), prisma);
            this.repo = repo;
            this.clock = clock;
        }
        /** GET /wallet/balances — `{ credits, gems, tokens, hardCents }` entiers (INV-01/02/07). */
        WalletService_1.prototype.balances = function (playerId) {
            return __awaiter(this, void 0, void 0, function () {
                var wallet;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getWalletOf(playerId)];
                        case 1:
                            wallet = _a.sent();
                            return [2 /*return*/, {
                                    credits: wallet.credits,
                                    gems: wallet.gems,
                                    tokens: wallet.tokens,
                                    hardCents: wallet.hardCents,
                                }];
                    }
                });
            });
        };
        /** GET /wallet/transactions — ledger append-only paginé (INV-06), plus récent d'abord. */
        WalletService_1.prototype.transactions = function (playerId, query) {
            return __awaiter(this, void 0, void 0, function () {
                var wallet, rows, items;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getWalletOf(playerId)];
                        case 1:
                            wallet = _c.sent();
                            return [4 /*yield*/, this.prisma.walletTransaction.findMany({
                                    where: __assign({ walletId: wallet.id }, (query.cursor ? { id: { lt: query.cursor } } : {})),
                                    orderBy: { createdAt: 'desc' },
                                    take: query.limit + 1,
                                    select: {
                                        id: true, type: true, currencyKind: true, amountSigned: true, balanceAfter: true,
                                        refType: true, refId: true, reversalOfId: true, createdAt: true,
                                    },
                                })];
                        case 2:
                            rows = _c.sent();
                            items = rows.slice(0, query.limit);
                            return [2 /*return*/, {
                                    items: items.map(function (t) { return (__assign(__assign({}, t), { createdAt: t.createdAt.toISOString() })); }),
                                    nextCursor: rows.length > query.limit ? (_b = (_a = items[items.length - 1]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null : null,
                                }];
                    }
                });
            });
        };
        /**
         * Crédit des récompenses d'une course VALIDÉE (INV-25/32) — un appel par (match, joueur).
         * Clé dérivée `reward:<matchId>:<playerId>` : rejouer le settlement ne double-paie jamais (INV-04).
         * Les colonnes SOFT sont créditées séparément (credits puis tokens) — chaque ligne a sa propre clé.
         */
        WalletService_1.prototype.creditRaceRewards = function (playerId, matchId, rewards) {
            return __awaiter(this, void 0, void 0, function () {
                var walletId;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.repo.getOrCreatePlayerWallet(this.prisma, playerId)];
                        case 1:
                            walletId = _a.sent();
                            if (!(rewards.credits > 0)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.repo.credit(this.prisma, {
                                    walletId: walletId,
                                    column: 'credits',
                                    amount: rewards.credits,
                                    type: 'REWARD',
                                    idempotencyKey: "reward:".concat(matchId, ":").concat(playerId, ":credits"),
                                    refType: 'MATCH',
                                    refId: matchId,
                                })];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3:
                            if (!(rewards.gems > 0)) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.repo.credit(this.prisma, {
                                    walletId: walletId,
                                    column: 'gems',
                                    amount: rewards.gems,
                                    type: 'REWARD',
                                    idempotencyKey: "reward:".concat(matchId, ":").concat(playerId, ":gems"),
                                    refType: 'MATCH',
                                    refId: matchId,
                                })];
                        case 4:
                            _a.sent();
                            _a.label = 5;
                        case 5:
                            if (!(rewards.tokens > 0)) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.repo.credit(this.prisma, {
                                    walletId: walletId,
                                    column: 'tokens',
                                    amount: rewards.tokens,
                                    type: 'REWARD',
                                    idempotencyKey: "reward:".concat(matchId, ":").concat(playerId, ":tokens"),
                                    refType: 'MATCH',
                                    refId: matchId,
                                })];
                        case 6:
                            _a.sent();
                            _a.label = 7;
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Dépôt HARD crédité par le webhook paiement (webhooks.service) — appelé avec la clé
         * `deposit:<paymentId>` (dérivation INV-04). Transactionnel côté appelant.
         */
        WalletService_1.prototype.creditDeposit = function (tx, playerId, amountCents, paymentId) {
            return __awaiter(this, void 0, void 0, function () {
                var walletId;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.repo.getOrCreatePlayerWallet(tx, playerId)];
                        case 1:
                            walletId = _a.sent();
                            return [2 /*return*/, this.repo.credit(tx, {
                                    walletId: walletId,
                                    column: 'hardCents',
                                    amount: amountCents,
                                    type: 'DEPOSIT',
                                    idempotencyKey: (0, idempotency_guard_1.deriveLedgerKey)('deposit', paymentId),
                                    refType: 'PAYMENT',
                                    refId: paymentId,
                                })];
                    }
                });
            });
        };
        /** Achat SOFT générique (boutique/tickets — api.md §6) : débit PURCHASE idempotent par key client. */
        WalletService_1.prototype.purchase = function (playerId, params) {
            return __awaiter(this, void 0, void 0, function () {
                var walletId, txRow;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            assertPositiveInt(params.amount);
                            return [4 /*yield*/, this.repo.getOrCreatePlayerWallet(this.prisma, playerId)];
                        case 1:
                            walletId = _a.sent();
                            return [4 /*yield*/, this.repo.debit(this.prisma, {
                                    walletId: walletId,
                                    column: params.column,
                                    amount: params.amount,
                                    type: 'PURCHASE',
                                    idempotencyKey: params.idempotencyKey,
                                    refType: 'SHOP_ITEM',
                                    refId: params.itemRef,
                                })];
                        case 2:
                            txRow = _a.sent();
                            return [2 /*return*/, { transactionId: txRow.id, balanceAfter: txRow.balanceAfter }];
                    }
                });
            });
        };
        /** Ajustement ADMIN tracé (le contrôleur journalise AdminAuditLog AVANT/AFTER — INV-28/29). */
        WalletService_1.prototype.adminAdjust = function (playerId, params) {
            return __awaiter(this, void 0, void 0, function () {
                var walletId;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!Number.isInteger(params.deltaSigned) || params.deltaSigned === 0) {
                                throw new domain_errors_1.ValidationError({ field: 'deltaSigned', reason: 'Non-zero integer required.' });
                            }
                            return [4 /*yield*/, this.repo.getOrCreatePlayerWallet(this.prisma, playerId)];
                        case 1:
                            walletId = _a.sent();
                            return [2 /*return*/, params.deltaSigned > 0
                                    ? this.repo.credit(this.prisma, {
                                        walletId: walletId,
                                        column: params.column,
                                        amount: params.deltaSigned,
                                        type: 'ADMIN_ADJUSTMENT',
                                        idempotencyKey: params.idempotencyKey,
                                        refType: 'ADMIN',
                                        refId: params.reason.slice(0, 64),
                                    })
                                    : this.repo.debit(this.prisma, {
                                        walletId: walletId,
                                        column: params.column,
                                        amount: -params.deltaSigned,
                                        type: 'ADMIN_ADJUSTMENT',
                                        idempotencyKey: params.idempotencyKey,
                                        refType: 'ADMIN',
                                        refId: params.reason.slice(0, 64),
                                    })];
                    }
                });
            });
        };
        /* --------------------------------- Interne -------------------------------- */
        WalletService_1.prototype.getWalletOf = function (playerId) {
            return __awaiter(this, void 0, void 0, function () {
                var wallet;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.wallet.findUnique({ where: { playerId: playerId } })];
                        case 1:
                            wallet = _a.sent();
                            if (!wallet)
                                throw new domain_errors_1.NotFoundError('Wallet', playerId);
                            return [2 /*return*/, wallet];
                    }
                });
            });
        };
        return WalletService_1;
    }());
    __setFunctionName(_classThis, "WalletService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _creditRaceRewards_decorators = [(0, transactional_decorator_1.Transactional)()];
        _purchase_decorators = [(0, transactional_decorator_1.Transactional)()];
        _adminAdjust_decorators = [(0, transactional_decorator_1.Transactional)()];
        __esDecorate(_classThis, null, _creditRaceRewards_decorators, { kind: "method", name: "creditRaceRewards", static: false, private: false, access: { has: function (obj) { return "creditRaceRewards" in obj; }, get: function (obj) { return obj.creditRaceRewards; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _purchase_decorators, { kind: "method", name: "purchase", static: false, private: false, access: { has: function (obj) { return "purchase" in obj; }, get: function (obj) { return obj.purchase; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _adminAdjust_decorators, { kind: "method", name: "adminAdjust", static: false, private: false, access: { has: function (obj) { return "adminAdjust" in obj; }, get: function (obj) { return obj.adminAdjust; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WalletService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WalletService = _classThis;
}();
exports.WalletService = WalletService;
function assertPositiveInt(n) {
    if (!Number.isInteger(n) || n <= 0)
        throw new domain_errors_1.ValidationError({ field: 'amount', reason: 'Positive integer required (INV-01).' });
}
