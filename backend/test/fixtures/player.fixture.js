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
exports.makePlayer = makePlayer;
exports.makeBettingDuo = makeBettingDuo;
exports.cleanupPlayers = cleanupPlayers;
/**
 * player.fixture.ts — création de joueurs de test (User + Player + wallet) pour les E2E.
 * Les fixtures écrivent DIRECTEMENT en base (chemin court) : l'inscription API complète
 * est couverte par auth.e2e-spec.ts. Ici on veut des profils déterministes pour les
 * tests betting/house-wallet/invariants, conformes aux règles du serveur :
 *  - countryCode 'TG' (Togo) → paris HARD autorisés (INV-20, licence LONATO).
 *  - countryCode 'FR'         → blocage SOFT/HARD (matrice game-modes.md §10.5).
 *  - reputation >= 30 + ageVerified → éligible HARD (INV-21).
 */
var argon2_1 = require("argon2");
var node_crypto_1 = require("node:crypto");
var seq = 0;
/** Insère User + Player + Wallet atomiquement et retourne les identifiants. */
function makePlayer(prisma_1) {
    return __awaiter(this, arguments, void 0, function (prisma, options) {
        var username, email, userId, playerId, walletId;
        var _this = this;
        var _a, _b, _c, _d;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    seq += 1;
                    username = (_a = options.username) !== null && _a !== void 0 ? _a : "test_player_".concat(Date.now(), "_").concat(seq);
                    email = (_b = options.email) !== null && _b !== void 0 ? _b : "".concat(username, "@test.racenations.local");
                    userId = (0, node_crypto_1.randomUUID)();
                    playerId = (0, node_crypto_1.randomUUID)();
                    walletId = (0, node_crypto_1.randomUUID)();
                    return [4 /*yield*/, prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var _a, _b;
                            var _c, _d;
                            var _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
                            return __generator(this, function (_q) {
                                switch (_q.label) {
                                    case 0:
                                        _b = (_a = tx.user).create;
                                        _c = {};
                                        _d = {
                                            id: userId,
                                            email: email
                                        };
                                        return [4 /*yield*/, (0, argon2_1.hash)('Test-Password-2026!')];
                                    case 1: return [4 /*yield*/, _b.apply(_a, [(_c.data = (
                                            // argon2id comme en production ; mot de passe de test fixe (déterminisme).
                                            _d.passwordHash = _q.sent(),
                                                _d.role = ((_e = options.role) !== null && _e !== void 0 ? _e : 'PLAYER'),
                                                _d),
                                                _c)])];
                                    case 2:
                                        _q.sent();
                                        return [4 /*yield*/, tx.player.create({
                                                data: {
                                                    id: playerId,
                                                    userId: userId,
                                                    username: username,
                                                    countryCode: (_f = options.countryCode) !== null && _f !== void 0 ? _f : 'TG',
                                                    nationality: (_h = (_g = options.nationality) !== null && _g !== void 0 ? _g : options.countryCode) !== null && _h !== void 0 ? _h : 'TG',
                                                    reputation: (_j = options.reputation) !== null && _j !== void 0 ? _j : 50,
                                                    plPoints: (_k = options.plPoints) !== null && _k !== void 0 ? _k : 0,
                                                    ageVerifiedAt: options.ageVerified === false ? null : new Date('2026-01-01T00:00:00Z'),
                                                    birthDateConfirmed: options.ageVerified !== false,
                                                    acceptedTermsAt: new Date('2026-01-01T00:00:00Z'),
                                                    acceptedPrivacyAt: new Date('2026-01-01T00:00:00Z'),
                                                },
                                            })];
                                    case 3:
                                        _q.sent();
                                        // Le wallet est créé via le même chemin que WalletRepository.getOrCreatePlayerWallet
                                        // (1 wallet/joueur, unique par playerId — INV-03).
                                        return [4 /*yield*/, tx.wallet.create({
                                                data: {
                                                    id: walletId,
                                                    playerId: playerId,
                                                    ownerType: 'PLAYER',
                                                    credits: (_l = options.credits) !== null && _l !== void 0 ? _l : 10000,
                                                    gems: (_m = options.gems) !== null && _m !== void 0 ? _m : 100,
                                                    tokens: (_o = options.tokens) !== null && _o !== void 0 ? _o : 50,
                                                    hardCents: (_p = options.hardCents) !== null && _p !== void 0 ? _p : 100000, // 1 000 € de bankroll de test
                                                },
                                            })];
                                    case 4:
                                        // Le wallet est créé via le même chemin que WalletRepository.getOrCreatePlayerWallet
                                        // (1 wallet/joueur, unique par playerId — INV-03).
                                        _q.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _e.sent();
                    return [2 /*return*/, { userId: userId, playerId: playerId, walletId: walletId, username: username, email: email, countryCode: (_c = options.countryCode) !== null && _c !== void 0 ? _c : 'TG', role: (_d = options.role) !== null && _d !== void 0 ? _d : 'PLAYER' }];
            }
        });
    });
}
/** Deux joueurs éligibles paris + un track de test — setup minimal des specs betting. */
function makeBettingDuo(prisma_1) {
    return __awaiter(this, arguments, void 0, function (prisma, stakeBalance) {
        var creator, opponent;
        if (stakeBalance === void 0) { stakeBalance = 10000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, makePlayer(prisma, { credits: stakeBalance, hardCents: stakeBalance * 100 })];
                case 1:
                    creator = _a.sent();
                    return [4 /*yield*/, makePlayer(prisma, { credits: stakeBalance, hardCents: stakeBalance * 100 })];
                case 2:
                    opponent = _a.sent();
                    return [2 /*return*/, { creator: creator, opponent: opponent }];
            }
        });
    });
}
/** Purge des joueurs créés par les fixtures (ordre inverse des FK). */
function cleanupPlayers(prisma, players) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, players_1, p;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, players_1 = players;
                    _a.label = 1;
                case 1:
                    if (!(_i < players_1.length)) return [3 /*break*/, 11];
                    p = players_1[_i];
                    return [4 /*yield*/, prisma.walletTransaction.deleteMany({ where: { wallet: { playerId: p.playerId } } })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, prisma.wallet.deleteMany({ where: { playerId: p.playerId } })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.bet.deleteMany({ where: { playerId: p.playerId } })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma.betMarket.deleteMany({ where: { OR: [{ creatorId: p.playerId }, { opponentId: p.playerId }] } })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, prisma.matchPlayer.deleteMany({ where: { playerId: p.playerId } })];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, prisma.player.deleteMany({ where: { id: p.playerId } })];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, prisma.refreshToken.deleteMany({ where: { userId: p.userId } })];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, prisma.user.deleteMany({ where: { id: p.userId } })];
                case 9:
                    _a.sent();
                    _a.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 1];
                case 11: return [2 /*return*/];
            }
        });
    });
}
