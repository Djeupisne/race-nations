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
exports.UsersService = void 0;
/**
 * users.service.ts — gestion du compte d'authentification (docs/api.md §2/§3).
 * Le `User` porte l'identité (email, hash, rôle) ; le profil joueur est dans Player
 * (module players). Ce service expose les opérations centrées compte :
 *  - changement d'email/mot de passe (re-hash argon2id, révocation des familles de refresh),
 *  - suppression de compte RGPD (anonymisation + purge ledger conservée pour comptabilité légitime),
 *  - lookup interne pour les autres modules (jamais via SQL direct ailleurs).
 *
 * Règles : aucun log d'email en clair complet (observability.md §2) ; horodatage Clock (INV-29).
 */
var common_1 = require("@nestjs/common");
var argon2 = require("argon2");
var domain_errors_1 = require("../../common/errors/domain-errors");
var ARGON2_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
};
var UsersService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var UsersService = _classThis = /** @class */ (function () {
        function UsersService_1(prisma, clock) {
            this.prisma = prisma;
            this.clock = clock;
        }
        /** Lookup par userId — utilisé par JwtStrategy/guards/admin. Retourne null si absent. */
        UsersService_1.prototype.findById = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.user.findUnique({ where: { id: userId } })];
                });
            });
        };
        UsersService_1.prototype.findByEmail = function (email) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.user.findUnique({ where: { email: email.toLowerCase() } })];
                });
            });
        };
        /** Changement de mot de passe : vérifie l'ancien, re-hash, révoque TOUTES les sessions. */
        UsersService_1.prototype.changePassword = function (userId, currentPassword, newPassword) {
            return __awaiter(this, void 0, void 0, function () {
                var user, ok, hash, now;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (newPassword.length < 8 || newPassword.length > 128) {
                                throw new domain_errors_1.ValidationError({ field: 'password', reason: 'Length must be 8–128.' });
                            }
                            return [4 /*yield*/, this.prisma.user.findUnique({ where: { id: userId } })];
                        case 1:
                            user = _a.sent();
                            if (!user)
                                throw new domain_errors_1.NotFoundError('User', userId);
                            return [4 /*yield*/, argon2.verify(user.passwordHash, currentPassword).catch(function () { return false; })];
                        case 2:
                            ok = _a.sent();
                            if (!ok)
                                throw new domain_errors_1.AuthUnauthenticatedError({}, 'Current password is incorrect.');
                            return [4 /*yield*/, argon2.hash(newPassword, ARGON2_OPTIONS)];
                        case 3:
                            hash = _a.sent();
                            now = this.clock.date();
                            // Transaction (INV-30) : jamais un nouveau hash sans révocation des refresh vivants.
                            return [4 /*yield*/, this.prisma.$transaction([
                                    this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } }),
                                    this.prisma.refreshToken.updateMany({
                                        where: { userId: userId, revokedAt: null },
                                        data: { revokedAt: now },
                                    }),
                                ])];
                        case 4:
                            // Transaction (INV-30) : jamais un nouveau hash sans révocation des refresh vivants.
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /** Changement d'email — exige une revalidation (token de confirmation consommé ailleurs). */
        UsersService_1.prototype.changeEmail = function (userId, newEmail) {
            return __awaiter(this, void 0, void 0, function () {
                var email, clash;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            email = newEmail.toLowerCase();
                            return [4 /*yield*/, this.prisma.user.findUnique({ where: { email: email }, select: { id: true } })];
                        case 1:
                            clash = _a.sent();
                            if (clash)
                                throw new domain_errors_1.ValidationError({ field: 'email', reason: 'Email already in use.' });
                            return [4 /*yield*/, this.prisma.user.update({ where: { id: userId }, data: { email: email } })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Suppression de compte (RGPD droit à l'effacement) :
         *  - anonymise User/Player (PII détruite),
         *  - CONSERVE le ledger WalletTransaction et BetSettlement (obligation comptable/LCB-FT,
         *    betting-legal.md §5) — les lignes monétaires ne sont pas des données personnelles nominatives.
         * Anti-double-suppression : idempotent (second appel = no-op silencieux côté contrôleur).
         */
        UsersService_1.prototype.deleteAccount = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var user, anonSuffix;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.user.findUnique({ where: { id: userId }, include: { player: true } })];
                        case 1:
                            user = _a.sent();
                            if (!user)
                                return [2 /*return*/, { deleted: false }];
                            anonSuffix = "gdpr-".concat(userId.slice(0, 8));
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (!user.player) return [3 /*break*/, 2];
                                                return [4 /*yield*/, tx.player.update({
                                                        where: { id: user.player.id },
                                                        data: {
                                                            username: "".concat(anonSuffix, "-").concat(Math.floor(this.clock.now() % 1000000)),
                                                            countryCode: 'XX',
                                                            acceptedTermsAt: null,
                                                            acceptedPrivacyAt: null,
                                                            kycDocumentRef: null,
                                                            marketingOptIn: false,
                                                        },
                                                    })];
                                            case 1:
                                                _a.sent();
                                                _a.label = 2;
                                            case 2: return [4 /*yield*/, tx.refreshToken.deleteMany({ where: { userId: userId } })];
                                            case 3:
                                                _a.sent();
                                                return [4 /*yield*/, tx.user.update({
                                                        where: { id: userId },
                                                        data: { email: "".concat(anonSuffix, "@deleted.invalid"), passwordHash: '!!DELETED!!' },
                                                    })];
                                            case 4:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { deleted: true }];
                    }
                });
            });
        };
        /** ProfilSelf — projection sans PII sensible pour GET /users/me. */
        UsersService_1.prototype.getProfile = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findById(userId)];
                        case 1:
                            user = _a.sent();
                            if (!user)
                                throw new domain_errors_1.NotFoundError({}, 'User not found.');
                            return [2 /*return*/, {
                                    id: user.id,
                                    email: user.email,
                                    role: user.role,
                                    emailVerified: user.emailVerifiedAt !== null,
                                    createdAt: user.createdAt,
                                }];
                    }
                });
            });
        };
        UsersService_1.prototype.updateProfile = function (userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var data, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            data = {};
                            if (dto.displayName !== undefined)
                                data.displayName = dto.displayName;
                            if (dto.avatarKey !== undefined)
                                data.avatarKey = dto.avatarKey;
                            if (dto.preferredLanguage !== undefined)
                                data.preferredLanguage = dto.preferredLanguage;
                            return [4 /*yield*/, this.prisma.user.update({ where: { id: userId }, data: data })];
                        case 1:
                            updated = _a.sent();
                            return [2 /*return*/, { id: updated.id, displayName: updated.displayName }];
                    }
                });
            });
        };
        return UsersService_1;
    }());
    __setFunctionName(_classThis, "UsersService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UsersService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UsersService = _classThis;
}();
exports.UsersService = UsersService;
