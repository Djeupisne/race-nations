"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureHouseWallet = ensureHouseWallet;
exports.balancesForPlayer = balancesForPlayer;
exports.houseBalances = houseBalances;
exports.ledgerForPlayer = ledgerForPlayer;
exports.houseLedger = houseLedger;
exports.topUpCredits = topUpCredits;
exports.conservationDelta = conservationDelta;
/** Retourne (et crée si absent, idempotent) le wallet HOUSE unique (ownerType=HOUSE). */
function ensureHouseWallet(prisma) {
    return __awaiter(this, void 0, void 0, function () {
        var existing;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.wallet.findFirst({ where: { ownerType: 'HOUSE' } })];
                case 1:
                    existing = _a.sent();
                    if (existing)
                        return [2 /*return*/, existing];
                    return [2 /*return*/, prisma.wallet.create({
                            data: {
                                playerId: null,
                                ownerType: 'HOUSE',
                                credits: 0,
                                gems: 0,
                                tokens: 0,
                                // Solde d'amorçage du seed 0006_house_wallet : 0 en dur, la maison ne part jamais
                                // d'une réserve fictive ; elle n'encaisse que houseCut/résidus (INV-13).
                                hardCents: 0,
                            },
                        })];
            }
        });
    });
}
/** Solde d'un joueur via son playerId (lance si le wallet n'existe pas). */
function balancesForPlayer(prisma, playerId) {
    return __awaiter(this, void 0, void 0, function () {
        var wallet;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.wallet.findUnique({ where: { playerId: playerId } })];
                case 1:
                    wallet = _a.sent();
                    if (!wallet)
                        throw new Error("wallet manquant pour player ".concat(playerId));
                    return [2 /*return*/, { credits: wallet.credits, gems: wallet.gems, tokens: wallet.tokens, hardCents: wallet.hardCents }];
            }
        });
    });
}
/** Solde du wallet HOUSE. */
function houseBalances(prisma) {
    return __awaiter(this, void 0, void 0, function () {
        var house;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ensureHouseWallet(prisma)];
                case 1:
                    house = _a.sent();
                    return [2 /*return*/, { credits: house.credits, gems: house.gems, tokens: house.tokens, hardCents: house.hardCents }];
            }
        });
    });
}
/** Tous les mouvements du ledger d'un joueur, tri chronologique. */
function ledgerForPlayer(prisma, playerId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma.walletTransaction.findMany({
                    where: { wallet: { playerId: playerId } },
                    orderBy: { createdAt: 'asc' },
                })];
        });
    });
}
/** Tous les mouvements du ledger HOUSE (commissions, résidus, reversals). */
function houseLedger(prisma) {
    return __awaiter(this, void 0, void 0, function () {
        var house;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ensureHouseWallet(prisma)];
                case 1:
                    house = _a.sent();
                    return [2 /*return*/, prisma.walletTransaction.findMany({
                            where: { walletId: house.id },
                            orderBy: { createdAt: 'asc' },
                        })];
            }
        });
    });
}
/**
 * Crédit de dépôt initial déterministe (type DEPOSIT, clé idempotente stable).
 * Utilisé pour armer des bankrolls précises avant un scenario de pari.
 */
function topUpCredits(prisma, playerId, amount, key) {
    return __awaiter(this, void 0, void 0, function () {
        var wallet, hit;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (amount <= 0 || !Number.isInteger(amount))
                        throw new Error('topUpCredits: montant entier > 0 requis (INV-01)');
                    return [4 /*yield*/, prisma.wallet.findUnique({ where: { playerId: playerId } })];
                case 1:
                    wallet = _a.sent();
                    if (!wallet)
                        throw new Error("wallet manquant pour player ".concat(playerId));
                    return [4 /*yield*/, prisma.walletTransaction.findUnique({ where: { idempotencyKey: key } })];
                case 2:
                    hit = _a.sent();
                    if (hit)
                        return [2 /*return*/]; // rejouer une fixture = no-op (même discipline qu'INV-04)
                    return [4 /*yield*/, prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var updated;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, tx.wallet.update({ where: { id: wallet.id }, data: { credits: { increment: amount } } })];
                                    case 1:
                                        updated = _a.sent();
                                        return [4 /*yield*/, tx.walletTransaction.create({
                                                data: {
                                                    walletId: wallet.id,
                                                    type: 'DEPOSIT',
                                                    currencyKind: 'CREDITS',
                                                    amountSigned: amount,
                                                    balanceAfter: updated.credits,
                                                    idempotencyKey: key,
                                                    refType: 'TEST_FIXTURE',
                                                    refId: playerId,
                                                },
                                            })];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/** Somme des débits vs crédits sur un ensemble de clés de ledger (contrôle INV-05). */
function conservationDelta(transactions) {
    return transactions.reduce(function (acc, t) { return acc + t.amountSigned; }, 0);
}
