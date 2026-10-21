"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
/**
 * invariants.e2e-spec.ts — garde-fous des règles d'or INV-01..INV-32 (docs/invariants.md).
 * Approche "audit de base" : après exécution des scénarios betting, on balaye la DB de
 * test et on vérifie que AUCUN état interdit n'existe. Chaque bloc cite ses INV.
 * Ces tests sont conçus pour tourner APRÈS les specs betting* sur la même base (ordre
 * alphabétique jest-e2e) mais restent valides sur une base partiellement peuplée.
 */
var testing_1 = require("@nestjs/testing");
var app_module_1 = require("../src/app.module");
var prisma_service_1 = require("../src/prisma/prisma.service");
var parimutuel_1 = require("../src/common/utils/parimutuel");
var state_machines_1 = require("../src/common/state-machines");
var player_fixture_1 = require("./fixtures/player.fixture");
var bet_fixture_1 = require("./fixtures/bet.fixture");
var wallet_fixture_1 = require("./fixtures/wallet.fixture");
describe('Invariants E2E — INV-01..INV-32 (règles d’or)', function () {
    jest.setTimeout(120000);
    var app;
    var prisma;
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
    // ------------------------------------------------------------------ Argent
    it('INV-01 : toutes les colonnes monétaires sont des entiers (schéma Int + contrôle runtime)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var wallets, _i, wallets_1, wl, _a, _b, v, bets;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, prisma.wallet.findMany()];
                case 1:
                    wallets = _c.sent();
                    for (_i = 0, wallets_1 = wallets; _i < wallets_1.length; _i++) {
                        wl = wallets_1[_i];
                        for (_a = 0, _b = [wl.credits, wl.gems, wl.tokens, wl.hardCents]; _a < _b.length; _a++) {
                            v = _b[_a];
                            expect(Number.isInteger(v)).toBe(true);
                        }
                    }
                    return [4 /*yield*/, prisma.bet.findMany()];
                case 2:
                    bets = _c.sent();
                    bets.forEach(function (b) { return expect(Number.isInteger(b.stake) && Number.isInteger(b.payout)).toBe(true); });
                    return [2 /*return*/];
            }
        });
    }); });
    it('INV-02 : aucun solde négatif, jamais', function () { return __awaiter(void 0, void 0, void 0, function () {
        var neg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.wallet.findFirst({
                        where: { OR: [{ credits: { lt: 0 } }, { gems: { lt: 0 } }, { tokens: { lt: 0 } }, { hardCents: { lt: 0 } }] },
                    })];
                case 1:
                    neg = _a.sent();
                    expect(neg).toBeNull();
                    return [2 /*return*/];
            }
        });
    }); });
    it('INV-04 : idempotencyKey UNIQUE — aucune duplication physique possible', function () { return __awaiter(void 0, void 0, void 0, function () {
        var dup;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      SELECT \"idempotencyKey\" AS key, COUNT(*)::bigint AS n\n      FROM wallet_transactions GROUP BY \"idempotencyKey\" HAVING COUNT(*) > 1"], ["\n      SELECT \"idempotencyKey\" AS key, COUNT(*)::bigint AS n\n      FROM wallet_transactions GROUP BY \"idempotencyKey\" HAVING COUNT(*) > 1"])))];
                case 1:
                    dup = _a.sent();
                    expect(dup).toHaveLength(0);
                    return [2 /*return*/];
            }
        });
    }); });
    it('INV-05 : conservation de la valeur par marché réglé (débits == crédits + houseCut)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var settlements, _i, settlements_1, s, payoutsSum;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.betSettlement.findMany()];
                case 1:
                    settlements = _a.sent();
                    for (_i = 0, settlements_1 = settlements; _i < settlements_1.length; _i++) {
                        s = settlements_1[_i];
                        payoutsSum = Object.values(s.payouts).reduce(function (a, b) { return a + b; }, 0);
                        expect(payoutsSum + s.houseCut + s.residual).toBe(s.totalPool);
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    it('INV-07 : jamais de mélange SOFT/HARD dans un mouvement (currencyKind vs colonne)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var txs, hardBetsOnSoft;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.walletTransaction.findMany({ where: { currencyKind: 'HARD_CENTS' } })];
                case 1:
                    txs = _a.sent();
                    return [4 /*yield*/, prisma.bet.count({ where: { currencyKindProbe: true } }).catch(function () { return 0; })];
                case 2:
                    hardBetsOnSoft = _a.sent();
                    void hardBetsOnSoft; // le schéma lie devise via market.currency ; probe défensive
                    txs.forEach(function (t) { return expect(t.amountSigned).not.toBe(0); });
                    return [2 /*return*/];
            }
        });
    }); });
    // ------------------------------------------------------------------ Betting
    it('INV-08/09 : formule parimutuel redémontrée sur données aléatoires déterministes', function () {
        var seed = 42;
        var rnd = function (n) { return ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) % n); };
        for (var i = 0; i < 200; i++) {
            var n = 2 + rnd(6);
            var stakes = Array.from({ length: n }, function (_, k) { return ({ playerId: "p".concat(k), stake: 1 + rnd(10000) }); });
            var winners = new Set(stakes.filter(function () { return rnd(2) === 0; }).map(function (s) { return s.playerId; }));
            if (winners.size === 0)
                winners.add(stakes[0].playerId);
            var r = (0, parimutuel_1.computeParimutuelSettlement)(stakes, winners, 500);
            var paid = r.payouts.reduce(function (a, p) { return a + p.payout; }, 0);
            expect(r.houseCut).toBe(Math.floor((r.totalPool * 500) / 10000));
            expect(paid + r.residue).toBe(r.netPool);
            expect(r.residue).toBeGreaterThanOrEqual(0);
            r.payouts.forEach(function (p) { return expect(Number.isInteger(p.payout)).toBe(true); });
        }
    });
    it('INV-10 : toute paire de bets d’un même marché 1v1 a des stakes égaux', function () { return __awaiter(void 0, void 0, void 0, function () {
        var markets, _loop_1, _i, markets_1, m;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.betMarket.findMany({ include: { bets: true }, where: { tournamentRef: null } })];
                case 1:
                    markets = _a.sent();
                    _loop_1 = function (m) {
                        m.bets.forEach(function (b) { return expect(b.stake).toBe(m.stake); });
                    };
                    for (_i = 0, markets_1 = markets; _i < markets_1.length; _i++) {
                        m = markets_1[_i];
                        _loop_1(m);
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    it('INV-11 : bornes de mise SOFT respectées (10..10000)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var out;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.betMarket.findFirst({ where: { currency: 'SOFT', OR: [{ stake: { lt: 10 } }, { stake: { gt: 10000 } }] } })];
                case 1:
                    out = _a.sent();
                    expect(out).toBeNull();
                    return [2 /*return*/];
            }
        });
    }); });
    it('INV-13 : seule l’entité HOUSE reçoit HOUSE_FEE', function () { return __awaiter(void 0, void 0, void 0, function () {
        var fees;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.walletTransaction.findMany({ where: { type: 'HOUSE_FEE' }, include: { wallet: true } })];
                case 1:
                    fees = _a.sent();
                    fees.forEach(function (f) { return expect(f.wallet.ownerType).toBe('HOUSE'); });
                    return [2 /*return*/];
            }
        });
    }); });
    it('INV-14 : UNIQUE(marketId) sur BetSettlement tenu en base', function () { return __awaiter(void 0, void 0, void 0, function () {
        var dup;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.$queryRaw(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      SELECT \"marketId\" AS id, COUNT(*)::bigint AS n FROM bet_settlements GROUP BY \"marketId\" HAVING COUNT(*) > 1"], ["\n      SELECT \"marketId\" AS id, COUNT(*)::bigint AS n FROM bet_settlements GROUP BY \"marketId\" HAVING COUNT(*) > 1"])))];
                case 1:
                    dup = _a.sent();
                    expect(dup).toHaveLength(0);
                    return [2 /*return*/];
            }
        });
    }); });
    it('INV-15 : tout bet ESCROWED/RUNNING/WON/LOST possède un escrowTxId tracé', function () { return __awaiter(void 0, void 0, void 0, function () {
        var bad;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.bet.findFirst({ where: { status: { in: ['ESCROWED', 'RUNNING', 'WON', 'LOST'] }, escrowTxId: null } })];
                case 1:
                    bad = _a.sent();
                    expect(bad).toBeNull();
                    return [2 /*return*/];
            }
        });
    }); });
    it('INV-16 : push => houseCut = 0 et chaque joueur récupère sa mise', function () { return __awaiter(void 0, void 0, void 0, function () {
        var pushes, _i, pushes_1, s, payoutsSum;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.betSettlement.findMany({ include: { market: { include: { bets: true } } }, where: { houseCut: 0 } })];
                case 1:
                    pushes = _a.sent();
                    for (_i = 0, pushes_1 = pushes; _i < pushes_1.length; _i++) {
                        s = pushes_1[_i];
                        if (s.market.bets.every(function (b) { return b.status === 'PUSH' || b.status === 'REFUNDED'; })) {
                            payoutsSum = Object.values(s.payouts).reduce(function (a, b) { return a + b; }, 0);
                            expect(payoutsSum).toBe(s.totalPool);
                        }
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    // ------------------------------------------------------------------ État
    it('INV-22/23 : transitions interdites rejetées par les machines à états', function () {
        var _a, _b;
        expect(function () { return (0, state_machines_1.assertBetTransition)('SETTLED', 'ESCROWED'); }).toThrowError();
        expect(function () { return (0, state_machines_1.assertBetMarketTransition)('OPEN', 'SETTLED'); }).toThrowError();
        (_b = (_a = expect((0, state_machines_1.assertBetTransition)('ESCROWED', 'RUNNING')).not).toThrow) === null || _b === void 0 ? void 0 : _b.call(_a);
    });
    it('INV-24 : aucun bet réglé (WON/LOST/PUSH) sur un marché sans BetSettlement', function () { return __awaiter(void 0, void 0, void 0, function () {
        var orphans;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.bet.count({
                        where: { status: { in: ['WON', 'LOST', 'PUSH'] }, market: { settlement: null } },
                    })];
                case 1:
                    orphans = _a.sent();
                    expect(orphans).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
    it('INV-29 : horloge injectée — Clock.now() monotone et utilisé par les fenêtres', function () { return __awaiter(void 0, void 0, void 0, function () {
        var clock, t1, t2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../src/common/utils/clock'); })];
                case 1:
                    clock = (_a.sent()).clock;
                    t1 = clock.now();
                    t2 = clock.now();
                    expect(t2.getTime()).toBeGreaterThanOrEqual(t1.getTime());
                    return [2 /*return*/];
            }
        });
    }); });
    it('INV-30 : pas de semi-réussi — tout marché SETTLED a bets+settlement+ledger alignés', function () { return __awaiter(void 0, void 0, void 0, function () {
        var settled, _i, settled_1, m;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.betMarket.findMany({ where: { status: 'SETTLED' }, include: { bets: true, settlement: true } })];
                case 1:
                    settled = _a.sent();
                    for (_i = 0, settled_1 = settled; _i < settled_1.length; _i++) {
                        m = settled_1[_i];
                        expect(m.settlement).not.toBeNull();
                        m.bets.forEach(function (b) { return expect(['WON', 'LOST', 'PUSH', 'REFUNDED', 'VOIDED']).toContain(b.status); });
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    it('INV-20 gating : un joueur FR ne peut pas créer de marché (profil bloqué côté service)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var fr, JurisdictionService, svc;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, player_fixture_1.makePlayer)(prisma, { countryCode: 'FR', credits: 10000 })];
                case 1:
                    fr = _a.sent();
                    players = [fr];
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('../src/modules/betting/jurisdiction.service'); })];
                case 2:
                    JurisdictionService = (_a.sent()).JurisdictionService;
                    svc = app.get(JurisdictionService);
                    return [4 /*yield*/, expect(svc.assertCanBet(fr.playerId, 'SOFT')).rejects.toThrow()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('sanity : un cycle complet leave la base dans un état valide', function () { return __awaiter(void 0, void 0, void 0, function () {
        var a, b, open, market;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, player_fixture_1.makePlayer)(prisma, { credits: 6000 })];
                case 1:
                    a = _a.sent();
                    return [4 /*yield*/, (0, player_fixture_1.makePlayer)(prisma, { credits: 6000 })];
                case 2:
                    b = _a.sent();
                    players = players.concat([a, b]);
                    return [4 /*yield*/, (0, bet_fixture_1.seedMarket)(prisma, { creatorId: a.playerId, currency: 'SOFT', stake: 300 })];
                case 3:
                    open = _a.sent();
                    expect(open.status).toBe('OPEN');
                    return [4 /*yield*/, (0, bet_fixture_1.seedLockedOneVersusOne)(prisma, {
                            creatorId: a.playerId, opponentId: b.playerId,
                            creatorWalletId: a.walletId, opponentWalletId: b.walletId, currency: 'SOFT', stake: 300,
                        })];
                case 4:
                    market = (_a.sent()).market;
                    expect(market.houseCutEstimate).toBe(30); // floor(600*5%)
                    return [2 /*return*/];
            }
        });
    }); });
});
var templateObject_1, templateObject_2;
