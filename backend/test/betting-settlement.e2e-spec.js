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
/**
 * betting-settlement.e2e-spec.ts — le calcul parimutuel est CORRECT et IDEMPOTENT.
 * Double stratégie :
 *  1. Unit-level : on ré-invocle computeParimutuelSettlement (source unique de vérité du
 *     service) sur des pools connus et on vérifie INV-08/09/16 à l'unité près.
 *  2. E2E : marché LOCKED échafaudé en base → BetSettlementService.settleMarket() via
 *     l'app Nest (DI réelle, Postgres réel) → payouts ledger + House cut exacts, puis
 *     re-settlement → aucun effet de bord (INV-14).
 */
var testing_1 = require("@nestjs/testing");
var app_module_1 = require("../src/app.module");
var prisma_service_1 = require("../src/prisma/prisma.service");
var bet_settlement_service_1 = require("../src/modules/betting/bet-settlement.service");
var parimutuel_1 = require("../src/common/utils/parimutuel");
var player_fixture_1 = require("./fixtures/player.fixture");
var bet_fixture_1 = require("./fixtures/bet.fixture");
var wallet_fixture_1 = require("./fixtures/wallet.fixture");
describe('Betting settlement E2E — parimutuel correct + idempotent', function () {
    describe('calcul pur (utils/parimutuel — même code que le service)', function () {
        it('1v1 equal stakes, edge 5% : winner reçoit netPool, houseCut exact (INV-08)', function () {
            var r = (0, parimutuel_1.computeParimutuelSettlement)([{ playerId: 'A', stake: 1000 }, { playerId: 'B', stake: 1000 }], new Set(['A']), 500);
            expect(r.totalPool).toBe(2000);
            expect(r.houseCut).toBe(100); // floor(2000*500/10000)
            expect(r.netPool).toBe(1900);
            expect(r.payouts.find(function (p) { return p.playerId === 'A'; }).payout).toBe(1900);
            expect(r.payouts.find(function (p) { return p.playerId === 'B'; }).payout).toBe(0);
            expect(r.residue).toBe(0);
        });
        it('N players, résidu de floor crédité au House, jamais perdu (INV-05/09)', function () {
            // 3 gagnants sur pool impair : floor laisse un résidu.
            var r = (0, parimutuel_1.computeParimutuelSettlement)([
                { playerId: 'W1', stake: 100 }, { playerId: 'W2', stake: 100 }, { playerId: 'W3', stake: 100 },
                { playerId: 'L1', stake: 33 },
            ], new Set(['W1', 'W2', 'W3']), 500);
            expect(r.totalPool).toBe(333);
            expect(r.houseCut).toBe(16);
            expect(r.netPool).toBe(317);
            var paid = r.payouts.reduce(function (a, p) { return a + p.payout; }, 0);
            expect(paid + r.residue).toBe(r.netPool); // conservation stricte
            expect(r.residue).toBeGreaterThanOrEqual(0);
        });
        it('push : remboursements intégraux, commission nulle (INV-16)', function () {
            var r = (0, parimutuel_1.computePushRefund)([{ playerId: 'A', stake: 700 }, { playerId: 'B', stake: 700 }]);
            expect(r.houseCut).toBe(0);
            expect(r.totalPaidOut).toBe(1400);
            expect(r.residue).toBe(0);
        });
    });
    describe('E2E avec Postgres de test', function () {
        var app;
        var prisma;
        var settlement;
        var players = [];
        beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            var moduleRef;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, testing_1.Test.createTestingModule({ imports: [app_module_1.AppModule] }).compile()];
                    case 1:
                        moduleRef = _a.sent();
                        app = moduleRef.createNestApplication();
                        return [4 /*yield*/, app.init()];
                    case 2:
                        _a.sent();
                        prisma = app.get(prisma_service_1.PrismaService);
                        settlement = app.get(bet_settlement_service_1.BetSettlementService);
                        return [4 /*yield*/, (0, wallet_fixture_1.ensureHouseWallet)(prisma)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); }, 60000);
        afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            var _i, players_1, p;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        for (_i = 0, players_1 = players; _i < players_1.length; _i++) { /* purge faite par cleanupPlayers */
                            p = players_1[_i];
                        }
                        if (!(prisma && players.length)) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, player_fixture_1.cleanupPlayers)(prisma, players)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!app) return [3 /*break*/, 4];
                        return [4 /*yield*/, app.close()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        it('règle un marché 1v1 : payouts exacts, houseCut au wallet HOUSE, ledger tracé', function () { return __awaiter(void 0, void 0, void 0, function () {
            var creator, opponent, _a, market, bets, houseBefore, s, payouts, winBal, loseBal, houseAfter, finalBets;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, player_fixture_1.makePlayer)(prisma, { credits: 5000 })];
                    case 1:
                        creator = _b.sent();
                        return [4 /*yield*/, (0, player_fixture_1.makePlayer)(prisma, { credits: 5000 })];
                    case 2:
                        opponent = _b.sent();
                        players = [creator, opponent];
                        return [4 /*yield*/, (0, bet_fixture_1.seedLockedOneVersusOne)(prisma, {
                                creatorId: creator.playerId, opponentId: opponent.playerId,
                                creatorWalletId: creator.walletId, opponentWalletId: opponent.walletId,
                                currency: 'SOFT', stake: 1000,
                            })];
                    case 3:
                        _a = _b.sent(), market = _a.market, bets = _a.bets;
                        return [4 /*yield*/, (0, wallet_fixture_1.houseBalances)(prisma)];
                    case 4:
                        houseBefore = _b.sent();
                        return [4 /*yield*/, settlement.settleMarket({ marketId: market.id, winningSide: bets[0].side })];
                    case 5:
                        s = _b.sent();
                        // INV-08 : pool 2000, cut 100, net 1900 versé au gagnant.
                        expect(s.totalPool).toBe(2000);
                        expect(s.houseCut).toBe(100);
                        expect(s.netPool).toBe(1900);
                        payouts = (0, bet_fixture_1.payoutsMap)(s);
                        expect(payouts[bets[0].id]).toBe(1900);
                        expect(payouts[bets[1].id]).toBe(0);
                        return [4 /*yield*/, (0, wallet_fixture_1.balancesForPlayer)(prisma, creator.playerId)];
                    case 6:
                        winBal = _b.sent();
                        expect(winBal.credits).toBe(5000 - 1000 + 1900);
                        return [4 /*yield*/, (0, wallet_fixture_1.balancesForPlayer)(prisma, opponent.playerId)];
                    case 7:
                        loseBal = _b.sent();
                        expect(loseBal.credits).toBe(5000 - 1000);
                        return [4 /*yield*/, (0, wallet_fixture_1.houseBalances)(prisma)];
                    case 8:
                        houseAfter = _b.sent();
                        expect(houseAfter.credits - houseBefore.credits).toBe(s.houseCut + s.residual);
                        return [4 /*yield*/, prisma.bet.findMany({ where: { marketId: market.id } })];
                    case 9:
                        finalBets = _b.sent();
                        expect(finalBets.map(function (b) { return b.status; }).sort()).toEqual(['LOST', 'WON']);
                        return [2 /*return*/];
                }
            });
        }); });
        it('re-settlement du même marché = no-op idempotent (INV-14)', function () { return __awaiter(void 0, void 0, void 0, function () {
            var openMarkets, marketId, before, balWinnerBefore, again, after, _a, balWinnerAfter;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, prisma.betMarket.findMany({ where: { status: 'SETTLED' }, take: 1 })];
                    case 1:
                        openMarkets = _b.sent();
                        expect(openMarkets.length).toBe(1);
                        marketId = openMarkets[0].id;
                        return [4 /*yield*/, (0, bet_fixture_1.settlementOf)(prisma, marketId)];
                    case 2:
                        before = _b.sent();
                        return [4 /*yield*/, prisma.wallet.findFirstOrThrow({ where: { player: { username: players[0].username } } })];
                    case 3:
                        balWinnerBefore = _b.sent();
                        return [4 /*yield*/, settlement.settleMarket({ marketId: marketId, winningSide: 0 })];
                    case 4:
                        again = _b.sent();
                        return [4 /*yield*/, (0, bet_fixture_1.settlementOf)(prisma, marketId)];
                    case 5:
                        after = _b.sent();
                        expect(again.id).toBe(before.id); // même settlement, pas de nouveau rang
                        expect(after.id).toBe(before.id);
                        _a = expect;
                        return [4 /*yield*/, (0, bet_fixture_1.settlementCount)(prisma, marketId)];
                    case 6:
                        _a.apply(void 0, [_b.sent()]).toBe(1); // UNIQUE(marketId) tienne
                        return [4 /*yield*/, prisma.wallet.findFirstOrThrow({ where: { player: { username: players[0].username } } })];
                    case 7:
                        balWinnerAfter = _b.sent();
                        expect(balWinnerAfter.credits).toBe(balWinnerBefore.credits); // zéro double paiement
                        return [2 /*return*/];
                }
            });
        }); });
        it('settlement manuel admin sans winningSide → push remboursé intégralement (INV-16)', function () { return __awaiter(void 0, void 0, void 0, function () {
            var c, o, market, s, bc, bo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, player_fixture_1.makePlayer)(prisma, { credits: 3000 })];
                    case 1:
                        c = _a.sent();
                        return [4 /*yield*/, (0, player_fixture_1.makePlayer)(prisma, { credits: 3000 })];
                    case 2:
                        o = _a.sent();
                        players = players.concat([c, o]);
                        return [4 /*yield*/, (0, bet_fixture_1.seedLockedOneVersusOne)(prisma, {
                                creatorId: c.playerId, opponentId: o.playerId,
                                creatorWalletId: c.walletId, opponentWalletId: o.walletId,
                                currency: 'SOFT', stake: 1000,
                            })];
                    case 3:
                        market = (_a.sent()).market;
                        return [4 /*yield*/, settlement.settleMarket({ marketId: market.id, push: true })];
                    case 4:
                        s = _a.sent();
                        expect(s.houseCut).toBe(0);
                        return [4 /*yield*/, (0, wallet_fixture_1.balancesForPlayer)(prisma, c.playerId)];
                    case 5:
                        bc = _a.sent();
                        return [4 /*yield*/, (0, wallet_fixture_1.balancesForPlayer)(prisma, o.playerId)];
                    case 6:
                        bo = _a.sent();
                        expect(bc.credits).toBe(3000); // mise récupérée intégralement
                        expect(bo.credits).toBe(3000);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
