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
exports.BettingService = void 0;
/**
 * betting.service.ts — cycle de vie des marchés & positions (docs/betting.md §3, INV-08..INV-21).
 * Escrow : chaque mise est débitée via wallet.repository (SELECT FOR UPDATE) avec la clé
 * d'idempotence `escrow:<marketId>:<playerId>` (INV-04/INV-15). Deux escrows = transfert
 * joueur→HOUSE dans LA MÊME transaction interactive Prisma : jamais de fond en limbes.
 * Transitions d'état marché/position via state-machines (INV-14) ; le settlement est
 * déclenché par match-settlement (outbox), jamais ici.
 */
var common_1 = require("@nestjs/common");
var idempotency_guard_1 = require("../../common/guards/idempotency.guard");
var bet_state_machine_1 = require("../../common/state-machines/bet.state-machine");
var bet_market_state_machine_1 = require("../../common/state-machines/bet-market.state-machine");
var betting_errors_1 = require("../../common/errors/betting-errors");
var domain_errors_1 = require("../../common/errors/domain-errors");
var COLUMN_FOR_CURRENCY = { SOFT: 'credits', HARD: 'hardCents' };
var BettingService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var BettingService = _classThis = /** @class */ (function () {
        function BettingService_1(prisma, wallet, config, validator, jurisdictions, odds) {
            this.prisma = prisma;
            this.wallet = wallet;
            this.config = config;
            this.validator = validator;
            this.jurisdictions = jurisdictions;
            this.odds = odds;
            this.logger = new common_1.Logger(BettingService.name);
        }
        /** POST /betting/markets — crée un défi public ou privé (mise fixée = future INV-10). */
        BettingService_1.prototype.createMarket = function (params) {
            return __awaiter(this, void 0, void 0, function () {
                var opponentId, opp;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.validator.validateMarketCreation(params.creator, params.currency, params.stake)];
                        case 1:
                            _a.sent();
                            opponentId = null;
                            if (!params.opponentUsername) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.prisma.player.findUnique({ where: { username: params.opponentUsername } })];
                        case 2:
                            opp = _a.sent();
                            if (!opp)
                                throw new domain_errors_1.NotFoundError('Player', params.opponentUsername);
                            if (opp.id === params.creator.id)
                                throw new domain_errors_1.ForbiddenAdminError({}, 'You cannot challenge yourself.');
                            // Le pays de l'opposant doit AUSSI autoriser la devise (sinon défi mort-né → refus immédiat).
                            return [4 /*yield*/, this.jurisdictions.assertAllowed(opp.countryCode, params.currency)];
                        case 3:
                            // Le pays de l'opposant doit AUSSI autoriser la devise (sinon défi mort-né → refus immédiat).
                            _a.sent();
                            opponentId = opp.id;
                            _a.label = 4;
                        case 4: return [2 /*return*/, this.prisma.betMarket.create({
                                data: {
                                    creatorId: params.creator.id,
                                    opponentId: opponentId,
                                    currency: params.currency,
                                    stake: params.stake,
                                    houseEdgeBps: this.config.constants.HOUSE_EDGE_BPS,
                                    status: opponentId ? 'CHALLENGED' : 'OPEN',
                                    public: !opponentId,
                                    trackId: params.trackId,
                                    vehicleId: params.vehicleId,
                                },
                            })];
                    }
                });
            });
        };
        /**
         * POST /betting/markets/:id/join — escrow ATOMIQUE du rejoignant puis verrouillage si 1v1 complet.
         * En v1 1v1 : créateur escrowe à la création, opposant escrowe au join → marché LOCKED.
         */
        BettingService_1.prototype.joinMarket = function (marketId, player) {
            return __awaiter(this, void 0, void 0, function () {
                var market, column, result;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.validator.validateJoin(marketId, player)];
                        case 1:
                            market = (_a.sent()).market;
                            column = COLUMN_FOR_CURRENCY[market.currency];
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var fresh, bet, walletId, houseWalletId, escrowKey, escrowTx, poolAgg, totalPool, bothSidesEscrowed, locked, nextStatus, updated, finalBet;
                                    var _this = this;
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0: return [4 /*yield*/, tx.betMarket.findUniqueOrThrow({ where: { id: market.id } })];
                                            case 1:
                                                fresh = _b.sent();
                                                if (fresh.status !== 'OPEN' && fresh.status !== 'CHALLENGED') {
                                                    throw new domain_errors_1.ValidationError({ field: 'status', reason: "Market became ".concat(fresh.status, ".") });
                                                }
                                                return [4 /*yield*/, tx.bet.create({
                                                        data: {
                                                            marketId: fresh.id,
                                                            playerId: player.id,
                                                            side: fresh.creatorId === player.id ? 0 : 1,
                                                            stake: fresh.stake,
                                                            status: 'PENDING',
                                                        },
                                                    })];
                                            case 2:
                                                bet = _b.sent();
                                                return [4 /*yield*/, this.wallet.getOrCreatePlayerWallet(tx, player.id)];
                                            case 3:
                                                walletId = _b.sent();
                                                return [4 /*yield*/, this.wallet.getHouseWalletId(tx)];
                                            case 4:
                                                houseWalletId = _b.sent();
                                                escrowKey = (0, idempotency_guard_1.deriveLedgerKey)('escrow', fresh.id, player.id);
                                                return [4 /*yield*/, this.wallet
                                                        .debit(tx, {
                                                        walletId: walletId,
                                                        column: column,
                                                        amount: fresh.stake,
                                                        type: 'BET_ESCROW',
                                                        idempotencyKey: escrowKey,
                                                        refType: 'BET_MARKET',
                                                        refId: fresh.id,
                                                    })
                                                        .then(function (t) { return t; })
                                                        .catch(function () { return __awaiter(_this, void 0, void 0, function () {
                                                        var existing;
                                                        return __generator(this, function (_a) {
                                                            switch (_a.label) {
                                                                case 0: return [4 /*yield*/, tx.walletTransaction.findUniqueOrThrow({ where: { idempotencyKey: escrowKey } })];
                                                                case 1:
                                                                    existing = _a.sent();
                                                                    return [2 /*return*/, existing];
                                                            }
                                                        });
                                                    }); })];
                                            case 5:
                                                escrowTx = _b.sent();
                                                return [4 /*yield*/, this.wallet.credit(tx, {
                                                        walletId: houseWalletId,
                                                        column: column,
                                                        amount: fresh.stake,
                                                        type: 'HOUSE_FEE',
                                                        idempotencyKey: "".concat(escrowKey, ":house"),
                                                        refType: 'BET_MARKET',
                                                        refId: fresh.id,
                                                    })];
                                            case 6:
                                                _b.sent();
                                                return [4 /*yield*/, tx.bet.update({
                                                        where: { id: bet.id },
                                                        data: { status: 'ESCROWED', escrowTxId: escrowTx.id },
                                                    })];
                                            case 7:
                                                _b.sent();
                                                (0, bet_state_machine_1.assertBetTransition)('PENDING', 'ESCROWED');
                                                return [4 /*yield*/, tx.bet.aggregate({
                                                        where: { marketId: fresh.id, status: { in: ['ESCROWED', 'RUNNING'] } },
                                                        _sum: { stake: true },
                                                    })];
                                            case 8:
                                                poolAgg = _b.sent();
                                                totalPool = (_a = poolAgg._sum.stake) !== null && _a !== void 0 ? _a : 0;
                                                return [4 /*yield*/, tx.bet.count({ where: { marketId: fresh.id, status: { in: ['ESCROWED', 'RUNNING'] } } })];
                                            case 9:
                                                bothSidesEscrowed = _b.sent();
                                                locked = bothSidesEscrowed >= 2 || (fresh.opponentId !== null && bothSidesEscrowed >= 2);
                                                nextStatus = locked ? 'LOCKED' : fresh.status === 'OPEN' ? 'CHALLENGED' : fresh.status;
                                                if (nextStatus !== fresh.status)
                                                    (0, bet_market_state_machine_1.assertBetMarketTransition)(fresh.status, nextStatus);
                                                return [4 /*yield*/, tx.betMarket.update({
                                                        where: { id: fresh.id },
                                                        data: __assign(__assign({ totalPool: totalPool, houseCutEstimate: this.odds.recomputeCutEstimate(totalPool, fresh.houseEdgeBps) }, (fresh.opponentId === null && !locked ? { opponentId: player.id } : {})), { status: nextStatus }),
                                                    })];
                                            case 10:
                                                updated = _b.sent();
                                                return [4 /*yield*/, tx.bet.findUniqueOrThrow({ where: { id: bet.id } })];
                                            case 11:
                                                finalBet = _b.sent();
                                                return [2 /*return*/, { market: updated, bet: finalBet }];
                                        }
                                    });
                                }); })];
                        case 2:
                            result = _a.sent();
                            this.logger.log("Joined market=".concat(marketId, " player=").concat(player.id, " stake=").concat(market.stake));
                            return [2 /*return*/, result];
                    }
                });
            });
        };
        /** GET /betting/markets — filtres statut/devise/piste + pagination curseur simple. */
        BettingService_1.prototype.listMarkets = function (query) {
            return __awaiter(this, void 0, void 0, function () {
                var where, rows, hasMore;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            where = {};
                            if (query.status)
                                where.status = query.status;
                            if (query.currency)
                                where.currency = query.currency;
                            if (query.trackId)
                                where.trackId = query.trackId;
                            if (query.cursor)
                                where.id = { gt: query.cursor };
                            return [4 /*yield*/, this.prisma.betMarket.findMany({
                                    where: where,
                                    orderBy: { createdAt: 'desc' },
                                    take: query.limit + 1,
                                })];
                        case 1:
                            rows = _a.sent();
                            hasMore = rows.length > query.limit;
                            return [2 /*return*/, { items: rows.slice(0, query.limit), nextCursor: hasMore ? rows[query.limit - 1].id : null }];
                    }
                });
            });
        };
        /** GET /betting/markets/:id — détail + pool courant (délégation à bet-odds). */
        BettingService_1.prototype.getMarket = function (marketId) {
            return __awaiter(this, void 0, void 0, function () {
                var market;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.betMarket.findUnique({
                                where: { id: marketId },
                                include: { bets: { include: { player: { select: { id: true, username: true, nationality: true, plPoints: true } } } } },
                            })];
                        case 1:
                            market = _a.sent();
                            if (!market)
                                throw new domain_errors_1.NotFoundError('BetMarket', marketId);
                            return [2 /*return*/, market];
                    }
                });
            });
        };
        /** GET /betting/me — mes positions actives + réglées récentes. */
        BettingService_1.prototype.myBets = function (playerId, statusFilter) {
            return __awaiter(this, void 0, void 0, function () {
                var where;
                return __generator(this, function (_a) {
                    where = { playerId: playerId };
                    if (statusFilter)
                        where.status = statusFilter;
                    return [2 /*return*/, this.prisma.bet.findMany({
                            where: where,
                            orderBy: { createdAt: 'desc' },
                            take: 100,
                            include: { market: { select: { id: true, status: true, currency: true, trackId: true, totalPool: true } } },
                        })];
                });
            });
        };
        /** Annulation par le CRÉATEUR seul, marché encore OPEN/CHALLENGED : rembourse l'escrow créateur. */
        BettingService_1.prototype.cancelMarket = function (marketId, actor) {
            return __awaiter(this, void 0, void 0, function () {
                var market, settled;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.betMarket.findUnique({ where: { id: marketId } })];
                        case 1:
                            market = _a.sent();
                            if (!market)
                                throw new domain_errors_1.NotFoundError('BetMarket', marketId);
                            if (market.creatorId !== actor.id)
                                throw new domain_errors_1.ForbiddenAdminError({}, 'Only the creator can cancel.');
                            if (market.status !== 'OPEN' && market.status !== 'CHALLENGED') {
                                throw new domain_errors_1.ValidationError({ field: 'status', reason: 'Only an unsettled open market can be cancelled.' });
                            }
                            return [4 /*yield*/, this.prisma.betSettlement.findUnique({ where: { marketId: marketId }, select: { id: true } })];
                        case 2:
                            settled = _a.sent();
                            if (settled)
                                throw new betting_errors_1.BetAlreadySettledError(marketId);
                            return [2 /*return*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var column, bets, _loop_1, this_1, _i, bets_1, b;
                                    var _this = this;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                column = COLUMN_FOR_CURRENCY[market.currency];
                                                return [4 /*yield*/, tx.bet.findMany({ where: { marketId: marketId, status: 'ESCROWED' } })];
                                            case 1:
                                                bets = _a.sent();
                                                _loop_1 = function (b) {
                                                    var walletId, houseWalletId, refundKey;
                                                    return __generator(this, function (_b) {
                                                        switch (_b.label) {
                                                            case 0: return [4 /*yield*/, this_1.wallet.getOrCreatePlayerWallet(tx, b.playerId)];
                                                            case 1:
                                                                walletId = _b.sent();
                                                                return [4 /*yield*/, this_1.wallet.getHouseWalletId(tx)];
                                                            case 2:
                                                                houseWalletId = _b.sent();
                                                                refundKey = (0, idempotency_guard_1.deriveLedgerKey)('refund', marketId, b.playerId);
                                                                return [4 /*yield*/, tx.walletTransaction.findUnique({ where: { idempotencyKey: refundKey } }).then(function (hit) { return __awaiter(_this, void 0, void 0, function () {
                                                                        return __generator(this, function (_a) {
                                                                            switch (_a.label) {
                                                                                case 0:
                                                                                    if (hit)
                                                                                        return [2 /*return*/];
                                                                                    return [4 /*yield*/, this.wallet.debit(tx, {
                                                                                            walletId: houseWalletId,
                                                                                            column: column,
                                                                                            amount: b.stake,
                                                                                            type: 'REVERSAL',
                                                                                            idempotencyKey: "".concat(refundKey, ":house"),
                                                                                            refType: 'BET_MARKET',
                                                                                            refId: marketId,
                                                                                        })];
                                                                                case 1:
                                                                                    _a.sent();
                                                                                    return [4 /*yield*/, this.wallet.credit(tx, {
                                                                                            walletId: walletId,
                                                                                            column: column,
                                                                                            amount: b.stake,
                                                                                            type: 'BET_REFUND',
                                                                                            idempotencyKey: refundKey,
                                                                                            refType: 'BET_MARKET',
                                                                                            refId: marketId,
                                                                                        })];
                                                                                case 2:
                                                                                    _a.sent();
                                                                                    return [2 /*return*/];
                                                                            }
                                                                        });
                                                                    }); })];
                                                            case 3:
                                                                _b.sent();
                                                                (0, bet_state_machine_1.assertBetTransition)(b.status, 'REFUNDED');
                                                                return [4 /*yield*/, tx.bet.update({ where: { id: b.id }, data: { status: 'REFUNDED', result: 'REFUND' } })];
                                                            case 4:
                                                                _b.sent();
                                                                return [2 /*return*/];
                                                        }
                                                    });
                                                };
                                                this_1 = this;
                                                _i = 0, bets_1 = bets;
                                                _a.label = 2;
                                            case 2:
                                                if (!(_i < bets_1.length)) return [3 /*break*/, 5];
                                                b = bets_1[_i];
                                                return [5 /*yield**/, _loop_1(b)];
                                            case 3:
                                                _a.sent();
                                                _a.label = 4;
                                            case 4:
                                                _i++;
                                                return [3 /*break*/, 2];
                                            case 5:
                                                (0, bet_market_state_machine_1.assertBetMarketTransition)(market.status, 'CANCELLED');
                                                return [2 /*return*/, tx.betMarket.update({
                                                        where: { id: marketId },
                                                        data: { status: 'CANCELLED', cancelledAt: new Date(), totalPool: 0 },
                                                    })];
                                        }
                                    });
                                }); })];
                    }
                });
            });
        };
        /** Alias lecture cotes pour le controller (garde la surface API stable). */
        BettingService_1.prototype.oddsOf = function (marketId) {
            return this.odds.oddsForMarket(marketId);
        };
        return BettingService_1;
    }());
    __setFunctionName(_classThis, "BettingService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BettingService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BettingService = _classThis;
}();
exports.BettingService = BettingService;
