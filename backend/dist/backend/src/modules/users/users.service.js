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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const argon2 = __importStar(require("argon2"));
const prisma_service_1 = require("../../prisma/prisma.service");
const clock_1 = require("../../common/utils/clock");
const domain_errors_1 = require("../../common/errors/domain-errors");
const ARGON2_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
};
let UsersService = class UsersService {
    prisma;
    clock;
    constructor(prisma, clock) {
        this.prisma = prisma;
        this.clock = clock;
    }
    async findById(userId) {
        return this.prisma.user.findUnique({ where: { id: userId } });
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    }
    async changePassword(userId, currentPassword, newPassword) {
        if (newPassword.length < 8 || newPassword.length > 128) {
            throw new domain_errors_1.ValidationError({ field: 'password', reason: 'Length must be 8–128.' });
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new domain_errors_1.NotFoundError('User', userId);
        const ok = await argon2.verify(user.passwordHash, currentPassword).catch(() => false);
        if (!ok)
            throw new domain_errors_1.AuthUnauthenticatedError({}, 'Current password is incorrect.');
        const hash = await argon2.hash(newPassword, ARGON2_OPTIONS);
        const now = this.clock.now();
        await this.prisma.$transaction([
            this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } }),
            this.prisma.refreshToken.updateMany({
                where: { userId, revokedAt: null },
                data: { revokedAt: now },
            }),
        ]);
    }
    async changeEmail(userId, newEmail) {
        const email = newEmail.toLowerCase();
        const clash = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
        if (clash)
            throw new domain_errors_1.ValidationError({ field: 'email', reason: 'Email already in use.' });
        await this.prisma.user.update({ where: { id: userId }, data: { email } });
    }
    async deleteAccount(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { player: true } });
        if (!user)
            return { deleted: false };
        const anonSuffix = `gdpr-${userId.slice(0, 8)}`;
        await this.prisma.$transaction(async (tx) => {
            if (user.player) {
                await tx.player.update({
                    where: { id: user.player.id },
                    data: {
                        username: `${anonSuffix}-${Math.floor(this.clock.nowMs() % 1_000_000)}`,
                        countryCode: 'XX',
                        acceptedTermsAt: null,
                        acceptedPrivacyAt: null,
                        kycDocumentRef: null,
                        marketingOptIn: false,
                    },
                });
            }
            await tx.refreshToken.deleteMany({ where: { userId } });
            await tx.user.update({
                where: { id: userId },
                data: { email: `${anonSuffix}@deleted.invalid`, passwordHash: '!!DELETED!!' },
            });
        });
        return { deleted: true };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { player: { select: { username: true } } },
        });
        if (!user)
            throw new domain_errors_1.NotFoundError('User', userId);
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            displayName: user.player?.username ?? null,
            createdAt: user.createdAt,
        };
    }
    async updateProfile(userId, dto) {
        const playerData = {};
        if (dto.displayName !== undefined)
            playerData.username = dto.displayName;
        if (dto.preferredLanguage !== undefined)
            playerData.preferredLanguage = dto.preferredLanguage;
        let displayName = null;
        if (Object.keys(playerData).length > 0) {
            const updated = await this.prisma.player.update({ where: { userId }, data: playerData });
            displayName = updated.username;
        }
        else {
            const player = await this.prisma.player.findUnique({ where: { userId }, select: { username: true } });
            displayName = player?.username ?? null;
        }
        return { id: userId, displayName };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(clock_1.CLOCK)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], UsersService);
//# sourceMappingURL=users.service.js.map