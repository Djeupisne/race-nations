"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const clock_1 = require("../../common/utils/clock");
const transactional_decorator_1 = require("../../common/decorators/transactional.decorator");
const domain_errors_1 = require("../../common/errors/domain-errors");
const idempotency_guard_1 = require("../../common/guards/idempotency.guard");
const wallet_repository_1 = require("./wallet.repository");
let WalletService = class WalletService {
    prisma;
    repo;
    clock;
    constructor(prisma, repo, clock) {
        this.prisma = prisma;
        this.repo = repo;
        this.clock = clock;
    }
    async balances(playerId) {
        const wallet = await this.getWalletOf(playerId);
        return {
            credits: wallet.credits,
            gems: wallet.gems,
            tokens: wallet.tokens,
            hardCents: wallet.hardCents,
        };
    }
    async transactions(playerId, query) {
        const wallet = await this.getWalletOf(playerId);
        const rows = await this.prisma.walletTransaction.findMany({
            where: { walletId: wallet.id, ...(query.cursor ? { id: { lt: query.cursor } } : {}) },
            orderBy: { createdAt: 'desc' },
            take: query.limit + 1,
            select: {
                id: true, type: true, currencyKind: true, amountSigned: true, balanceAfter: true,
                refType: true, refId: true, reversalOfId: true, createdAt: true,
            },
        });
        const items = rows.slice(0, query.limit);
        return {
            items: items.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
            nextCursor: rows.length > query.limit ? items[items.length - 1]?.id ?? null : null,
        };
    }
    async creditRaceRewards(playerId, matchId, rewards) {
        const walletId = await this.repo.getOrCreatePlayerWallet(this.prisma, playerId);
        if (rewards.credits > 0) {
            await this.repo.credit(this.prisma, {
                walletId,
                column: 'credits',
                amount: rewards.credits,
                type: 'REWARD',
                idempotencyKey: `reward:${matchId}:${playerId}:credits`,
                refType: 'MATCH',
                refId: matchId,
            });
        }
        if (rewards.gems > 0) {
            await this.repo.credit(this.prisma, {
                walletId,
                column: 'gems',
                amount: rewards.gems,
                type: 'REWARD',
                idempotencyKey: `reward:${matchId}:${playerId}:gems`,
                refType: 'MATCH',
                refId: matchId,
            });
        }
        if (rewards.tokens > 0) {
            await this.repo.credit(this.prisma, {
                walletId,
                column: 'tokens',
                amount: rewards.tokens,
                type: 'REWARD',
                idempotencyKey: `reward:${matchId}:${playerId}:tokens`,
                refType: 'MATCH',
                refId: matchId,
            });
        }
    }
    async creditDeposit(tx, playerId, amountCents, paymentId) {
        const walletId = await this.repo.getOrCreatePlayerWallet(tx, playerId);
        return this.repo.credit(tx, {
            walletId,
            column: 'hardCents',
            amount: amountCents,
            type: 'DEPOSIT',
            idempotencyKey: (0, idempotency_guard_1.deriveLedgerKey)('deposit', paymentId),
            refType: 'PAYMENT',
            refId: paymentId,
        });
    }
    async purchase(playerId, params) {
        assertPositiveInt(params.amount);
        const walletId = await this.repo.getOrCreatePlayerWallet(this.prisma, playerId);
        const txRow = await this.repo.debit(this.prisma, {
            walletId,
            column: params.column,
            amount: params.amount,
            type: 'PURCHASE',
            idempotencyKey: params.idempotencyKey,
            refType: 'SHOP_ITEM',
            refId: params.itemRef,
        });
        return { transactionId: txRow.id, balanceAfter: txRow.balanceAfter };
    }
    async adminAdjust(playerId, params) {
        if (!Number.isInteger(params.deltaSigned) || params.deltaSigned === 0) {
            throw new domain_errors_1.ValidationError({ field: 'deltaSigned', reason: 'Non-zero integer required.' });
        }
        const walletId = await this.repo.getOrCreatePlayerWallet(this.prisma, playerId);
        return params.deltaSigned > 0
            ? this.repo.credit(this.prisma, {
                walletId,
                column: params.column,
                amount: params.deltaSigned,
                type: 'ADMIN_ADJUSTMENT',
                idempotencyKey: params.idempotencyKey,
                refType: 'ADMIN',
                refId: params.reason.slice(0, 64),
            })
            : this.repo.debit(this.prisma, {
                walletId,
                column: params.column,
                amount: -params.deltaSigned,
                type: 'ADMIN_ADJUSTMENT',
                idempotencyKey: params.idempotencyKey,
                refType: 'ADMIN',
                refId: params.reason.slice(0, 64),
            });
    }
    async getWalletOf(playerId) {
        const wallet = await this.prisma.wallet.findUnique({ where: { playerId } });
        if (!wallet)
            throw new domain_errors_1.NotFoundError('Wallet', playerId);
        return wallet;
    }
};
exports.WalletService = WalletService;
__decorate([
    (0, transactional_decorator_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WalletService.prototype, "creditRaceRewards", null);
__decorate([
    (0, transactional_decorator_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WalletService.prototype, "purchase", null);
__decorate([
    (0, transactional_decorator_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WalletService.prototype, "adminAdjust", null);
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(clock_1.CLOCK)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_repository_1.WalletRepository, Object])
], WalletService);
function assertPositiveInt(n) {
    if (!Number.isInteger(n) || n <= 0)
        throw new domain_errors_1.ValidationError({ field: 'amount', reason: 'Positive integer required (INV-01).' });
}
//# sourceMappingURL=wallet.service.js.map