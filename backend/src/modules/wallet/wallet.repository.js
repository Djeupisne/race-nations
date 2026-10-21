"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
exports.WalletRepository = void 0;
/**
 * wallet.repository.ts — LA SEULE porte d'entrée des mouvements d'argent (INV-03).
 * Aucun service ne touche les colonnes monétaires directement : tout débit/crédit passe ici.
 *
 * Protocole d'un mouvement (obligatoire, dans une transaction interactive Prisma) :
 *   1. `SELECT … FOR UPDATE` sur la ligne du wallet → verrou pessimiste de rangée ;
 *   2. contrôle solde ≥ montant débité sinon rollback + InsufficientFundsError (INV-02) ;
 *   3. UPDATE de la colonne concernée UNIQUEMENT (credits|gems|tokens|hardCents) —
 *      jamais de mélange SOFT/HARD dans un même règlement (INV-07) ;
 *   4. INSERT append-only d'une WalletTransaction (amountSigned, balanceAfter,
 *      idempotencyKey UNIQUE — INV-04/INV-06).
 *
 * Idempotence : si `idempotencyKey` existe déjà → RETOUR DE LA LIGNE EXISTANTE sans
 * nouveau mouvement (rejouer = réponse originale, INV-04). La contrainte DB reste le
 * dernier rempart contre la race (P2002 → relecture).
 */
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var domain_errors_1 = require("../../common/errors/domain-errors");
var WALLET_COLUMNS = new Set(['credits', 'gems', 'tokens', 'hardCents']);
var WalletRepository = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var WalletRepository = _classThis = /** @class */ (function () {
        function WalletRepository_1(prisma) {
            this.prisma = prisma;
        }
        /** Verrou de rangée SELECT … FOR UPDATE (à l'intérieur d'une tx interactive). */
        WalletRepository_1.prototype.lockWallet = function (tx, walletId) {
            return __awaiter(this, void 0, void 0, function () {
                var rows, wallet;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, tx.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      SELECT id, credits, gems, tokens, \"hardCents\"\n      FROM wallets\n      WHERE id = ", "::uuid\n      FOR UPDATE\n    "], ["\n      SELECT id, credits, gems, tokens, \"hardCents\"\n      FROM wallets\n      WHERE id = ", "::uuid\n      FOR UPDATE\n    "])), walletId)];
                        case 1:
                            rows = _a.sent();
                            wallet = rows[0];
                            if (!wallet)
                                throw new domain_errors_1.NotFoundError('Wallet', walletId);
                            return [2 /*return*/, wallet];
                    }
                });
            });
        };
        /** Lecture idempotencyKey AVANT toute écriture — rejouer renvoie la ligne d'origine (INV-04). */
        WalletRepository_1.prototype.findTxByIdempotencyKey = function (idempotencyKey) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.walletTransaction.findUnique({ where: { idempotencyKey: idempotencyKey } })];
                });
            });
        };
        /**
         * DÉBIT atomique : lock → contrôle solde → UPDATE -= amount → ledger (amountSigned < 0).
         * `tx` DOIT être un client transactionnel (le @Transactional des services le fournit).
         */
        WalletRepository_1.prototype.debit = function (tx, params) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, wallet, before, after;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            assertAmount(params.amount);
                            assertColumn(params.column);
                            return [4 /*yield*/, tx.walletTransaction.findUnique({ where: { idempotencyKey: params.idempotencyKey } })];
                        case 1:
                            existing = _b.sent();
                            if (existing)
                                return [2 /*return*/, existing]; // replay → ligne originale, aucun second mouvement (INV-04)
                            return [4 /*yield*/, this.lockWallet(tx, params.walletId)];
                        case 2:
                            wallet = _b.sent();
                            before = wallet[params.column];
                            if (before < params.amount) {
                                // Rollback implicite : l'appelant sort de la tx par l'exception → aucune écriture partielle.
                                throw new domain_errors_1.InsufficientFundsError(params.column === 'hardCents' ? 'HARD' : 'SOFT', params.amount, before);
                            }
                            after = before - params.amount;
                            return [4 /*yield*/, tx.wallet.update({ where: { id: params.walletId }, data: (_a = {}, _a[params.column] = after, _a) })];
                        case 3:
                            _b.sent();
                            return [2 /*return*/, this.appendTx(tx, {
                                    walletId: params.walletId,
                                    type: params.type,
                                    currencyKind: currencyKindOf(params.column),
                                    amountSigned: -params.amount,
                                    balanceAfter: after,
                                    idempotencyKey: params.idempotencyKey,
                                    refType: params.refType,
                                    refId: params.refId,
                                })];
                    }
                });
            });
        };
        /** CRÉDIT atomique : lock → UPDATE += amount → ledger (amountSigned > 0). */
        WalletRepository_1.prototype.credit = function (tx, params) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, wallet, after;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            assertAmount(params.amount);
                            assertColumn(params.column);
                            return [4 /*yield*/, tx.walletTransaction.findUnique({ where: { idempotencyKey: params.idempotencyKey } })];
                        case 1:
                            existing = _b.sent();
                            if (existing)
                                return [2 /*return*/, existing];
                            return [4 /*yield*/, this.lockWallet(tx, params.walletId)];
                        case 2:
                            wallet = _b.sent();
                            after = wallet[params.column] + params.amount;
                            return [4 /*yield*/, tx.wallet.update({ where: { id: params.walletId }, data: (_a = {}, _a[params.column] = after, _a) })];
                        case 3:
                            _b.sent();
                            return [2 /*return*/, this.appendTx(tx, {
                                    walletId: params.walletId,
                                    type: params.type,
                                    currencyKind: currencyKindOf(params.column),
                                    amountSigned: params.amount,
                                    balanceAfter: after,
                                    idempotencyKey: params.idempotencyKey,
                                    refType: params.refType,
                                    refId: params.refId,
                                    reversalOfId: params.reversalOfId,
                                })];
                    }
                });
            });
        };
        /**
         * Transfert entre deux wallets (escrow joueur→house, payout house→joueur…) :
         * déverrouille TOUJOURS dans le même ordre global (walletId trié) pour éviter les interblocages.
         */
        WalletRepository_1.prototype.transfer = function (tx, params) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, first, second;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = params.fromWalletId < params.toWalletId
                                ? [params.fromWalletId, params.toWalletId]
                                : [params.toWalletId, params.fromWalletId], first = _a[0], second = _a[1];
                            // verrouille les deux lignes dans l'ordre canonique avant toute écriture
                            return [4 /*yield*/, this.lockWallet(tx, first)];
                        case 1:
                            // verrouille les deux lignes dans l'ordre canonique avant toute écriture
                            _b.sent();
                            return [4 /*yield*/, this.lockWallet(tx, second)];
                        case 2:
                            _b.sent();
                            return [4 /*yield*/, this.debit(tx, {
                                    walletId: params.fromWalletId,
                                    column: params.column,
                                    amount: params.amount,
                                    type: params.debitType,
                                    idempotencyKey: params.debitKey,
                                    refType: params.refType,
                                    refId: params.refId,
                                })];
                        case 3:
                            _b.sent();
                            return [4 /*yield*/, this.credit(tx, {
                                    walletId: params.toWalletId,
                                    column: params.column,
                                    amount: params.amount,
                                    type: params.creditType,
                                    idempotencyKey: params.creditKey,
                                    refType: params.refType,
                                    refId: params.refId,
                                })];
                        case 4:
                            _b.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /** Snapshot lecture simple (GET /wallet/balances) — hors tx, tolère la lecture non verrouillée. */
        WalletRepository_1.prototype.getBalances = function (walletId) {
            return __awaiter(this, void 0, void 0, function () {
                var w;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.wallet.findUnique({
                                where: { id: walletId },
                                select: { id: true, credits: true, gems: true, tokens: true, hardCents: true },
                            })];
                        case 1:
                            w = _a.sent();
                            if (!w)
                                throw new domain_errors_1.NotFoundError('Wallet', walletId);
                            return [2 /*return*/, w];
                    }
                });
            });
        };
        /** Wallet HOUSE unique (ownerType=HOUSE) — seed migration 0006_house_wallet. */
        WalletRepository_1.prototype.getHouseWalletId = function (tx) {
            return __awaiter(this, void 0, void 0, function () {
                var client, house;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            client = tx !== null && tx !== void 0 ? tx : this.prisma;
                            return [4 /*yield*/, client.wallet.findFirst({ where: { ownerType: 'HOUSE' }, select: { id: true } })];
                        case 1:
                            house = _a.sent();
                            if (!house) {
                                // Absence = déploiement incomplet (seed manquant) → incident, pas un comportement dégradé.
                                throw new domain_errors_1.ServerUnavailableError('House wallet missing (run 0006_house_wallet seed).');
                            }
                            return [2 /*return*/, house.id];
                    }
                });
            });
        };
        /** Wallet d'un joueur (peut être créé à la volée si absent — sécurité post-migration). */
        WalletRepository_1.prototype.getOrCreatePlayerWallet = function (tx, playerId) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, created;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, tx.wallet.findUnique({ where: { playerId: playerId }, select: { id: true } })];
                        case 1:
                            existing = _a.sent();
                            if (existing)
                                return [2 /*return*/, existing.id];
                            return [4 /*yield*/, tx.wallet.create({ data: { playerId: playerId, ownerType: 'PLAYER' }, select: { id: true } })];
                        case 2:
                            created = _a.sent();
                            return [2 /*return*/, created.id];
                    }
                });
            });
        };
        /* ------------------------------- Interne -------------------------------- */
        WalletRepository_1.prototype.appendTx = function (tx, data) {
            return tx.walletTransaction.create({
                data: {
                    walletId: data.walletId,
                    type: data.type,
                    currencyKind: data.currencyKind,
                    amountSigned: data.amountSigned,
                    balanceAfter: data.balanceAfter,
                    idempotencyKey: data.idempotencyKey,
                    refType: data.refType,
                    refId: data.refId,
                    reversalOfId: data.reversalOfId,
                },
            }).catch(function (err) {
                // Course sur la même clé entre le findUnique et le create : P2002 → relire la gagnante.
                if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                    return tx.walletTransaction.findUniqueOrThrow({ where: { idempotencyKey: data.idempotencyKey } });
                }
                throw err;
            });
        };
        return WalletRepository_1;
    }());
    __setFunctionName(_classThis, "WalletRepository");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WalletRepository = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WalletRepository = _classThis;
}();
exports.WalletRepository = WalletRepository;
function assertAmount(amount) {
    if (!Number.isInteger(amount) || amount <= 0) {
        // INV-01 : les montants sont des entiers STRICTEMENT positifs passés au repository.
        throw new TypeError("Wallet amount must be a positive integer, got ".concat(String(amount)));
    }
}
function assertColumn(column) {
    if (!WALLET_COLUMNS.has(column))
        throw new TypeError("Unknown wallet column: ".concat(String(column)));
}
function currencyKindOf(column) {
    switch (column) {
        case 'credits': return 'CREDITS';
        case 'gems': return 'GEMS';
        case 'tokens': return 'TOKENS';
        case 'hardCents': return 'HARD_CENTS';
    }
}
var templateObject_1;
