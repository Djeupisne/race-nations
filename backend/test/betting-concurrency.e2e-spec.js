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
 * betting-concurrency.e2e-spec.ts — preuve anti double-débit sous requêtes simultanées.
 * Scénario A : N=10 jointures concurrentes d'un même challenger sur un marché OPEN
 *   → exactement UNE position (UNIQUE(marketId,playerId)) et UN seul escrow débité.
 * Scénario B : deux challenges DIFFÉRENTS tirent en parallèle sur le même wallet
 *   solde 1 500 pour deux stakes de 1 000 → au plus UNE acceptation (le second doit
 *   échouer InsufficientFunds), jamais de solde négatif (INV-02, SELECT ... FOR UPDATE).
 * Scénario C : settleMarket() appelé 5x en parallèle sur le même marché verrouillé
 *   → un seul BetSettlement, paiements uniques (verrou UNIQUE + clés ledger dérivées).
 */
var testing_1 = require("@nestjs/testing");
var app_module_1 = require("../src/app.module");
var prisma_service_1 = require("../src/prisma/prisma.service");
var betting_service_1 = require("../src/modules/betting/betting.service");
var bet_settlement_service_1 = require("../src/modules/betting/bet-settlement.service");
var player_fixture_1 = require("./fixtures/player.fixture");
var bet_fixture_1 = require("./fixtures/bet.fixture");
var wallet_fixture_1 = require("./fixtures/wallet.fixture");
var TRACK_ID = '11111111-1111-4111-8111-111111111111';
function settleAll(promises) {
    return __awaiter(this, void 0, void 0, function () {
        var results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.allSettled(promises)];
                case 1:
                    results = _a.sent();
                    return [2 /*return*/, results.map(function (r) { return (r.status === 'fulfilled' ? { ok: true, value: r.value } : { ok: false, error: r.reason }); })];
            }
        });
    });
}
describe('Betting concurrency E2E — pas de double-débit', function () {
    jest.setTimeout(120000);
    var app;
    var prisma;
    var betting;
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
                    betting = app.get(betting_service_1.BettingService);
                    settlement = app.get(bet_settlement_service_1.BetSettlementService);
                    return [4 /*yield*/, (0, wallet_fixture_1.ensureHouseWallet)(prisma)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 60000);
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
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
    it('A — 10 join simultanés du même joueur → 1 bet, 1 escrow', function () { return __awaiter(void 0, void 0, void 0, function () {
        var creator, challenger, market, attempts, successes, bets, escrows, wallet;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, player_fixture_1.makePlayer)(prisma, { credits: 10000 })];
                case 1:
                    creator = _a.sent();
                    return [4 /*yield*/, (0, player_fixture_1.makePlayer)(prisma, { credits: 10000 })];
                case 2:
                    challenger = _a.sent();
                    players = [creator, challenger];
                    return [4 /*yield*/, (0, bet_fixture_1.seedMarket)(prisma, { creatorId: creator.playerId, currency: 'SOFT', stake: 500, status: 'OPEN' })];
                case 3:
                    market = _a.sent();
                    // Escrow créateur simulé par la fixture (même forme qu'en flux HTTP).
                    return [4 /*yield*/, prisma.wallet.update({ where: { id: creator.walletId }, data: { credits: { decrement: 500 } } })];
                case 4:
                    // Escrow créateur simulé par la fixture (même forme qu'en flux HTTP).
                    _a.sent();
                    return [4 /*yield*/, prisma.bet.create({
                            data: { marketId: market.id, playerId: creator.playerId, side: 0, stake: 500, status: 'ESCROWED' },
                        })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, settleAll(Array.from({ length: 10 }, function () { return betting.joinMarket(market.id, { id: challenger.playerId }); }))];
                case 6:
                    attempts = _a.sent();
                    successes = attempts.filter(function (a) { return a.ok; }).length;
                    return [4 /*yield*/, prisma.bet.findMany({ where: { marketId: market.id, playerId: challenger.playerId } })];
                case 7:
                    bets = _a.sent();
                    expect(successes).toBeLessThanOrEqual(1); // une seule victoire de course autorisée
                    expect(bets.length).toBe(1); // UNIQUE(marketId, playerId) protège
                    return [4 /*yield*/, prisma.walletTransaction.count({
                            where: { walletId: challenger.walletId, type: 'BET_ESCROW' },
                        })];
                case 8:
                    escrows = _a.sent();
                    expect(escrows).toBeLessThanOrEqual(1); // jamais de double débit
                    return [4 /*yield*/, prisma.wallet.findUniqueOrThrow({ where: { id: challenger.walletId } })];
                case 9:
                    wallet = _a.sent();
                    expect(wallet.credits).toBeGreaterThanOrEqual(10000 - 500); // débit ≤ 1× stake
                    return [2 /*return*/];
            }
        });
    }); });
    it('B — 2 marchés simultanés sur un wallet trop peu garni → max 1 succès, solde >= 0 (INV-02)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var creator, poor, m1, m2, attempts, ok, wallet;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, player_fixture_1.makePlayer)(prisma, { credits: 10000 })];
                case 1:
                    creator = _a.sent();
                    return [4 /*yield*/, (0, player_fixture_1.makePlayer)(prisma, { credits: 1500 })];
                case 2:
                    poor = _a.sent();
                    players = players.concat([creator, poor]);
                    return [4 /*yield*/, (0, bet_fixture_1.seedMarket)(prisma, { creatorId: creator.playerId, currency: 'SOFT', stake: 1000, status: 'OPEN' })];
                case 3:
                    m1 = _a.sent();
                    return [4 /*yield*/, (0, bet_fixture_1.seedMarket)(prisma, { creatorId: creator.playerId, currency: 'SOFT', stake: 1000, status: 'OPEN' })];
                case 4:
                    m2 = _a.sent();
                    return [4 /*yield*/, settleAll([
                            betting.joinMarket(m1.id, { id: poor.playerId }),
                            betting.joinMarket(m2.id, { id: poor.playerId }),
                        ])];
                case 5:
                    attempts = _a.sent();
                    ok = attempts.filter(function (a) { return a.ok; }).length;
                    expect(ok).toBeLessThanOrEqual(1); // l'autre doit lever InsufficientFunds
                    return [4 /*yield*/, prisma.wallet.findUniqueOrThrow({ where: { id: poor.walletId } })];
                case 6:
                    wallet = _a.sent();
                    expect(wallet.credits).toBeGreaterThanOrEqual(0); // Jamais négatif — la règle d'or.
                    void TRACK_ID;
                    return [2 /*return*/];
            }
        });
    }); });
    it('C — settleMarket() x5 en parallèle → 1 settlement, 1 flux de paiements', function () { return __awaiter(void 0, void 0, void 0, function () {
        var c, o, market, attempts, _a, payoutTxs, wallet;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, player_fixture_1.makePlayer)(prisma, { credits: 5000 })];
                case 1:
                    c = _b.sent();
                    return [4 /*yield*/, (0, player_fixture_1.makePlayer)(prisma, { credits: 5000 })];
                case 2:
                    o = _b.sent();
                    players = players.concat([c, o]);
                    return [4 /*yield*/, (0, bet_fixture_1.seedLockedOneVersusOne)(prisma, {
                            creatorId: c.playerId, opponentId: o.playerId,
                            creatorWalletId: c.walletId, opponentWalletId: o.walletId,
                            currency: 'SOFT', stake: 1000,
                        })];
                case 3:
                    market = (_b.sent()).market;
                    return [4 /*yield*/, settleAll(Array.from({ length: 5 }, function () { return settlement.settleMarket({ marketId: market.id, winningSide: 0 }); }))];
                case 4:
                    attempts = _b.sent();
                    // Soit idempotence silencieuse (ok), soit BetAlreadySettled (ko) — les deux sont sûrs ;
                    // ce qui ne peut PAS arriver : deux settlements physiques ou deux payouts.
                    expect(attempts.length).toBe(5);
                    _a = expect;
                    return [4 /*yield*/, (0, bet_fixture_1.settlementCount)(prisma, market.id)];
                case 5:
                    _a.apply(void 0, [_b.sent()]).toBe(1);
                    return [4 /*yield*/, prisma.walletTransaction.count({
                            where: { walletId: c.walletId, type: 'BET_PAYOUT' },
                        })];
                case 6:
                    payoutTxs = _b.sent();
                    expect(payoutTxs).toBeLessThanOrEqual(1); // zéro double crédit non plus
                    return [4 /*yield*/, prisma.wallet.findUniqueOrThrow({ where: { id: c.walletId } })];
                case 7:
                    wallet = _b.sent();
                    expect(wallet.credits).toBe(5000 - 1000 + 1900); // escrow puis netPool exact, une fois
                    return [2 /*return*/];
            }
        });
    }); });
});
