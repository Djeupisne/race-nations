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
exports.HouseWalletService = void 0;
/**
 * house-wallet.service.ts — wallet HOUSE (ownerType=HOUSE, seed 0006_house_wallet).
 * Le House reçoit : houseCut de chaque settlement (INV-13), résidus de floor parimutuel
 * (INV-09), et rembourse les payouts (INV-12 : jamais de découvert House).
 * Lecture supervision ADMIN/MODERATOR ; contre-écritures (reversals) ADMIN uniquement,
 * toujours append-only via WalletRepository (INV-03/INV-06) + AdminAuditLog (INV-28).
 */
var common_1 = require("@nestjs/common");
var domain_errors_1 = require("../../common/errors/domain-errors");
var HouseWalletService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var HouseWalletService = _classThis = /** @class */ (function () {
        function HouseWalletService_1(prisma, wallet) {
            this.prisma = prisma;
            this.wallet = wallet;
        }
        /** Snapshot courant : solde HARD, escrow sortant (bets ESCROWED/RUNNING non réglés), frais cumulés. */
        HouseWalletService_1.prototype.getSnapshot = function () {
            return __awaiter(this, void 0, void 0, function () {
                var houseWalletId, balances, escrowOutstanding, feesAgg;
                var _a, _b, _c, _d, _e, _f;
                return __generator(this, function (_g) {
                    switch (_g.label) {
                        case 0: return [4 /*yield*/, this.wallet.getHouseWalletId()];
                        case 1:
                            houseWalletId = _g.sent();
                            return [4 /*yield*/, this.wallet.getBalances(houseWalletId)];
                        case 2:
                            balances = _g.sent();
                            return [4 /*yield*/, this.prisma.bet.aggregate({
                                    _sum: { stake: true },
                                    where: { status: { in: ['ESCROWED', 'RUNNING'] }, market: { currency: 'HARD' } },
                                })];
                        case 3:
                            escrowOutstanding = _g.sent();
                            return [4 /*yield*/, this.prisma.betSettlement.aggregate({
                                    _sum: { houseCut: true, residual: true },
                                })];
                        case 4:
                            feesAgg = _g.sent();
                            return [2 /*return*/, {
                                    hardCents: balances.hardCents,
                                    escrowOutstandingCents: (_a = escrowOutstanding._sum.stake) !== null && _a !== void 0 ? _a : 0,
                                    cumulativeFeesCents: ((_b = feesAgg._sum.houseCut) !== null && _b !== void 0 ? _b : 0) + ((_c = feesAgg._sum.residual) !== null && _c !== void 0 ? _c : 0),
                                    liabilitiesCents: ((_d = escrowOutstanding._sum.stake) !== null && _d !== void 0 ? _d : 0) - (((_e = feesAgg._sum.houseCut) !== null && _e !== void 0 ? _e : 0) + ((_f = feesAgg._sum.residual) !== null && _f !== void 0 ? _f : 0)),
                                }];
                    }
                });
            });
        };
        /** Historique du ledger House (append-only) — pagination simple par curseur date. */
        HouseWalletService_1.prototype.listTransactions = function (params) {
            return __awaiter(this, void 0, void 0, function () {
                var houseWalletId;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.wallet.getHouseWalletId()];
                        case 1:
                            houseWalletId = _b.sent();
                            return [2 /*return*/, this.prisma.walletTransaction.findMany({
                                    where: __assign({ walletId: houseWalletId }, (params.before ? { createdAt: { lt: params.before } } : {})),
                                    orderBy: { createdAt: 'desc' },
                                    take: Math.min((_a = params.limit) !== null && _a !== void 0 ? _a : 100, 500),
                                    select: {
                                        id: true, type: true, currencyKind: true, amountSigned: true,
                                        balanceAfter: true, idempotencyKey: true, refType: true, refId: true, createdAt: true,
                                    },
                                })];
                    }
                });
            });
        };
        /**
         * Contre-écriture d'un mouvement House (INCIDENT seulement — ex. settlement erroné
         * confirmé). Append-only : on n'efface rien, on ajoute HOUSE_REVERSAL qui référence
         * la tx d'origine (INV-06). L'audit admin est écrit par AdminService avant cet appel.
         */
        HouseWalletService_1.prototype.reverseTransaction = function (params) {
            return __awaiter(this, void 0, void 0, function () {
                var original, houseWalletId, already, reversal;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!params.reason || params.reason.trim().length < 10) {
                                throw new domain_errors_1.ValidationError({ field: 'reason', reason: 'Reversal requires a documented reason (>= 10 chars).' });
                            }
                            return [4 /*yield*/, this.prisma.walletTransaction.findUnique({ where: { id: params.originalTxId } })];
                        case 1:
                            original = _a.sent();
                            if (!original)
                                throw new domain_errors_1.NotFoundError('WalletTransaction', params.originalTxId);
                            return [4 /*yield*/, this.wallet.getHouseWalletId()];
                        case 2:
                            houseWalletId = _a.sent();
                            if (original.walletId !== houseWalletId) {
                                throw new domain_errors_1.ValidationError({ field: 'originalTxId', reason: 'Not a House ledger entry.' });
                            }
                            return [4 /*yield*/, this.prisma.walletTransaction.findFirst({
                                    where: { reversalOfId: original.id },
                                    select: { id: true },
                                })];
                        case 3:
                            already = _a.sent();
                            if (already)
                                return [2 /*return*/, { reversalTxId: already.id }]; // idempotent (INV-04)
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var amount, column;
                                    return __generator(this, function (_a) {
                                        amount = Math.abs(original.amountSigned);
                                        column = original.currencyKind === "CREDITS" ? "credits"
                                            : original.currencyKind === 'GEMS' ? 'gems'
                                                : original.currencyKind === 'TOKENS' ? 'tokens'
                                                    : 'hardCents';
                                        if (original.amountSigned > 0) {
                                            // La tx d'origine créditait le House → on débite (jamais de découvert House implicite :
                                            // InsufficientFundsError remonte = incident à traiter manuellement, INV-02).
                                            return [2 /*return*/, this.wallet.debit(tx, {
                                                    walletId: houseWalletId,
                                                    column: column,
                                                    amount: amount,
                                                    type: 'REVERSAL',
                                                    idempotencyKey: "house-reversal:".concat(original.id),
                                                    refType: 'WALLET_TX',
                                                    refId: original.id,
                                                })];
                                        }
                                        return [2 /*return*/, this.wallet.credit(tx, {
                                                walletId: houseWalletId,
                                                column: column,
                                                amount: amount,
                                                type: 'HOUSE_REVERSAL',
                                                idempotencyKey: "house-reversal:".concat(original.id),
                                                refType: 'WALLET_TX',
                                                refId: original.id,
                                                reversalOfId: original.id,
                                            })];
                                    });
                                }); })];
                        case 4:
                            reversal = _a.sent();
                            return [2 /*return*/, { reversalTxId: reversal.id }];
                    }
                });
            });
        };
        /** Derniers snapshots quotidiens (réconciliation comptable, observability.md §8). */
        HouseWalletService_1.prototype.listSnapshots = function () {
            return __awaiter(this, arguments, void 0, function (days) {
                if (days === void 0) { days = 30; }
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.houseBalanceSnapshot.findMany({
                            orderBy: { day: 'desc' },
                            take: Math.min(days, 365),
                        })];
                });
            });
        };
        return HouseWalletService_1;
    }());
    __setFunctionName(_classThis, "HouseWalletService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        HouseWalletService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return HouseWalletService = _classThis;
}();
exports.HouseWalletService = HouseWalletService;
