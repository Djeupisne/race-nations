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
exports.BetOddsService = void 0;
/**
 * bet-odds.service.ts — cotes implicites du pool (docs/betting.md §5, GET /markets/:id/odds).
 * Le pari mutuel n'a PAS de cote fixe : la cote affichée est une ESTIMATION dérivée du
 * pool courant (INV-08) et bouge à chaque escrow. Calculs 100 % entiers/floor (INV-01) :
 *   impliedOdds_i = netPool / stake_i (float d'AFFICHAGE uniquement),
 *   payoutEstimate_i = floor(stake_i × netPool / stake_i_side) (INV-09, entier contractuel).
 * Marché sans opposant encore → les deux côtés renvoyés avec leur part théorique.
 */
var common_1 = require("@nestjs/common");
var money_1 = require("../../common/utils/money");
var domain_errors_1 = require("../../common/errors/domain-errors");
var BetOddsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var BetOddsService = _classThis = /** @class */ (function () {
        function BetOddsService_1(prisma) {
            this.prisma = prisma;
        }
        BetOddsService_1.prototype.oddsForMarket = function (marketId) {
            return __awaiter(this, void 0, void 0, function () {
                var market, counted, totalPool, houseCut, netPool, sidesMap, _i, counted_1, b, entry, sides;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.betMarket.findUnique({
                                where: { id: marketId },
                                include: { bets: { include: { player: { select: { id: true, username: true } } } } },
                            })];
                        case 1:
                            market = _b.sent();
                            if (!market)
                                throw new domain_errors_1.NotFoundError('BetMarket', marketId);
                            counted = market.bets.filter(function (b) { return ['ACCEPTED', 'ESCROWED', 'RUNNING', 'WON', 'LOST', 'PUSH'].includes(b.status); });
                            totalPool = counted.reduce(function (acc, b) { return acc + b.stake; }, 0);
                            houseCut = (0, money_1.applyBpsFloor)(totalPool, market.houseEdgeBps);
                            netPool = totalPool - houseCut;
                            sidesMap = new Map();
                            for (_i = 0, counted_1 = counted; _i < counted_1.length; _i++) {
                                b = counted_1[_i];
                                entry = (_a = sidesMap.get(b.side)) !== null && _a !== void 0 ? _a : { staked: 0, players: [] };
                                entry.staked += b.stake;
                                entry.players.push({ playerId: b.playerId, username: b.player.username, stake: b.stake });
                                sidesMap.set(b.side, entry);
                            }
                            sides = [0, 1].map(function (side) {
                                var _a;
                                var info = (_a = sidesMap.get(side)) !== null && _a !== void 0 ? _a : { staked: 0, players: [] };
                                var payoutEstimate = info.staked > 0 && netPool > 0 ? (0, money_1.floorDiv)(info.staked * netPool, info.staked) : 0;
                                // Cote implicite : netPool / stake du camp (plus le camp est gros, moins la cote est belle).
                                var implied = info.staked > 0 ? Math.round((netPool / info.staked) * 100) / 100 : null;
                                return {
                                    side: side,
                                    stakedTotal: info.staked,
                                    players: info.players,
                                    payoutEstimate: info.staked > 0 ? netPool : 0, // en mutuel 1v1, le camp vainqueur se partage netPool
                                    impliedDecimalOdds: implied,
                                };
                            });
                            return [2 /*return*/, {
                                    marketId: market.id,
                                    status: market.status,
                                    currency: market.currency,
                                    totalPool: totalPool,
                                    houseCutEstimate: houseCut,
                                    netPool: netPool,
                                    sides: sides,
                                    // payoutEstimate ci-dessus volontairement simple : un seul joueur par camp en v1 1v1.
                                }];
                    }
                });
            });
        };
        /** Recalcule et persiste houseCutEstimate à chaque escrow (appelé par betting.service). */
        BetOddsService_1.prototype.recomputeCutEstimate = function (totalPool, houseEdgeBps) {
            return (0, money_1.applyBpsFloor)(totalPool, houseEdgeBps);
        };
        return BetOddsService_1;
    }());
    __setFunctionName(_classThis, "BetOddsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BetOddsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BetOddsService = _classThis;
}();
exports.BetOddsService = BetOddsService;
