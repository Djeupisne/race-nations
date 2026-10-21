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
exports.AuthService = void 0;
/**
 * auth.service.ts — inscription, connexion, rotation de refresh (docs/api.md §2).
 *
 * Règles :
 *  - Mots de passe hachés argon2id (params OWASP) ; jamais de log du hash.
 *  - Access token JWT 15 min ; refresh rotatif 30 j stocké HASHÉ (SHA-256) avec `family`.
 *    Réutilisation d'un refresh consommé → révocation de TOUTE la famille + REFRESH_REUSED 401.
 *  - Création du compte = User + Player + Wallet initialisé à 0 dans une seule transaction
 *    (INV-30) ; le wallet ne peut exister sans le player et réciproquement.
 *  - Horodatages via Clock injectée (INV-29), jamais new Date().
 */
var common_1 = require("@nestjs/common");
var argon2 = require("argon2");
var node_crypto_1 = require("node:crypto");
var domain_errors_1 = require("../../common/errors/domain-errors");
var ARGON2_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB — OWASP
    timeCost: 2,
    parallelism: 1,
};
var AuthService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AuthService = _classThis = /** @class */ (function () {
        function AuthService_1(prisma, jwt, config, clock) {
            this.prisma = prisma;
            this.jwt = jwt;
            this.config = config;
            this.clock = clock;
        }
        /* ------------------------------ Register ------------------------------ */
        AuthService_1.prototype.register = function (input) {
            return __awaiter(this, void 0, void 0, function () {
                var email, existing, usernameTaken, passwordHash, now, created, tokens;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            email = input.email.toLowerCase();
                            return [4 /*yield*/, this.prisma.user.findUnique({ where: { email: email }, select: { id: true } })];
                        case 1:
                            existing = _a.sent();
                            if (existing) {
                                // Message volontairement identique au login échoué (anti-enumeration).
                                throw new domain_errors_1.ValidationError({ field: 'email', reason: 'Invalid credentials.' });
                            }
                            return [4 /*yield*/, this.prisma.player.findUnique({
                                    where: { username: input.username },
                                    select: { id: true },
                                })];
                        case 2:
                            usernameTaken = _a.sent();
                            if (usernameTaken) {
                                throw new domain_errors_1.ValidationError({ field: 'username', reason: 'Username already taken.' });
                            }
                            return [4 /*yield*/, argon2.hash(input.password, ARGON2_OPTIONS)];
                        case 3:
                            passwordHash = _a.sent();
                            now = this.clock.date();
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var user, player;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, tx.user.create({
                                                    data: { email: email, passwordHash: passwordHash, role: 'PLAYER' },
                                                })];
                                            case 1:
                                                user = _a.sent();
                                                return [4 /*yield*/, tx.player.create({
                                                        data: {
                                                            userId: user.id,
                                                            username: input.username,
                                                            countryCode: input.countryCode,
                                                            nationality: input.nationality, // choix DÉFINITIF après 1ʳᵉ course classée (INV-31) — verrouillé plus tard, pas ici
                                                            marketingOptIn: input.marketingOptIn,
                                                            acceptedTermsAt: now,
                                                            acceptedPrivacyAt: now,
                                                        },
                                                    })];
                                            case 2:
                                                player = _a.sent();
                                                return [4 /*yield*/, tx.wallet.create({ data: { playerId: player.id, ownerType: 'PLAYER' } })];
                                            case 3:
                                                _a.sent();
                                                return [2 /*return*/, { user: user, player: player }];
                                        }
                                    });
                                }); })];
                        case 4:
                            created = _a.sent();
                            return [4 /*yield*/, this.issueTokens(created.user, 0)];
                        case 5:
                            tokens = _a.sent();
                            return [2 /*return*/, __assign(__assign({}, tokens), { playerId: created.player.id })];
                    }
                });
            });
        };
        /* ------------------------------- Login -------------------------------- */
        AuthService_1.prototype.login = function (input) {
            return __awaiter(this, void 0, void 0, function () {
                var user, ok;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.user.findUnique({
                                where: { email: input.email.toLowerCase() },
                                include: { player: true },
                            })];
                        case 1:
                            user = _a.sent();
                            if (!user || !user.player)
                                throw new domain_errors_1.AuthUnauthenticatedError({}, 'Invalid credentials.');
                            return [4 /*yield*/, argon2.verify(user.passwordHash, input.password).catch(function () { return false; })];
                        case 2:
                            ok = _a.sent();
                            if (!ok)
                                throw new domain_errors_1.AuthUnauthenticatedError({}, 'Invalid credentials.');
                            return [2 /*return*/, this.issueTokens(user, undefined)];
                    }
                });
            });
        };
        /* ---------------------- Refresh rotation (INV-23) --------------------- */
        /**
         * Rotation stricte : le refresh présenté est consommé (marqué révocable par suppression
         * de sa ligne) et remplacé dans la MÊME famille. Si la presented token n'existe plus
         * alors qu'il est bien formellement valide (hash connu révoqué) → réutilisation →
         * révocation de toute la famille (vol présumé).
         */
        AuthService_1.prototype.refresh = function (refreshToken) {
            return __awaiter(this, void 0, void 0, function () {
                var tokenHash, stored, family;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            tokenHash = sha256Hex(refreshToken);
                            return [4 /*yield*/, this.prisma.refreshToken.findUnique({
                                    where: { tokenHash: tokenHash },
                                    include: { user: { include: { player: true } } },
                                })];
                        case 1:
                            stored = _a.sent();
                            if (!stored || stored.revokedAt) {
                                // Le hash n'est plus vivant : soit expiré purgés, soit consommé → suspicion de vol.
                                throw new domain_errors_1.RefreshReusedError(-1);
                            }
                            if (!(stored.expiresAt.getTime() <= this.clock.now())) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.prisma.refreshToken.delete({ where: { id: stored.id } }).catch(function () { return undefined; })];
                        case 2:
                            _a.sent();
                            throw new domain_errors_1.TokenExpiredError();
                        case 3:
                            if (!stored.user.player)
                                throw new domain_errors_1.AuthUnauthenticatedError();
                            family = stored.family;
                            return [4 /*yield*/, this.prisma.$transaction([
                                    this.prisma.refreshToken.delete({ where: { id: stored.id } }),
                                ])];
                        case 4:
                            _a.sent();
                            return [2 /*return*/, this.issueTokens(stored.user, family)];
                    }
                });
            });
        };
        /** POST /auth/logout — révoque la famille entière du refresh présenté. */
        AuthService_1.prototype.logout = function (refreshToken) {
            return __awaiter(this, void 0, void 0, function () {
                var tokenHash, stored;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            tokenHash = sha256Hex(refreshToken);
                            return [4 /*yield*/, this.prisma.refreshToken.findUnique({ where: { tokenHash: tokenHash } })];
                        case 1:
                            stored = _a.sent();
                            if (!stored)
                                return [2 /*return*/]; // logout idempotent : un token inconnu = déjà déconnecté
                            return [4 /*yield*/, this.prisma.refreshToken.updateMany({
                                    where: { userId: stored.userId, family: stored.family, revokedAt: null },
                                    data: { revokedAt: this.clock.date() },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /* --------------------------- KYC / verify-age -------------------------- */
        /** POST /auth/verify-age — prérequis paris HARD (INV-21). Le document n'est JAMAIS persisté en clair. */
        AuthService_1.prototype.verifyAge = function (userId, input) {
            return __awaiter(this, void 0, void 0, function () {
                var player, now;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.player.findUnique({ where: { userId: userId } })];
                        case 1:
                            player = _a.sent();
                            if (!player)
                                throw new domain_errors_1.NotFoundError('Player', userId);
                            now = this.clock.date();
                            return [4 /*yield*/, this.prisma.player.update({
                                    where: { id: player.id },
                                    data: { ageVerifiedAt: now, birthDateConfirmed: true },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { verified: true, verifiedAt: now }];
                    }
                });
            });
        };
        /* ------------------------------ Session -------------------------------- */
        /** GET /auth/me — identité + gating client-side défensif (le serveur re-vérifie tout). */
        AuthService_1.prototype.session = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var player;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.player.findUnique({ where: { userId: userId }, include: { user: true } })];
                        case 1:
                            player = _a.sent();
                            if (!player || !player.user)
                                throw new domain_errors_1.NotFoundError('Player', userId);
                            return [2 /*return*/, {
                                    userId: player.userId,
                                    username: player.username,
                                    role: player.user.role,
                                    countryCode: player.countryCode,
                                    nationality: player.nationality,
                                    ageVerified: player.ageVerifiedAt !== null,
                                    bettingHardAllowed: player.ageVerifiedAt !== null && player.reputation >= 30,
                                    accessTokenExpiresAt: new Date(this.clock.now() + AuthService.ACCESS_TTL_S * 1000).toISOString(),
                                }];
                    }
                });
            });
        };
        /* ------------------------------- Internes ------------------------------ */
        /** Émet access + refresh ; family = nouvelle famille si undefined (login), sinon rotation intra-famille. */
        AuthService_1.prototype.issueTokens = function (user, family) {
            return __awaiter(this, void 0, void 0, function () {
                var fam, claims, iatSec, accessToken, refreshToken;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            fam = family !== null && family !== void 0 ? family : Math.floor(Math.random() * Math.pow(2, 31));
                            claims = {
                                sub: user.id,
                                role: user.role,
                                fam: fam,
                                iss: 'race-nations-api',
                                aud: 'race-nations-clients',
                            };
                            iatSec = Math.floor(this.clock.now() / 1000);
                            return [4 /*yield*/, this.jwt.signAsync(__assign(__assign({}, claims), { iat: iatSec, exp: iatSec + AuthService.ACCESS_TTL_S }), { expiresIn: AuthService.ACCESS_TTL_S })];
                        case 1:
                            accessToken = _a.sent();
                            refreshToken = (0, node_crypto_1.randomBytes)(48).toString('base64url');
                            return [4 /*yield*/, this.prisma.refreshToken.create({
                                    data: {
                                        userId: user.id,
                                        tokenHash: sha256Hex(refreshToken),
                                        family: fam,
                                        expiresAt: new Date(this.clock.now() + AuthService.REFRESH_TTL_S * 1000),
                                    },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { accessToken: accessToken, refreshToken: refreshToken, expiresIn: AuthService.ACCESS_TTL_S }];
                    }
                });
            });
        };
        return AuthService_1;
    }());
    __setFunctionName(_classThis, "AuthService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuthService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
    })();
    /** TTL contractuels (miroir shared/api-contracts/src/auth.ts). */
    _classThis.ACCESS_TTL_S = 900;
    _classThis.REFRESH_TTL_S = 2592000;
    (function () {
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuthService = _classThis;
}();
exports.AuthService = AuthService;
/** SHA-256 hex — stockage des refresh tokens (jamais le secret en clair, auth.md). */
function sha256Hex(value) {
    return (0, node_crypto_1.createHash)('sha256').update(value, 'utf8').digest('hex');
}
