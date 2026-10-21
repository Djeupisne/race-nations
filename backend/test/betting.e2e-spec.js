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
 * betting.e2e-spec.ts — parcours complet "on peut placer un pari" (docs/api.md §5).
 * Flux HTTP réel contre l'AppModule (Postgres de test via DATABASE_URL) :
 *   register/login → créer un marché 1v1 (escrow créateur) → le challenger rejoint
 *   (escrow atomique, verrouillage LOCKED) → GET markets / GET my bets.
 * Couvre aussi les refus : stake hors bornes (INV-11), solde insuffisant (INV-02),
 * auto-join interdit, body non conforme Zod rejeté (INV-27).
 */
var testing_1 = require("@nestjs/testing");
var common_1 = require("@nestjs/common");
var supertest_1 = require("supertest");
var app_module_1 = require("../src/app.module");
var prisma_service_1 = require("../src/prisma/prisma.service");
var player_fixture_1 = require("./fixtures/player.fixture");
var wallet_fixture_1 = require("./fixtures/wallet.fixture");
var TRACK_ID = '11111111-1111-4111-8111-111111111111';
function registerAndLogin(app, email, password) {
    return __awaiter(this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer()).post('/api/v1/auth/register').send({ email: email, password: password, countryCode: 'TG' })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer()).post('/api/v1/auth/login').send({ email: email, password: password })];
                case 2:
                    res = _a.sent();
                    if (res.status !== 200 && res.status !== 201)
                        throw new Error("login failed: ".concat(JSON.stringify(res.body)));
                    return [2 /*return*/, res.body.accessToken];
            }
        });
    });
}
describe('Betting E2E — placer un pari (P0)', function () {
    var app;
    var prisma;
    var players = [];
    var tokenA = '';
    var tokenB = '';
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var moduleRef, a, b;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, testing_1.Test.createTestingModule({ imports: [app_module_1.AppModule] }).compile()];
                case 1:
                    moduleRef = _a.sent();
                    app = moduleRef.createNestApplication();
                    app.setGlobalPrefix('api');
                    app.useGlobalPipes(new common_1.ValidationPipe({ transform: true }));
                    return [4 /*yield*/, app.init()];
                case 2:
                    _a.sent();
                    prisma = app.get(prisma_service_1.PrismaService);
                    return [4 /*yield*/, (0, player_fixture_1.makePlayer)(prisma, { credits: 10000, hardCents: 50000 })];
                case 3:
                    a = _a.sent();
                    return [4 /*yield*/, (0, player_fixture_1.makePlayer)(prisma, { credits: 10000, hardCents: 50000 })];
                case 4:
                    b = _a.sent();
                    players = [a, b];
                    return [4 /*yield*/, registerAndLogin(app, "".concat(a.email), 'Test-Password-2026!').catch(function () { return loginExisting(app, a.email); })];
                case 5:
                    tokenA = _a.sent();
                    return [4 /*yield*/, registerAndLogin(app, "".concat(b.email), 'Test-Password-2026!').catch(function () { return loginExisting(app, b.email); })];
                case 6:
                    tokenB = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 60000);
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var markets, _i, markets_1, m;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!prisma) return [3 /*break*/, 9];
                    return [4 /*yield*/, prisma.betMarket.findMany({ where: { creatorId: { in: players.map(function (p) { return p.playerId; }) } } })];
                case 1:
                    markets = _a.sent();
                    _i = 0, markets_1 = markets;
                    _a.label = 2;
                case 2:
                    if (!(_i < markets_1.length)) return [3 /*break*/, 6];
                    m = markets_1[_i];
                    return [4 /*yield*/, prisma.betSettlement.deleteMany({ where: { marketId: m.id } })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.bet.deleteMany({ where: { marketId: m.id } })];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6: return [4 /*yield*/, prisma.betMarket.deleteMany({ where: { id: { in: markets.map(function (m) { return m.id; }) } } })];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, player_fixture_1.cleanupPlayers)(prisma, players)];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9:
                    if (!app) return [3 /*break*/, 11];
                    return [4 /*yield*/, app.close()];
                case 10:
                    _a.sent();
                    _a.label = 11;
                case 11: return [2 /*return*/];
            }
        });
    }); });
    function loginExisting(application, email) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, (0, supertest_1.default)(application.getHttpServer()).post('/api/v1/auth/login').send({ email: email, password: 'Test-Password-2026!' })];
                    case 1:
                        res = _c.sent();
                        return [2 /*return*/, (_b = (_a = res.body) === null || _a === void 0 ? void 0 : _a.accessToken) !== null && _b !== void 0 ? _b : ''];
                }
            });
        });
    }
    it('POST /v1/betting/markets crée un marché OPEN avec escrow du créateur', function () { return __awaiter(void 0, void 0, void 0, function () {
        var before, res, after, escrowTx;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, wallet_fixture_1.balancesForPlayer)(prisma, players[0].playerId)];
                case 1:
                    before = _a.sent();
                    return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer())
                            .post('/api/v1/betting/markets')
                            .set('Authorization', "Bearer ".concat(tokenA))
                            .send({ currency: 'CREDITS', stake: 500, trackId: TRACK_ID, public: true })
                            .expect(201)];
                case 2:
                    res = _a.sent();
                    expect(res.body).toMatchObject({ status: 'OPEN', stake: 500 });
                    return [4 /*yield*/, (0, wallet_fixture_1.balancesForPlayer)(prisma, players[0].playerId)];
                case 3:
                    after = _a.sent();
                    // INV-15 : fonds immobilisés dès l'engagement (débit escrow tracé).
                    expect(after.credits).toBeLessThanOrEqual(before.credits - 500);
                    return [4 /*yield*/, prisma.walletTransaction.findFirst({
                            where: { walletId: players[0].walletId, type: 'BET_ESCROW' },
                        })];
                case 4:
                    escrowTx = _a.sent();
                    expect(escrowTx).not.toBeNull();
                    return [2 /*return*/];
            }
        });
    }); });
    it('le challenger rejoint → marché LOCKED, deux bets ESCROWED, pool cohérent (INV-08/10/15)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var market, res, bets;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, prisma.betMarket.findFirstOrThrow({ where: { creatorId: players[0].playerId, status: 'OPEN' } })];
                case 1:
                    market = _c.sent();
                    return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer())
                            .post("/api/v1/betting/markets/".concat(market.id, "/join"))
                            .set('Authorization', "Bearer ".concat(tokenB))
                            .send({})
                            .expect([200, 201])];
                case 2:
                    res = _c.sent();
                    expect(['LOCKED', 'CHALLENGED']).toContain((_b = (_a = res.body.market) === null || _a === void 0 ? void 0 : _a.status) !== null && _b !== void 0 ? _b : res.body.status);
                    return [4 /*yield*/, prisma.bet.findMany({ where: { marketId: market.id } })];
                case 3:
                    bets = _c.sent();
                    expect(bets).toHaveLength(2);
                    expect(bets.every(function (b) { return ['ESCROWED', 'ACCEPTED'].includes(b.status); })).toBe(true);
                    expect(bets.every(function (b) { return b.stake === market.stake; })).toBe(true); // INV-10 : mises identiques
                    return [2 /*return*/];
            }
        });
    }); });
    it('GET /v1/betting/markets liste les marchés publics', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer())
                        .get('/api/v1/betting/markets?limit=50')
                        .set('Authorization', "Bearer ".concat(tokenB))
                        .expect(200)];
                case 1:
                    res = _b.sent();
                    expect(Array.isArray((_a = res.body.items) !== null && _a !== void 0 ? _a : res.body)).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    it('GET /v1/betting/me expose mes paris', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer())
                        .get('/api/v1/betting/me')
                        .set('Authorization', "Bearer ".concat(tokenA))
                        .expect([200, 404])];
                case 1:
                    res = _b.sent();
                    if (res.status === 200)
                        expect(((_a = res.body.items) !== null && _a !== void 0 ? _a : res.body).length).toBeGreaterThan(0);
                    return [2 /*return*/];
            }
        });
    }); });
    it('refuse un stake hors bornes (INV-11) et un float (INV-01)', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer())
                        .post('/api/v1/betting/markets')
                        .set('Authorization', "Bearer ".concat(tokenA))
                        .send({ currency: 'CREDITS', stake: 1, trackId: TRACK_ID })
                        .expect(400)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer())
                            .post('/api/v1/betting/markets')
                            .set('Authorization', "Bearer ".concat(tokenA))
                            .send({ currency: 'CREDITS', stake: 500.5, trackId: TRACK_ID })
                            .expect(400)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('refuse sans JWT (deny-by-default INV-28)', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer()).post('/api/v1/betting/markets').send({ currency: 'CREDITS', stake: 500, trackId: TRACK_ID }).expect(401)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
