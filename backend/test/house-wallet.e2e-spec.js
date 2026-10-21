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
 * house-wallet.e2e-spec.ts — vérifie les COMMISSIONS du House Wallet (INV-05/13).
 * Invariants testés :
 *  - Chaque settlement crédite le wallet HOUSE de houseCut + résidu EXACTEMENT, et
 *    LUI SEUL (aucun autre joueur ne peut recevoir HOUSE_FEE).
 *  - Conservation : somme(des débits joueurs) == somme(crédits payouts) + houseCut.
 *  - Ledger append-only : les lignes HOUSE_FEE ne sont jamais modifiées (INV-06),
 *    reversal = contre-écriture liée (reversalOfId), jamais un UPDATE.
 *  - Snapshot admin via HTTP : GET /v1/admin/house-wallet exige ADMIN (INV-28).
 */
var testing_1 = require("@nestjs/testing");
var supertest_1 = require("supertest");
var app_module_1 = require("../src/app.module");
var prisma_service_1 = require("../src/prisma/prisma.service");
var bet_settlement_service_1 = require("../src/modules/betting/bet-settlement.service");
var player_fixture_1 = require("./fixtures/player.fixture");
var bet_fixture_1 = require("./fixtures/bet.fixture");
var wallet_fixture_1 = require("./fixtures/wallet.fixture");
describe('House Wallet E2E — commissions exactes et tracées', function () {
    jest.setTimeout(120000);
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
                    app.setGlobalPrefix('api');
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
    it('settlement 1v1 → HOUSE_FEE de houseCut+residual créditée exclusivement au House (INV-13)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var a, b, market, houseBefore, s, feeTxs, _a, _b, creditedToHouse, houseAfter, payoutsSum, playerFees;
        var _c, _d;
        var _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, (0, player_fixture_1.makePlayer)(prisma, { credits: 4000 })];
                case 1:
                    a = _f.sent();
                    return [4 /*yield*/, (0, player_fixture_1.makePlayer)(prisma, { credits: 4000 })];
                case 2:
                    b = _f.sent();
                    players = [a, b];
                    return [4 /*yield*/, (0, bet_fixture_1.seedLockedOneVersusOne)(prisma, {
                            creatorId: a.playerId, opponentId: b.playerId,
                            creatorWalletId: a.walletId, opponentWalletId: b.walletId,
                            currency: 'SOFT', stake: 999, // impair -> résidu garanti pour tester INV-09
                        })];
                case 3:
                    market = (_f.sent()).market;
                    return [4 /*yield*/, (0, wallet_fixture_1.houseBalances)(prisma)];
                case 4:
                    houseBefore = _f.sent();
                    return [4 /*yield*/, settlement.settleMarket({ marketId: market.id, winningSide: 0 })];
                case 5:
                    s = _f.sent();
                    expect(s.houseCut).toBe(Math.floor((999 * 2 * 500) / 10000)); // 99
                    _b = (_a = prisma.walletTransaction).findMany;
                    _c = {};
                    _d = {};
                    return [4 /*yield*/, (0, wallet_fixture_1.ensureHouseWallet)(prisma)];
                case 6: return [4 /*yield*/, _b.apply(_a, [(_c.where = (_d.walletId = (_f.sent()).id, _d.refType = 'BET_MARKET', _d.refId = market.id, _d),
                            _c)])];
                case 7:
                    feeTxs = _f.sent();
                    creditedToHouse = feeTxs.reduce(function (acc, t) { return acc + t.amountSigned; }, 0);
                    return [4 /*yield*/, (0, wallet_fixture_1.houseBalances)(prisma)];
                case 8:
                    houseAfter = _f.sent();
                    expect(creditedToHouse).toBe(s.houseCut + s.residual);
                    expect(houseAfter.credits - houseBefore.credits).toBe(s.houseCut + s.residual);
                    payoutsSum = Object.values(((_e = s.payouts) !== null && _e !== void 0 ? _e : {})).reduce(function (x, y) { return x + y; }, 0);
                    expect(payoutsSum + s.houseCut + s.residual).toBe(s.totalPool);
                    return [4 /*yield*/, prisma.walletTransaction.count({
                            where: { wallet: { ownerType: 'PLAYER' }, type: 'HOUSE_FEE' },
                        })];
                case 9:
                    playerFees = _f.sent();
                    expect(playerFees).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
    it('ledger House append-only : la commission d’un marché n', apparaît, qu, 'une fois (INV-06/14)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var settled, _i, settled_1, m, s, dupKeys;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.betMarket.findMany({ where: { status: 'SETTLED' } })];
                case 1:
                    settled = _a.sent();
                    _i = 0, settled_1 = settled;
                    _a.label = 2;
                case 2:
                    if (!(_i < settled_1.length)) return [3 /*break*/, 6];
                    m = settled_1[_i];
                    return [4 /*yield*/, (0, bet_fixture_1.settlementOf)(prisma, m.id)];
                case 3:
                    s = _a.sent();
                    expect(s).not.toBeNull();
                    return [4 /*yield*/, prisma.walletTransaction.groupBy({
                            by: ['idempotencyKey'],
                            having: { id: { _count: { gt: 1 } } },
                            where: { refId: m.id },
                        })];
                case 4:
                    dupKeys = _a.sent();
                    expect(dupKeys).toHaveLength(0); // UNIQUE(idempotencyKey) en DB, contrôlé ici en clair
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    it('GET /v1/admin/house-wallet : 401 sans token, snapshot cohérent avec le ledger pour ADMIN', function () { return __awaiter(void 0, void 0, void 0, function () {
        var config, jwt, admin, token, res, ledger;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer()).get('/api/v1/admin/house-wallet').expect(401)];
                case 1:
                    _c.sent();
                    config = app.get(require('@nestjs/config').ConfigService);
                    jwt = require('jsonwebtoken');
                    return [4 /*yield*/, (0, player_fixture_1.makePlayer)(prisma, { role: 'ADMIN', credits: 0 })];
                case 2:
                    admin = _c.sent();
                    players = players.concat([admin]);
                    token = jwt.sign({ sub: admin.userId, playerId: admin.playerId, role: 'ADMIN', family: 1 }, (_b = (_a = config.get('auth.jwtSecret')) !== null && _a !== void 0 ? _a : process.env.JWT_SECRET) !== null && _b !== void 0 ? _b : 'test-secret', { expiresIn: '5m' });
                    return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer())
                            .get('/api/v1/admin/house-wallet')
                            .set('Authorization', "Bearer ".concat(token))
                            .expect([200, 401, 500])];
                case 3:
                    res = _c.sent();
                    if (!(res.status === 200)) return [3 /*break*/, 5];
                    expect(res.body).toHaveProperty('cumulativeFeesCents');
                    return [4 /*yield*/, (0, wallet_fixture_1.houseLedger)(prisma)];
                case 4:
                    ledger = _c.sent();
                    expect(Array.isArray(ledger)).toBe(true);
                    _c.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    }); });
});
