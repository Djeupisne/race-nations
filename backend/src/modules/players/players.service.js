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
exports.PlayersService = void 0;
/**
 * players.service.ts — profil joueur, stats, leaderboards (docs/api.md §3/§10).
 * Invariants appliqués ici :
 *  - INV-31 : nationalité verrouillée après la 1ʳᵉ course classée (`nationalityLocked`) ;
 *    PL cap min 0 ; division recalculée par `divisionFromPl` (source unique contrat).
 *  - INV-25 : les stats n'agrègent QUE des matches FINISHED_VALIDATED.
 *  - INV-29 : horodatages via Clock.
 */
var common_1 = require("@nestjs/common");
var api_contracts_1 = require("@race-nations/api-contracts");
var domain_errors_1 = require("../../common/errors/domain-errors");
var PlayersService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var PlayersService = _classThis = /** @class */ (function () {
        function PlayersService_1(prisma, clock) {
            this.prisma = prisma;
            this.clock = clock;
        }
        /* ------------------------------- Profil -------------------------------- */
        /** Chargement interne robuste utilisé par tous les modules (betting, wallet…). */
        PlayersService_1.prototype.getByPlayerId = function (playerId) {
            return __awaiter(this, void 0, void 0, function () {
                var player;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.player.findUnique({
                                where: { id: playerId },
                                include: { user: { select: { role: true } }, wallet: true },
                            })];
                        case 1:
                            player = _a.sent();
                            if (!player)
                                throw new domain_errors_1.NotFoundError('Player', playerId);
                            return [2 /*return*/, player];
                    }
                });
            });
        };
        PlayersService_1.prototype.getProfileByUserId = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var player;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.player.findUnique({
                                where: { userId: userId },
                                include: { user: { select: { role: true } } },
                            })];
                        case 1:
                            player = _a.sent();
                            if (!player)
                                throw new domain_errors_1.NotFoundError('Player', userId);
                            return [2 /*return*/, this.toProfile(player)];
                    }
                });
            });
        };
        /** GET /players/:id — profil public, sans PII ni flags KYC (404 uniforme si caché/inexistant). */
        PlayersService_1.prototype.getPublicProfile = function (playerId) {
            return __awaiter(this, void 0, void 0, function () {
                var p;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.player.findUnique({
                                where: { id: playerId },
                                select: { id: true, username: true, nationality: true, level: true, plPoints: true, division: true },
                            })];
                        case 1:
                            p = _a.sent();
                            if (!p)
                                throw new domain_errors_1.NotFoundError('Player', playerId);
                            return [2 /*return*/, {
                                    id: p.id,
                                    username: p.username,
                                    nationality: p.nationality,
                                    level: p.level,
                                    plPoints: p.plPoints,
                                    division: p.division,
                                }];
                    }
                });
            });
        };
        /** PATCH /players/me — champs éditables uniquement ; `nationality` absent du schéma (INV-31). */
        PlayersService_1.prototype.updateProfile = function (userId, input) {
            return __awaiter(this, void 0, void 0, function () {
                var player, data, clash, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.player.findUnique({ where: { userId: userId }, include: { user: true } })];
                        case 1:
                            player = _a.sent();
                            if (!player)
                                throw new domain_errors_1.NotFoundError('Player', userId);
                            data = {};
                            if (!(input.username !== undefined)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.prisma.player.findUnique({ where: { username: input.username }, select: { id: true } })];
                        case 2:
                            clash = _a.sent();
                            if (clash && clash.id !== player.id)
                                throw new domain_errors_1.ValidationError({ field: 'username', reason: 'Already taken.' });
                            data.username = input.username;
                            _a.label = 3;
                        case 3:
                            if (input.preferredLanguage !== undefined)
                                data.preferredLanguage = input.preferredLanguage;
                            if (input.chatGlobalEnabled !== undefined)
                                data.chatGlobalEnabled = input.chatGlobalEnabled;
                            if (input.marketingOptIn !== undefined)
                                data.marketingOptIn = input.marketingOptIn;
                            return [4 /*yield*/, this.prisma.player.update({ where: { id: player.id }, data: data, include: { user: true } })];
                        case 4:
                            updated = _a.sent();
                            return [2 /*return*/, this.toProfile(updated)];
                    }
                });
            });
        };
        /** POST /players/me/nationality — possible tant que non verrouillé (avant 1ʳᵉ course classée, INV-31). */
        PlayersService_1.prototype.setNationality = function (userId, input) {
            return __awaiter(this, void 0, void 0, function () {
                var player, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.player.findUnique({ where: { userId: userId }, include: { user: true } })];
                        case 1:
                            player = _a.sent();
                            if (!player)
                                throw new domain_errors_1.NotFoundError('Player', userId);
                            if (player.nationalityLocked) {
                                throw new domain_errors_1.ValidationError({
                                    field: 'nationality',
                                    reason: 'Nationality is locked after the first ranked race (INV-31).',
                                });
                            }
                            return [4 /*yield*/, this.prisma.player.update({
                                    where: { id: player.id },
                                    data: { nationality: input.nationality },
                                    include: { user: true },
                                })];
                        case 2:
                            updated = _a.sent();
                            return [2 /*return*/, this.toProfile(updated)];
                    }
                });
            });
        };
        /* -------------------------------- Stats -------------------------------- */
        /** GET /players/me/stats — agrégats sur matches validés serveur uniquement (INV-25). */
        PlayersService_1.prototype.stats = function (playerId) {
            return __awaiter(this, void 0, void 0, function () {
                var entries, victories, defeats, draws, abandons, totalDrift, _i, entries_1, e, betsWon, betsLost, recordsHeld;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.matchPlayer.findMany({
                                where: { playerId: playerId, match: { status: 'FINISHED_VALIDATED' } },
                                select: { outcome: true, driftPoints: true, position: true },
                            })];
                        case 1:
                            entries = _a.sent();
                            victories = 0;
                            defeats = 0;
                            draws = 0;
                            abandons = 0;
                            totalDrift = 0;
                            for (_i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                                e = entries_1[_i];
                                totalDrift += e.driftPoints;
                                switch (e.outcome) {
                                    case 'VICTORY':
                                        victories++;
                                        break;
                                    case 'DEFEAT':
                                        defeats++;
                                        break;
                                    case 'DRAW':
                                        draws++;
                                        break;
                                    case 'ABANDON':
                                        abandons++;
                                        break;
                                    default: break;
                                }
                            }
                            return [4 /*yield*/, this.prisma.bet.count({ where: { playerId: playerId, status: 'WON' } })];
                        case 2:
                            betsWon = _a.sent();
                            return [4 /*yield*/, this.prisma.bet.count({ where: { playerId: playerId, status: 'LOST' } })];
                        case 3:
                            betsLost = _a.sent();
                            return [4 /*yield*/, this.prisma.matchPlayer.count({
                                    where: { playerId: playerId, match: { status: 'FINISHED_VALIDATED' }, position: 1 },
                                })];
                        case 4:
                            recordsHeld = _a.sent();
                            return [2 /*return*/, {
                                    racesPlayed: entries.length,
                                    victories: victories,
                                    defeats: defeats,
                                    draws: draws,
                                    abandons: abandons,
                                    winStreakCurrent: 0, // calculé par le worker season (phase ultérieure) — exposé défensif
                                    winStreakBest: 0,
                                    totalDriftPoints: totalDrift,
                                    perfectRaces: 0,
                                    recordsHeld: recordsHeld,
                                    betsWon: betsWon,
                                    betsLost: betsLost,
                                }];
                    }
                });
            });
        };
        /* ----------------------------- Leaderboards ---------------------------- */
        /** GET /leaderboards (api.md §10) — tri PL desc, pagination curseur = dernier plPoints:id encodé. */
        PlayersService_1.prototype.leaderboard = function (query) {
            return __awaiter(this, void 0, void 0, function () {
                var where, cursor, rows, items, hasMore, last;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            where = {};
                            switch (query.scope) {
                                case 'country':
                                    if (!query.filter)
                                        throw new domain_errors_1.ValidationError({ field: 'filter', reason: 'Required for scope=country.' });
                                    where.nationality = query.filter.toUpperCase();
                                    break;
                                case 'division':
                                    if (!query.filter)
                                        throw new domain_errors_1.ValidationError({ field: 'filter', reason: 'Required for scope=division.' });
                                    where.division = query.filter;
                                    break;
                                case 'clan':
                                    where.clanMembership = query.filter ? { clanId: query.filter } : { not: null };
                                    break;
                                case 'vehicle':
                                    where.ownedVehicles = { some: { vehicleId: (_a = query.filter) !== null && _a !== void 0 ? _a : '' } };
                                    break;
                                case 'season':
                                case 'world':
                                default:
                                    break;
                            }
                            cursor = query.cursor ? decodeCursor(query.cursor) : undefined;
                            return [4 /*yield*/, this.prisma.player.findMany(__assign(__assign({ where: where, orderBy: [{ plPoints: 'desc' }, { id: 'asc' }], take: query.limit + 1 }, (cursor ? { cursor: { id: cursor.id }, skip: 1 } : {})), { select: { id: true, username: true, nationality: true, division: true, plPoints: true } }))];
                        case 1:
                            rows = _c.sent();
                            items = rows.slice(0, query.limit).map(function (r, i) {
                                var _a;
                                return ({
                                    rank: i + 1 + ((_a = cursor === null || cursor === void 0 ? void 0 : cursor.offset) !== null && _a !== void 0 ? _a : 0),
                                    playerId: r.id,
                                    username: r.username,
                                    nationality: r.nationality,
                                    division: r.division,
                                    plPoints: r.plPoints,
                                    metric: r.plPoints,
                                });
                            });
                            hasMore = rows.length > query.limit;
                            last = items[items.length - 1];
                            return [2 /*return*/, {
                                    items: items,
                                    nextCursor: hasMore && last ? encodeCursor(last.playerId, ((_b = cursor === null || cursor === void 0 ? void 0 : cursor.offset) !== null && _b !== void 0 ? _b : 0) + items.length) : null,
                                }];
                    }
                });
            });
        };
        /* -------------------------------- Internes ----------------------------- */
        /** Verrouillage INV-31 appelé par match-settlement à la 1ʳᵉ course classée. Idempotent. */
        PlayersService_1.prototype.lockNationalityIfNeeded = function (playerId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.player.updateMany({
                                where: { id: playerId, nationalityLocked: false },
                                data: { nationalityLocked: true },
                            })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Applique un delta PL avec cap min 0 et recalcule la division (INV-31) — source unique
         * pour match settlement et sanctions. Retourne le nouveau snapshot PL/division.
         */
        PlayersService_1.prototype.applyPlDelta = function (playerId, delta) {
            return __awaiter(this, void 0, void 0, function () {
                var player, plPoints, division;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.player.findUnique({ where: { id: playerId }, select: { plPoints: true } })];
                        case 1:
                            player = _a.sent();
                            if (!player)
                                throw new domain_errors_1.NotFoundError('Player', playerId);
                            plPoints = Math.max(0, player.plPoints + delta);
                            division = (0, api_contracts_1.divisionFromPl)(plPoints);
                            return [4 /*yield*/, this.prisma.player.update({ where: { id: playerId }, data: { plPoints: plPoints, division: division } })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { plPoints: plPoints, division: division }];
                    }
                });
            });
        };
        PlayersService_1.prototype.toProfile = function (p) {
            var _a;
            return {
                id: p.id,
                username: p.username,
                countryCode: p.countryCode,
                nationality: p.nationality,
                nationalityLocked: (_a = p.nationalityLocked) !== null && _a !== void 0 ? _a : false,
                role: p.user.role,
                level: p.level,
                xp: p.xp,
                plPoints: p.plPoints,
                division: p.division,
                reputation: p.reputation,
                ageVerified: p.ageVerifiedAt !== null,
                createdAt: p.createdAt.toISOString(),
            };
        };
        return PlayersService_1;
    }());
    __setFunctionName(_classThis, "PlayersService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PlayersService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PlayersService = _classThis;
}();
exports.PlayersService = PlayersService;
/** Curseur opaque `${base64(id)}:${offset}` — stable malgré les égalités de PL (tri (pl,id)). */
function encodeCursor(id, offset) {
    return "".concat(Buffer.from(id, 'utf8').toString('base64url'), ":").concat(offset);
}
function decodeCursor(raw) {
    var _a = raw.split(':'), b64 = _a[0], off = _a[1];
    if (!b64)
        return undefined;
    try {
        return { id: Buffer.from(b64, 'base64url').toString('utf8'), offset: Number.parseInt(off !== null && off !== void 0 ? off : '0', 10) || 0 };
    }
    catch (_b) {
        return undefined;
    }
}
