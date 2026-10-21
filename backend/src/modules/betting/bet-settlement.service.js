"use strict";
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
exports.BetSettlementService = void 0;
/**
 * bet-settlement.service.ts — règlement pari mutuel D'UN MARCHÉ (docs/betting.md §4/§6, INV-08..INV-19).
 * Idempotence double-étage (INV-14) :
 *   1. Verrou DB : INSERT BetSettlement avec marketId UNIQUE + idempotencyKey `settle:<marketId>`
 *      UNIQUE → un second settlement physique est IMPOSSIBLE même en course ;
 *   2. Clés ledger dérivées (`payout:<marketId>:<betId>`, `housecut:<marketId>`) → rejouer = no-op.
 * Le calcul vient EXCLUSIVEMENT de utils/parimutuel.ts (floor + résidu → House, INV-05/09/13).
 * PUSH (match nul / marché annulé après verrouillage) → remboursements intégraux, houseCut = 0 (INV-16).
 * Match INVALIDATED → litige DISPUTED ≤ 72 h (INV-18/19), AUCUN mouvement d'argent ici.
 */
var common_1 = require("@nestjs/common");
var idempotency_guard_1 = require("../../common/guards/idempotency.guard");
var parimutuel_1 = require("../../common/utils/parimutuel");
var bet_state_machine_1 = require("../../common/state-machines/bet.state-machine");
var bet_market_state_machine_1 = require("../../common/state-machines/bet-market.state-machine");
var betting_errors_1 = require("../../common/errors/betting-errors");
var domain_errors_1 = require("../../common/errors/domain-errors");
var COLUMN_FOR_CURRENCY = { SOFT: 'credits', HARD: 'hardCents' };
var BetSettlementService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var BetSettlementService = _classThis = /** @class */ (function () {
        function BetSettlementService_1(prisma, wallet) {
            this.prisma = prisma;
            this.wallet = wallet;
            this.logger = new common_1.Logger(BetSettlementService.name);
        }
        /**
         * Règlement atomique d'un marché LOCKED/RUNNING. Idempotent : rappel sur un marché
         * déjà SETTLED renvoie le settlement existant sans aucun effet de bord (INV-14).
         */
        BetSettlementService_1.prototype.settleMarket = function (params) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, market, escrowed, column, stakes, byPlayer, calc, winners, payoutByBet, _i, _a, p, bet, settlement;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.betSettlement.findUnique({ where: { marketId: params.marketId } })];
                        case 1:
                            existing = _b.sent();
                            if (existing) {
                                this.logger.log("settle skipped (already settled) market=".concat(params.marketId));
                                return [2 /*return*/, existing]; // replay outbox/cron → réponse originale, zéro double paiement.
                            }
                            return [4 /*yield*/, this.prisma.betMarket.findUnique({
                                    where: { id: params.marketId },
                                    include: { bets: true, match: { select: { status: true } } },
                                })];
                        case 2:
                            market = _b.sent();
                            if (!market)
                                throw new domain_errors_1.NotFoundError('BetMarket', params.marketId);
                            if (market.status === 'SETTLED')
                                throw new betting_errors_1.BetAlreadySettledError(market.id);
                            if (market.status !== 'LOCKED' && market.status !== 'RUNNING') {
                                throw new domain_errors_1.ValidationError({ field: 'status', reason: "Cannot settle a ".concat(market.status, " market.") });
                            }
                            escrowed = market.bets.filter(function (b) { return b.status === 'ESCROWED' || b.status === 'RUNNING'; });
                            if (escrowed.length < 2) {
                                // Marché verrouillé sans les deux camps = anomalie → refus, investigation runbook §6.
                                throw new domain_errors_1.ValidationError({ field: 'bets', reason: 'Locked market without two escrowed positions.' });
                            }
                            column = COLUMN_FOR_CURRENCY[market.currency];
                            stakes = escrowed.map(function (b) { return ({ playerId: b.playerId, stake: b.stake }); });
                            byPlayer = new Map(escrowed.map(function (b) { return [b.playerId, b]; }));
                            if (params.push) {
                                calc = (0, parimutuel_1.computePushRefund)(stakes);
                            }
                            else {
                                if (params.winningSide === undefined)
                                    throw new domain_errors_1.ValidationError({ field: 'winningSide', reason: 'Required unless push.' });
                                winners = new Set(escrowed.filter(function (b) { return b.side === params.winningSide; }).map(function (b) { return b.playerId; }));
                                if (winners.size === 0)
                                    throw new domain_errors_1.ValidationError({ field: 'winningSide', reason: 'No escrowed bet on winning side.' });
                                calc = (0, parimutuel_1.computeParimutuelSettlement)(stakes, winners, market.houseEdgeBps);
                            }
                            payoutByBet = new Map();
                            for (_i = 0, _a = calc.payouts; _i < _a.length; _i++) {
                                p = _a[_i];
                                bet = byPlayer.get(p.playerId);
                                if (bet)
                                    payoutByBet.set(bet.id, p.payout);
                            }
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var idemKey, row, created, houseWalletId, _i, escrowed_1, b, payout, isWinner, key, _a, _b, _c, nextStatus, err_1, winner;
                                    var _d;
                                    var _e, _f;
                                    return __generator(this, function (_g) {
                                        switch (_g.label) {
                                            case 0:
                                                // 1) Transition marché LOCKED/RUNNING → SETTLING (graphe strict, INV-14).
                                                (0, bet_market_state_machine_1.assertBetMarketTransition)(market.status, 'SETTLING');
                                                return [4 /*yield*/, tx.betMarket.update({ where: { id: market.id }, data: { status: 'SETTLING' } })];
                                            case 1:
                                                _g.sent();
                                                idemKey = (0, idempotency_guard_1.deriveLedgerKey)('payout', market.id).replace('payout:', 'settle:');
                                                _g.label = 2;
                                            case 2:
                                                _g.trys.push([2, 15, , 18]);
                                                return [4 /*yield*/, tx.betSettlement.create({
                                                        data: {
                                                            marketId: market.id,
                                                            totalPool: calc.totalPool,
                                                            houseCut: calc.houseCut,
                                                            netPool: calc.netPool,
                                                            payouts: payoutByBet,
                                                            residual: calc.residue,
                                                            idempotencyKey: idemKey,
                                                            settledById: params.settledById,
                                                        },
                                                    })];
                                            case 3:
                                                created = _g.sent();
                                                void row;
                                                return [4 /*yield*/, this.wallet.getHouseWalletId(tx)];
                                            case 4:
                                                houseWalletId = _g.sent();
                                                _i = 0, escrowed_1 = escrowed;
                                                _g.label = 5;
                                            case 5:
                                                if (!(_i < escrowed_1.length)) return [3 /*break*/, 12];
                                                b = escrowed_1[_i];
                                                payout = (_e = payoutByBet.get(b.id)) !== null && _e !== void 0 ? _e : 0;
                                                isWinner = payout > 0;
                                                if (!isWinner) return [3 /*break*/, 9];
                                                key = (0, idempotency_guard_1.deriveLedgerKey)('payout', market.id, b.id);
                                                return [4 /*yield*/, this.wallet.debit(tx, {
                                                        walletId: houseWalletId,
                                                        column: column,
                                                        amount: payout,
                                                        type: 'HOUSE_REVERSAL',
                                                        idempotencyKey: "".concat(key, ":house"),
                                                        refType: 'BET_MARKET',
                                                        refId: market.id,
                                                    })];
                                            case 6:
                                                _g.sent();
                                                _b = (_a = this.wallet).credit;
                                                _c = [tx];
                                                _d = {};
                                                return [4 /*yield*/, this.wallet.getOrCreatePlayerWallet(tx, b.playerId)];
                                            case 7: return [4 /*yield*/, _b.apply(_a, _c.concat([(_d.walletId = _g.sent(),
                                                        _d.column = column,
                                                        _d.amount = payout,
                                                        _d.type = 'BET_PAYOUT',
                                                        _d.idempotencyKey = key,
                                                        _d.refType = 'BET_MARKET',
                                                        _d.refId = market.id,
                                                        _d)]))];
                                            case 8:
                                                _g.sent();
                                                _g.label = 9;
                                            case 9:
                                                nextStatus = params.push ? 'PUSH' : isWinner ? 'WON' : 'LOST';
                                                (0, bet_state_machine_1.assertBetTransition)(b.status, nextStatus);
                                                return [4 /*yield*/, tx.bet.update({
                                                        where: { id: b.id },
                                                        data: { status: nextStatus, result: params.push ? 'PUSH' : isWinner ? 'WIN' : 'LOSS', payout: (_f = payoutByBet.get(b.id)) !== null && _f !== void 0 ? _f : 0 },
                                                    })];
                                            case 10:
                                                _g.sent();
                                                _g.label = 11;
                                            case 11:
                                                _i++;
                                                return [3 /*break*/, 5];
                                            case 12:
                                                if (!(calc.residue > 0)) return [3 /*break*/, 14];
                                                return [4 /*yield*/, this.wallet.credit(tx, {
                                                        walletId: houseWalletId,
                                                        column: column,
                                                        amount: calc.residue,
                                                        type: 'HOUSE_FEE',
                                                        idempotencyKey: (0, idempotency_guard_1.deriveLedgerKey)('housecut', market.id),
                                                        refType: 'BET_MARKET',
                                                        refId: market.id,
                                                    })];
                                            case 13:
                                                _g.sent();
                                                _g.label = 14;
                                            case 14: return [2 /*return*/, created];
                                            case 15:
                                                err_1 = _g.sent();
                                                if (!(err_1.code === 'P2002')) return [3 /*break*/, 17];
                                                return [4 /*yield*/, tx.betSettlement.findUniqueOrThrow({ where: { marketId: market.id } })];
                                            case 16:
                                                winner = _g.sent();
                                                return [2 /*return*/, winner];
                                            case 17: throw err_1;
                                            case 18: return [2 /*return*/];
                                        }
                                    });
                                }); })];
                        case 3:
                            settlement = _b.sent();
                            // 4) Marché SETTLING → SETTLED terminal (hors tx si P2002 ci-dessus a court-circuité les écritures).
                            return [4 /*yield*/, this.prisma.betMarket
                                    .update({ where: { id: market.id }, data: { status: 'SETTLED' } })
                                    .catch(function () { return undefined; })];
                        case 4:
                            // 4) Marché SETTLING → SETTLED terminal (hors tx si P2002 ci-dessus a court-circuité les écritures).
                            _b.sent();
                            this.logger.log("Settled market=".concat(market.id, " pool=").concat(calc.totalPool, " cut=").concat(calc.houseCut, " residue=").concat(calc.residue));
                            return [2 /*return*/, settlement];
                    }
                });
            });
        };
        /**
         * Litige post-règlement (INV-18/19) : match INVALIDATED ou triche détectée APRÈS settlement
         * → marché DISPUTED (gel ≤ 72 h), fonds gelés côté House, aucune restitution automatique.
         * Une transaction CHEAT_REVERSAL est tracée pour la sanction (moderation/sanctions).
         */
        BetSettlementService_1.prototype.openDispute = function (marketId, reason) {
            return __awaiter(this, void 0, void 0, function () {
                var market;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.betMarket.findUnique({ where: { id: marketId } })];
                        case 1:
                            market = _a.sent();
                            if (!market)
                                throw new domain_errors_1.NotFoundError('BetMarket', marketId);
                            if (market.status === 'DISPUTED')
                                return [2 /*return*/]; // idempotent
                            if (market.status !== 'SETTLED' && market.status !== 'LOCKED' && market.status !== 'RUNNING') {
                                throw new domain_errors_1.ValidationError({ field: 'status', reason: "Cannot dispute a ".concat(market.status, " market.") });
                            }
                            (0, bet_market_state_machine_1.assertBetMarketTransition)(market.status, 'DISPUTED');
                            return [4 /*yield*/, this.prisma.betMarket.update({
                                    where: { id: marketId },
                                    data: { status: 'DISPUTED', disputedAt: new Date(), disputeReason: reason },
                                })];
                        case 2:
                            _a.sent();
                            this.logger.warn("Market ".concat(marketId, " DISPUTED (").concat(reason, ") \u2014 resolution manuelle requise sous 72 h"));
                            return [2 /*return*/];
                    }
                });
            });
        };
        /** Résolution admin d'un litige : remboursement intégral (VOID) ou maintien du settlement. */
        BetSettlementService_1.prototype.resolveDispute = function (marketId, outcome) {
            return __awaiter(this, void 0, void 0, function () {
                var market, column;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.betMarket.findUnique({ where: { id: marketId }, include: { bets: true } })];
                        case 1:
                            market = _a.sent();
                            if (!market)
                                throw new domain_errors_1.NotFoundError('BetMarket', marketId);
                            if (market.status !== 'DISPUTED')
                                throw new domain_errors_1.ValidationError({ field: 'status', reason: 'Market is not disputed.' });
                            if (!(outcome === 'UPHELD')) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.prisma.betMarket.update({ where: { id: marketId }, data: { status: 'SETTLED', disputedAt: null } })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                        case 3:
                            column = COLUMN_FOR_CURRENCY[market.currency];
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var houseWalletId, _i, _a, b, refundKey, already, creditTo;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0: return [4 /*yield*/, this.wallet.getHouseWalletId(tx)];
                                            case 1:
                                                houseWalletId = _b.sent();
                                                _i = 0, _a = market.bets;
                                                _b.label = 2;
                                            case 2:
                                                if (!(_i < _a.length)) return [3 /*break*/, 9];
                                                b = _a[_i];
                                                if (b.status !== 'WON' && b.status !== 'LOST' && b.status !== 'PUSH' && b.status !== 'ESCROWED' && b.status !== 'RUNNING')
                                                    return [3 /*break*/, 8];
                                                refundKey = (0, idempotency_guard_1.deriveLedgerKey)('refund', marketId, b.playerId);
                                                return [4 /*yield*/, tx.walletTransaction.findUnique({ where: { idempotencyKey: refundKey } })];
                                            case 3:
                                                already = _b.sent();
                                                if (already)
                                                    return [3 /*break*/, 8];
                                                return [4 /*yield*/, this.wallet.getOrCreatePlayerWallet(tx, b.playerId)];
                                            case 4:
                                                creditTo = _b.sent();
                                                // Remboursement de la mise initiale (jamais du payout éventuel — celui-ci est repris séparément).
                                                return [4 /*yield*/, this.wallet.debit(tx, {
                                                        walletId: houseWalletId,
                                                        column: column,
                                                        amount: b.stake,
                                                        type: 'REVERSAL',
                                                        idempotencyKey: "".concat(refundKey, ":house"),
                                                        refType: 'BET_MARKET',
                                                        refId: marketId,
                                                    })];
                                            case 5:
                                                // Remboursement de la mise initiale (jamais du payout éventuel — celui-ci est repris séparément).
                                                _b.sent();
                                                return [4 /*yield*/, this.wallet.credit(tx, {
                                                        walletId: creditTo,
                                                        column: column,
                                                        amount: b.stake,
                                                        type: 'BET_REFUND',
                                                        idempotencyKey: refundKey,
                                                        refType: 'BET_MARKET',
                                                        refId: marketId,
                                                    })];
                                            case 6:
                                                _b.sent();
                                                if (b.status !== 'REFUNDED' && b.status !== 'VOIDED')
                                                    (0, bet_state_machine_1.assertBetTransition)(b.status, 'REFUNDED');
                                                return [4 /*yield*/, tx.bet.update({ where: { id: b.id }, data: { status: 'REFUNDED', result: 'REFUND' } })];
                                            case 7:
                                                _b.sent();
                                                _b.label = 8;
                                            case 8:
                                                _i++;
                                                return [3 /*break*/, 2];
                                            case 9: return [4 /*yield*/, tx.betMarket.update({ where: { id: marketId }, data: { status: 'CANCELLED', cancelledAt: new Date() } })];
                                            case 10:
                                                _b.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); })];
                        case 4:
                            _a.sent();
                            this.logger.log("Dispute ".concat(marketId, " resolved REFUND_ALL"));
                            return [2 /*return*/];
                    }
                });
            });
        };
        return BetSettlementService_1;
    }());
    __setFunctionName(_classThis, "BetSettlementService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BetSettlementService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BetSettlementService = _classThis;
}();
exports.BetSettlementService = BetSettlementService;
