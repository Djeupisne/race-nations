"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const argon2 = __importStar(require("argon2"));
const node_crypto_1 = require("node:crypto");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const clock_1 = require("../../common/utils/clock");
const domain_errors_1 = require("../../common/errors/domain-errors");
const ARGON2_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
};
let AuthService = class AuthService {
    static { AuthService_1 = this; }
    prisma;
    jwt;
    config;
    clock;
    static ACCESS_TTL_S = 900;
    static REFRESH_TTL_S = 2_592_000;
    constructor(prisma, jwt, config, clock) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.clock = clock;
    }
    async register(input) {
        const email = input.email.toLowerCase();
        const existing = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
        if (existing) {
            throw new domain_errors_1.ValidationError({ field: 'email', reason: 'Invalid credentials.' });
        }
        const usernameTaken = await this.prisma.player.findUnique({
            where: { username: input.username },
            select: { id: true },
        });
        if (usernameTaken) {
            throw new domain_errors_1.ValidationError({ field: 'username', reason: 'Username already taken.' });
        }
        const passwordHash = await argon2.hash(input.password, ARGON2_OPTIONS);
        const now = this.clock.now();
        const created = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: { email, passwordHash, role: 'PLAYER' },
            });
            const player = await tx.player.create({
                data: {
                    userId: user.id,
                    username: input.username,
                    countryCode: input.countryCode,
                    nationality: input.nationality,
                    marketingOptIn: input.marketingOptIn,
                    acceptedTermsAt: now,
                    acceptedPrivacyAt: now,
                },
            });
            await tx.wallet.create({ data: { playerId: player.id, ownerType: 'PLAYER' } });
            return { user, player };
        });
        const tokens = await this.issueTokens(created.user, 0);
        return { ...tokens, playerId: created.player.id };
    }
    async login(input) {
        const user = await this.prisma.user.findUnique({
            where: { email: input.email.toLowerCase() },
            include: { player: true },
        });
        if (!user || !user.player)
            throw new domain_errors_1.AuthUnauthenticatedError({}, 'Invalid credentials.');
        const ok = await argon2.verify(user.passwordHash, input.password).catch(() => false);
        if (!ok)
            throw new domain_errors_1.AuthUnauthenticatedError({}, 'Invalid credentials.');
        return this.issueTokens(user, undefined);
    }
    async refresh(refreshToken) {
        const tokenHash = sha256Hex(refreshToken);
        const stored = await this.prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: { user: { include: { player: true } } },
        });
        if (!stored || stored.revokedAt) {
            throw new domain_errors_1.RefreshReusedError(-1);
        }
        if (stored.expiresAt.getTime() <= this.clock.nowMs()) {
            await this.prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => undefined);
            throw new domain_errors_1.TokenExpiredError();
        }
        if (!stored.user.player)
            throw new domain_errors_1.AuthUnauthenticatedError();
        const family = stored.family;
        await this.prisma.$transaction([
            this.prisma.refreshToken.delete({ where: { id: stored.id } }),
        ]);
        return this.issueTokens(stored.user, family);
    }
    async logout(refreshToken) {
        const tokenHash = sha256Hex(refreshToken);
        const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
        if (!stored)
            return;
        await this.prisma.refreshToken.updateMany({
            where: { userId: stored.userId, family: stored.family, revokedAt: null },
            data: { revokedAt: this.clock.now() },
        });
    }
    async verifyAge(userId, input) {
        const player = await this.prisma.player.findUnique({ where: { userId } });
        if (!player)
            throw new domain_errors_1.NotFoundError('Player', userId);
        const now = this.clock.now();
        await this.prisma.player.update({
            where: { id: player.id },
            data: { ageVerifiedAt: now, birthDateConfirmed: true },
        });
        return { verified: true, verifiedAt: now };
    }
    async session(userId) {
        const player = await this.prisma.player.findUnique({ where: { userId }, include: { user: true } });
        if (!player || !player.user)
            throw new domain_errors_1.NotFoundError('Player', userId);
        return {
            userId: player.userId,
            username: player.username,
            role: player.user.role,
            countryCode: player.countryCode,
            nationality: player.nationality,
            ageVerified: player.ageVerifiedAt !== null,
            bettingHardAllowed: player.ageVerifiedAt !== null && player.reputation >= 30,
            accessTokenExpiresAt: new Date(this.clock.nowMs() + AuthService_1.ACCESS_TTL_S * 1000).toISOString(),
        };
    }
    async issueTokens(user, family) {
        const fam = family ?? Math.floor(Math.random() * 2 ** 31);
        const claims = {
            sub: user.id,
            role: user.role,
            fam,
            iss: 'race-nations-api',
            aud: 'race-nations-clients',
        };
        const iatSec = Math.floor(this.clock.nowMs() / 1000);
        const accessToken = await this.jwt.signAsync({ ...claims, iat: iatSec, exp: iatSec + AuthService_1.ACCESS_TTL_S }, { expiresIn: AuthService_1.ACCESS_TTL_S });
        const refreshToken = (0, node_crypto_1.randomBytes)(48).toString('base64url');
        await this.prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: sha256Hex(refreshToken),
                family: fam,
                expiresAt: new Date(this.clock.nowMs() + AuthService_1.REFRESH_TTL_S * 1000),
            },
        });
        return { accessToken, refreshToken, expiresIn: AuthService_1.ACCESS_TTL_S };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)(clock_1.CLOCK)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService, Object])
], AuthService);
function sha256Hex(value) {
    return (0, node_crypto_1.createHash)('sha256').update(value, 'utf8').digest('hex');
}
//# sourceMappingURL=auth.service.js.map