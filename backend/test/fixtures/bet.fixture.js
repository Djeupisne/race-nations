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
exports.TEST_TRACK_ID = void 0;
exports.ensureTestTrack = ensureTestTrack;
exports.seedMarket = seedMarket;
exports.seedLockedOneVersusOne = seedLockedOneVersusOne;
exports.findMarketFull = findMarketFull;
exports.settlementOf = settlementOf;
exports.payoutsMap = payoutsMap;
exports.settlementCount = settlementCount;
exports.freshIdemKey = freshIdemKey;
/**
 * bet.fixture.ts — fixtures BetMarket / Bet / BetSettlement pour les E2E.
 * Deux niveaux :
 *  1. Helpers de LECTURE/contrôle (findMarket, betsOf, settlementOf) — utilisés par
 *     betting-settlement.e2e-spec.ts et invariants.e2e-spec.ts.
 *  2. Helpers d'ÉCRITURE directe pour construire des états intermédiaires précis
 *     (marché LOCKED avec escrows déjà posés) sans dépendre du flux HTTP complet.
 * Les écritures respectent les contraintes DB (UNIQUE(marketId) sur BetSettlement = INV-14,
 * UNIQUE(marketId, playerId) sur Bet, montants entiers = INV-01).
 */
var node_crypto_1 = require("node:crypto");
/** Track de test partagé — inséré idempotamment (les E2E n'ont pas de seed circuits). */
exports.TEST_TRACK_ID = '11111111-1111-4111-8111-111111111111';
function ensureTestTrack(prisma) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Le schéma ne modélise pas de table Track (trackId est un champ libre sur BetMarket/Match),
            // donc l'identifiant canonique suffit ; on garde la fonction pour lisibilité + extension.
            return [2 /*return*/, exports.TEST_TRACK_ID];
        });
    });
}
/** Crée un BetMarket brut (sans escrow) — point de départ des scénarios. */
function seedMarket(prisma, p) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b;
        var _c, _d;
        var _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    if (!Number.isInteger(p.stake) || p.stake <= 0)
                        throw new Error('seedMarket: stake entier > 0 requis (INV-01)');
                    _b = (_a = prisma.betMarket).create;
                    _c = {};
                    _d = {
                        creatorId: p.creatorId,
                        opponentId: (_e = p.opponentId) !== null && _e !== void 0 ? _e : null,
                        currency: p.currency,
                        stake: p.stake,
                        totalPool: 0,
                        houseEdgeBps: (_f = p.houseEdgeBps) !== null && _f !== void 0 ? _f : 500,
                        status: (_g = p.status) !== null && _g !== void 0 ? _g : 'OPEN',
                        public: true
                    };
                    return [4 /*yield*/, ensureTestTrack(prisma)];
                case 1: return [2 /*return*/, _b.apply(_a, [(_c.data = (_d.trackId = _j.sent(),
                            _d.matchId = (_h = p.matchId) !== null && _h !== void 0 ? _h : null,
                            _d),
                            _c)])];
            }
        });
    });
}
/**
 * Construit un marché verrouillé 1v1 entièrement échafaudé :
 * deux Bet ESCROWED side 0/1, escrow débité des wallets via ledger BET_ESCROW,
 * totalPool/houseCutEstimate cohérents (INV-08/15). C'est l'état exact dans lequel
 * BetSettlementService.settleMarket() attend un marché.
 */
function seedLockedOneVersusOne(prisma, params) {
    return __awaiter(this, void 0, void 0, function () {
        var column, kind, market, bets;
        var _a;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    column = params.currency === 'SOFT' ? 'credits' : 'hardCents';
                    kind = params.currency === 'SOFT' ? 'CREDITS' : 'HARD_CENTS';
                    return [4 /*yield*/, seedMarket(prisma, __assign(__assign({}, params), { status: 'LOCKED' }))];
                case 1:
                    market = _b.sent();
                    return [4 /*yield*/, prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var created, _i, _a, _b, side, playerId, walletId, wallet, escrowTx, bet, updated;
                            var _c;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        created = [];
                                        _i = 0, _a = [
                                            [0, params.creatorId, params.creatorWalletId],
                                            [1, params.opponentId, params.opponentWalletId],
                                        ];
                                        _d.label = 1;
                                    case 1:
                                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                                        _b = _a[_i], side = _b[0], playerId = _b[1], walletId = _b[2];
                                        return [4 /*yield*/, tx.wallet.update({
                                                where: { id: walletId },
                                                data: (_c = {}, _c[column] = { decrement: params.stake }, _c),
                                            })];
                                    case 2:
                                        wallet = _d.sent();
                                        if (wallet[column] < 0)
                                            throw new Error('fixture: solde négatif (INV-02 violé en test!)');
                                        return [4 /*yield*/, tx.walletTransaction.create({
                                                data: {
                                                    walletId: walletId,
                                                    type: 'BET_ESCROW',
                                                    currencyKind: kind,
                                                    amountSigned: -params.stake,
                                                    balanceAfter: wallet[column],
                                                    idempotencyKey: "fixture:escrow:".concat(market.id, ":").concat(playerId),
                                                    refType: 'BET_MARKET',
                                                    refId: market.id,
                                                },
                                            })];
                                    case 3:
                                        escrowTx = _d.sent();
                                        return [4 /*yield*/, tx.bet.create({
                                                data: { marketId: market.id, playerId: playerId, side: side, stake: params.stake, status: 'ESCROWED', escrowTxId: escrowTx.id },
                                            })];
                                    case 4:
                                        bet = _d.sent();
                                        created.push(bet);
                                        _d.label = 5;
                                    case 5:
                                        _i++;
                                        return [3 /*break*/, 1];
                                    case 6: return [4 /*yield*/, tx.betMarket.update({
                                            where: { id: market.id },
                                            data: { totalPool: params.stake * 2, houseCutEstimate: Math.floor((params.stake * 2 * 500) / 10000) },
                                        })];
                                    case 7:
                                        updated = _d.sent();
                                        void updated;
                                        return [2 /*return*/, created];
                                }
                            });
                        }); })];
                case 2:
                    bets = _b.sent();
                    _a = {};
                    return [4 /*yield*/, prisma.betMarket.findUniqueOrThrow({ where: { id: market.id } })];
                case 3: return [2 /*return*/, (_a.market = _b.sent(), _a.bets = bets, _a)];
            }
        });
    });
}
/** Lecture : marché + bets + settlement (jointure unique INV-14). */
function findMarketFull(prisma, marketId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma.betMarket.findUniqueOrThrow({
                    where: { id: marketId },
                    include: { bets: true, settlement: true },
                })];
        });
    });
}
function settlementOf(prisma, marketId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma.betSettlement.findUnique({ where: { marketId: marketId } })];
        });
    });
}
/** Payouts du settlement sous forme map betId → montant. */
function payoutsMap(settlement) {
    var _a;
    return ((_a = settlement === null || settlement === void 0 ? void 0 : settlement.payouts) !== null && _a !== void 0 ? _a : {});
}
/** Compte les settlements d'un marché (doit toujours valoir ≤ 1 — INV-14). */
function settlementCount(prisma, marketId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma.betSettlement.count({ where: { marketId: marketId } })];
        });
    });
}
/** Génère une clé d'idempotence unique pour les appels HTTP concurrents des tests. */
function freshIdemKey(prefix) {
    return "".concat(prefix, ":").concat((0, node_crypto_1.randomUUID)());
}
