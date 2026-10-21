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
exports.SanctionsService = void 0;
/**
 * sanctions.service.ts — cycle de vie des sanctions (docs/moderation.md, machine
 * Sanction INV-22 : ISSUED → ACTIVE → (APPEALED → UPHELD | LIFTED), terminaux LIFTED/UPHELD).
 * Effets appliqués :
 *  - BET_RESTRICTION / TEMP_BAN / PERM_BAN → gating lecture par BettingService/Jurisdiction ;
 *  - CHAT_MUTE → fin de validité stockée sur Player via metadata (ChatService vérifie) ;
 *  - REWARD_CLAWBACK (INV-18 triche avérée) → contre-écriture ledger via WalletRepository
 *    (append-only, jamais d'UPDATE de solde direct) + AdminAuditLog (INV-28).
 * Réputation < 10 ⇒ TEMP_BAN_7D possible (INV-21) — le contrôle d'éligibilité est ici.
 */
var common_1 = require("@nestjs/common");
var sanction_state_machine_1 = require("../../common/state-machines/sanction.state-machine");
var domain_errors_1 = require("../../common/errors/domain-errors");
var SANCTION_MS = {
    WARN: null,
    CHAT_MUTE: 24 * 3600000, // mute 24 h par défaut
    BET_RESTRICTION: 7 * 86400000, // 7 jours sans paris
    TEMP_BAN_7D: 7 * 86400000, // INV-21 réputation < 10
    PERM_BAN: null, // endsAt null = définitif
    REWARD_CLAWBACK: null,
};
var SanctionsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var SanctionsService = _classThis = /** @class */ (function () {
        function SanctionsService_1(prisma, wallet, clock) {
            this.prisma = prisma;
            this.wallet = wallet;
            this.clock = clock;
        }
        /** Émission MODERATOR+/ADMIN. TEMP_BAN_7D exige réputation < 10 (INV-21), contrôlé serveur. */
        SanctionsService_1.prototype.issue = function (params) {
            return __awaiter(this, void 0, void 0, function () {
                var player, nowMs, duration, endsAt, sanction;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!params.reason || params.reason.trim().length < 5) {
                                throw new domain_errors_1.ValidationError({ field: 'reason', reason: 'Sanction requires a documented reason.' });
                            }
                            return [4 /*yield*/, this.prisma.player.findUnique({
                                    where: { id: params.playerId },
                                    select: { id: true, reputation: true },
                                })];
                        case 1:
                            player = _a.sent();
                            if (!player)
                                throw new domain_errors_1.NotFoundError('Player', params.playerId);
                            if (params.type === 'TEMP_BAN_7D' && player.reputation >= 10) {
                                throw new domain_errors_1.ValidationError({ field: 'type', reason: "TEMP_BAN_7D requires reputation < 10 (INV-21), got ".concat(player.reputation, ".") });
                            }
                            nowMs = this.clock.nowMs();
                            duration = SANCTION_MS[params.type];
                            endsAt = duration ? new Date(nowMs + duration) : params.type === 'PERM_BAN' ? null : null;
                            return [4 /*yield*/, this.prisma.sanction.create({
                                    data: {
                                        playerId: params.playerId,
                                        type: params.type,
                                        status: 'ACTIVE', // ISSUED→ACTIVE immédiat : l'effet doit être certain à l'émission
                                        reason: params.reason,
                                        evidenceRef: params.evidenceRef,
                                        issuedById: params.issuedById,
                                        startsAt: new Date(nowMs),
                                        endsAt: endsAt,
                                    },
                                })];
                        case 2:
                            sanction = _a.sent();
                            return [2 /*return*/, { sanctionId: sanction.id, endsAt: endsAt }];
                    }
                });
            });
        };
        /** Appel joueur : ACTIVE → APPEALED (une seule fois ; terminal sinon). */
        SanctionsService_1.prototype.appeal = function (sanctionId, playerId, note) {
            return __awaiter(this, void 0, void 0, function () {
                var s;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.sanction.findUnique({ where: { id: sanctionId } })];
                        case 1:
                            s = _a.sent();
                            if (!s || s.playerId !== playerId)
                                throw new domain_errors_1.NotFoundError('Sanction', sanctionId);
                            (0, sanction_state_machine_1.assertSanctionTransition)(s.status, 'APPEALED');
                            if (!note || note.trim().length < 10) {
                                throw new domain_errors_1.ValidationError({ field: 'note', reason: 'Appeal note must be at least 10 characters.' });
                            }
                            return [4 /*yield*/, this.prisma.sanction.update({ where: { id: sanctionId }, data: { status: 'APPEALED', appealNote: note } })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /** Décision MODERATOR+ sur appel : APPEALED → UPHELD (terminal) ou LIFTED (terminal, effet cessé). */
        SanctionsService_1.prototype.decideAppeal = function (sanctionId, decision) {
            return __awaiter(this, void 0, void 0, function () {
                var s;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.sanction.findUnique({ where: { id: sanctionId } })];
                        case 1:
                            s = _a.sent();
                            if (!s)
                                throw new domain_errors_1.NotFoundError('Sanction', sanctionId);
                            (0, sanction_state_machine_1.assertSanctionTransition)(s.status, decision);
                            return [4 /*yield*/, this.prisma.sanction.update({
                                    where: { id: sanctionId },
                                    data: __assign({ status: decision }, (decision === 'LIFTED' ? { liftedAt: new Date(this.clock.nowMs()), endsAt: new Date(this.clock.nowMs()) } : {})),
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /** Levée anticipée (erreur reconnue / incident) — ACTIVE → LIFTED, auditée par l'appelant. */
        SanctionsService_1.prototype.lift = function (sanctionId) {
            return __awaiter(this, void 0, void 0, function () {
                var s, now;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.sanction.findUnique({ where: { id: sanctionId } })];
                        case 1:
                            s = _a.sent();
                            if (!s)
                                throw new domain_errors_1.NotFoundError('Sanction', sanctionId);
                            (0, sanction_state_machine_1.assertSanctionTransition)(s.status, 'LIFTED');
                            now = new Date(this.clock.nowMs());
                            return [4 /*yield*/, this.prisma.sanction.update({ where: { id: sanctionId }, data: { status: 'LIFTED', liftedAt: now, endsAt: now } })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * REWARD_CLAWBACK (INV-18) : récupération des gains d'un tricheur confirmé.
         * Contre-écriture APPEND-ONLY du ledger joueur (pas d'effacement) — montant plafonné au
         * solde disponible (jamais de solde négatif, INV-02) ; chaque clawback est idempotent
         * par clé `clawback:<sanctionId>`.
         */
        SanctionsService_1.prototype.clawbackRewards = function (sanctionId, actorUserId) {
            return __awaiter(this, void 0, void 0, function () {
                var s;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.sanction.findUnique({ where: { id: sanctionId } })];
                        case 1:
                            s = _a.sent();
                            if (!s || s.type !== 'REWARD_CLAWBACK')
                                throw new domain_errors_1.NotFoundError('Sanction(REWARD_CLAWBACK)', sanctionId);
                            void actorUserId; // tracé par AuditService dans le contrôleur (avant effet)
                            return [2 /*return*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var wallet, toReverseHard, toReverseSoft, reversedCents, reversedCredits;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, tx.wallet.findUnique({ where: { playerId: s.playerId } })];
                                            case 1:
                                                wallet = _a.sent();
                                                if (!wallet)
                                                    return [2 /*return*/, { reversedCents: 0, reversedCredits: 0 }];
                                                toReverseHard = wallet.hardCents;
                                                toReverseSoft = wallet.credits;
                                                reversedCents = 0;
                                                reversedCredits = 0;
                                                if (!(toReverseHard > 0)) return [3 /*break*/, 3];
                                                return [4 /*yield*/, this.wallet.debit(tx, {
                                                        walletId: wallet.id,
                                                        column: 'hardCents',
                                                        amount: toReverseHard,
                                                        type: 'REVERSAL',
                                                        idempotencyKey: "clawback:".concat(sanctionId, ":hard"),
                                                        refType: 'SANCTION',
                                                        refId: sanctionId,
                                                    })];
                                            case 2:
                                                _a.sent();
                                                reversedCents = toReverseHard;
                                                _a.label = 3;
                                            case 3:
                                                if (!(toReverseSoft > 0)) return [3 /*break*/, 5];
                                                return [4 /*yield*/, this.wallet.debit(tx, {
                                                        walletId: wallet.id,
                                                        column: 'credits',
                                                        amount: toReverseSoft,
                                                        type: 'REVERSAL',
                                                        idempotencyKey: "clawback:".concat(sanctionId, ":soft"),
                                                        refType: 'SANCTION',
                                                        refId: sanctionId,
                                                    })];
                                            case 4:
                                                _a.sent();
                                                reversedCredits = toReverseSoft;
                                                _a.label = 5;
                                            case 5: return [4 /*yield*/, tx.sanction.update({ where: { id: sanctionId }, data: { status: 'UPHELD' } })];
                                            case 6:
                                                _a.sent();
                                                return [2 /*return*/, { reversedCents: reversedCents, reversedCredits: reversedCredits }];
                                        }
                                    });
                                }); })];
                    }
                });
            });
        };
        /** Historique public restreint (auto-consultation joueur) + file moderation. */
        SanctionsService_1.prototype.listForPlayer = function (playerId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.sanction.findMany({
                            where: { playerId: playerId },
                            orderBy: { createdAt: 'desc' },
                            select: { id: true, type: true, status: true, reason: true, startsAt: true, endsAt: true, createdAt: true },
                        })];
                });
            });
        };
        /** Un joueur est-il sous sanction active bloquant X ? Utilisé par betting/chat/login. */
        SanctionsService_1.prototype.hasActive = function (playerId, types) {
            return __awaiter(this, void 0, void 0, function () {
                var now, count;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            now = new Date(this.clock.nowMs());
                            return [4 /*yield*/, this.prisma.sanction.count({
                                    where: { playerId: playerId, type: { in: types }, status: 'ACTIVE', OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
                                })];
                        case 1:
                            count = _a.sent();
                            return [2 /*return*/, count > 0];
                    }
                });
            });
        };
        return SanctionsService_1;
    }());
    __setFunctionName(_classThis, "SanctionsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SanctionsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SanctionsService = _classThis;
}();
exports.SanctionsService = SanctionsService;
