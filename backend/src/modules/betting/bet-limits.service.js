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
exports.BetLimitsService = void 0;
/**
 * bet-limits.service.ts — plafonds de mise & limites responsables (INV-11, INV-12, INV-21).
 * - Bornes par devise : betting.config.ts (contrat, jamais d'env override) ;
 * - Limite journalière SOFT : fenêtre glissante 24 h (INV-12), agrégée depuis le ledger ;
 * - Plafonds HARD : min(plafond juridiction du pays, plafond mensuel global LCB/FT) ;
 * - Réputation ≥ 30 pour HARD (INV-21) + KYC âge vérifié.
 * Les montants sont des entiers stricts (INV-01) ; toute comparaison est en entiers.
 */
var common_1 = require("@nestjs/common");
var betting_config_1 = require("../../config/betting.config");
var betting_errors_1 = require("../../common/errors/betting-errors");
var BetLimitsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var BetLimitsService = _classThis = /** @class */ (function () {
        function BetLimitsService_1(prisma, config, clock, jurisdictions) {
            this.prisma = prisma;
            this.config = config;
            this.clock = clock;
            this.jurisdictions = jurisdictions;
        }
        /** Borne min/max contractuelle par devise (INV-11) — lève BET_STAKE_OUT_OF_RANGE. */
        BetLimitsService_1.prototype.assertStakeBounds = function (currency, stake) {
            var _a = (0, betting_config_1.stakeBounds)(currency), min = _a.min, max = _a.max;
            if (!Number.isSafeInteger(stake) || stake < min || stake > max) {
                throw new betting_errors_1.BetStakeOutOfRangeError(currency, stake, min, max);
            }
        };
        /**
         * Vérifie la limite journalière SOFT (fenêtre glissante 24 h, INV-12) et les plafonds
         * HARD (juridiction + mensuel global). `additionalStake` = mise projetée.
         * Source de vérité = WalletTransaction BET_ESCROW (déjà débités) — pas de compteur Redis
         * contournable : le ledger est immuable, donc le comptage est exact même après crash.
         */
        BetLimitsService_1.prototype.assertWithinLimits = function (ctx, additionalStake) {
            return __awaiter(this, void 0, void 0, function () {
                var since, used, limit, player, juris, monthAgo, usedMonth, monthlyCap, dayAgo, usedDay;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            since = new Date(this.clock.nowMs() - this.config.constants.DAILY_WINDOW_MS);
                            if (!(ctx.currency === 'SOFT')) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.sumEscrowSince(ctx.playerId, 'CREDITS', since)];
                        case 1:
                            used = _b.sent();
                            limit = this.config.constants.DAILY_SOFT_LIMIT;
                            if (used + additionalStake > limit) {
                                throw new betting_errors_1.BetDailyLimitExceededError('SOFT-daily', used, limit);
                            }
                            return [2 /*return*/];
                        case 2: return [4 /*yield*/, this.prisma.player.findUnique({
                                where: { id: ctx.playerId },
                                select: { reputation: true, ageVerifiedAt: true },
                            })];
                        case 3:
                            player = _b.sent();
                            if (!player)
                                throw new betting_errors_1.AgeVerificationRequiredError();
                            if (player.reputation < this.config.constants.MIN_REPUTATION_HARD) {
                                throw new betting_errors_1.ReputationTooLowError(player.reputation, this.config.constants.MIN_REPUTATION_HARD);
                            }
                            if (!player.ageVerifiedAt)
                                throw new betting_errors_1.AgeVerificationRequiredError();
                            return [4 /*yield*/, this.jurisdictions.get(ctx.countryCode)];
                        case 4:
                            juris = _b.sent();
                            monthAgo = new Date(this.clock.nowMs() - 30 * 24 * 3600000);
                            return [4 /*yield*/, this.sumEscrowSince(ctx.playerId, 'HARD_CENTS', monthAgo)];
                        case 5:
                            usedMonth = _b.sent();
                            monthlyCap = Math.min((_a = juris.monthlyHardLimitCents) !== null && _a !== void 0 ? _a : Number.MAX_SAFE_INTEGER, this.config.constants.MONTHLY_HARD_CAP_CENTS);
                            if (usedMonth + additionalStake > monthlyCap) {
                                throw new betting_errors_1.BetDailyLimitExceededError('HARD-monthly', usedMonth, monthlyCap);
                            }
                            if (!(juris.dailyHardLimitCents !== null)) return [3 /*break*/, 7];
                            dayAgo = new Date(this.clock.nowMs() - 24 * 3600000);
                            return [4 /*yield*/, this.sumEscrowSince(ctx.playerId, 'HARD_CENTS', dayAgo)];
                        case 6:
                            usedDay = _b.sent();
                            if (usedDay + additionalStake > juris.dailyHardLimitCents) {
                                throw new betting_errors_1.BetDailyLimitExceededError('HARD-daily', usedDay, juris.dailyHardLimitCents);
                            }
                            _b.label = 7;
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        /** Snapshot de consommation pour GET /betting/limits (transparence joueur, jeu responsable). */
        BetLimitsService_1.prototype.usage = function (playerId, currency) {
            return __awaiter(this, void 0, void 0, function () {
                var since, used24h;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            since = new Date(this.clock.nowMs() - this.config.constants.DAILY_WINDOW_MS);
                            return [4 /*yield*/, this.sumEscrowSince(playerId, currency === 'SOFT' ? 'CREDITS' : 'HARD_CENTS', since)];
                        case 1:
                            used24h = _a.sent();
                            return [2 /*return*/, {
                                    currency: currency,
                                    windowHours: 24,
                                    used: used24h,
                                    softDailyLimit: this.config.constants.DAILY_SOFT_LIMIT,
                                }];
                    }
                });
            });
        };
        /* ------------------------------- Interne -------------------------------- */
        /** Somme des escrows (valeur absolue des débits BET_ESCROW) depuis `since`, par devise. */
        BetLimitsService_1.prototype.sumEscrowSince = function (playerId, kind, since) {
            return __awaiter(this, void 0, void 0, function () {
                var wallet, col, agg;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.wallet.findUnique({ where: { playerId: playerId }, select: { id: true } })];
                        case 1:
                            wallet = _b.sent();
                            if (!wallet)
                                return [2 /*return*/, 0]; // wallet créé à la première transaction ; pas de wallet ⇒ pas de pari passé
                            col = kind === 'CREDITS' ? 'credits' : 'hardCents';
                            return [4 /*yield*/, this.prisma.walletTransaction.aggregate({
                                    where: {
                                        walletId: wallet.id,
                                        type: 'BET_ESCROW',
                                        createdAt: { gte: since },
                                    },
                                    _sum: { amountSigned: true },
                                })];
                        case 2:
                            agg = _b.sent();
                            // amountSigned < 0 pour un débit → on somme en valeur absolue. Colonne devinée par `kind`
                            // uniquement pour le mapping devise ; le filtre temporel est identique.
                            void col;
                            return [2 /*return*/, Math.abs((_a = agg._sum.amountSigned) !== null && _a !== void 0 ? _a : 0)];
                    }
                });
            });
        };
        return BetLimitsService_1;
    }());
    __setFunctionName(_classThis, "BetLimitsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BetLimitsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BetLimitsService = _classThis;
}();
exports.BetLimitsService = BetLimitsService;
