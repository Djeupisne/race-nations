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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseWalletService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const wallet_repository_1 = require("../wallet/wallet.repository");
const domain_errors_1 = require("../../common/errors/domain-errors");
let HouseWalletService = class HouseWalletService {
    prisma;
    wallet;
    constructor(prisma, wallet) {
        this.prisma = prisma;
        this.wallet = wallet;
    }
    async getSnapshot() {
        const houseWalletId = await this.wallet.getHouseWalletId();
        const balances = await this.wallet.getBalances(houseWalletId);
        const escrowOutstanding = await this.prisma.bet.aggregate({
            _sum: { stake: true },
            where: { status: { in: ['ESCROWED', 'RUNNING'] }, market: { currency: 'HARD' } },
        });
        const feesAgg = await this.prisma.betSettlement.aggregate({
            _sum: { houseCut: true, residual: true },
        });
        return {
            hardCents: balances.hardCents,
            escrowOutstandingCents: escrowOutstanding._sum.stake ?? 0,
            cumulativeFeesCents: (feesAgg._sum.houseCut ?? 0) + (feesAgg._sum.residual ?? 0),
            liabilitiesCents: (escrowOutstanding._sum.stake ?? 0) - ((feesAgg._sum.houseCut ?? 0) + (feesAgg._sum.residual ?? 0)),
        };
    }
    async listTransactions(params) {
        const houseWalletId = await this.wallet.getHouseWalletId();
        return this.prisma.walletTransaction.findMany({
            where: {
                walletId: houseWalletId,
                ...(params.before ? { createdAt: { lt: params.before } } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: Math.min(params.limit ?? 100, 500),
            select: {
                id: true, type: true, currencyKind: true, amountSigned: true,
                balanceAfter: true, idempotencyKey: true, refType: true, refId: true, createdAt: true,
            },
        });
    }
    async reverseTransaction(params) {
        if (!params.reason || params.reason.trim().length < 10) {
            throw new domain_errors_1.ValidationError({ field: 'reason', reason: 'Reversal requires a documented reason (>= 10 chars).' });
        }
        const original = await this.prisma.walletTransaction.findUnique({ where: { id: params.originalTxId } });
        if (!original)
            throw new domain_errors_1.NotFoundError('WalletTransaction', params.originalTxId);
        const houseWalletId = await this.wallet.getHouseWalletId();
        if (original.walletId !== houseWalletId) {
            throw new domain_errors_1.ValidationError({ field: 'originalTxId', reason: 'Not a House ledger entry.' });
        }
        const already = await this.prisma.walletTransaction.findFirst({
            where: { reversalOfId: original.id },
            select: { id: true },
        });
        if (already)
            return { reversalTxId: already.id };
        const reversal = await this.prisma.$transaction(async (tx) => {
            const amount = Math.abs(original.amountSigned);
            const column = original.currencyKind === "CREDITS" ? "credits"
                : original.currencyKind === 'GEMS' ? 'gems'
                    : original.currencyKind === 'TOKENS' ? 'tokens'
                        : 'hardCents';
            if (original.amountSigned > 0) {
                return this.wallet.debit(tx, {
                    walletId: houseWalletId,
                    column,
                    amount,
                    type: 'REVERSAL',
                    idempotencyKey: `house-reversal:${original.id}`,
                    refType: 'WALLET_TX',
                    refId: original.id,
                });
            }
            return this.wallet.credit(tx, {
                walletId: houseWalletId,
                column,
                amount,
                type: 'HOUSE_REVERSAL',
                idempotencyKey: `house-reversal:${original.id}`,
                refType: 'WALLET_TX',
                refId: original.id,
                reversalOfId: original.id,
            });
        });
        return { reversalTxId: reversal.id };
    }
    async listSnapshots(days = 30) {
        return this.prisma.houseBalanceSnapshot.findMany({
            orderBy: { day: 'desc' },
            take: Math.min(days, 365),
        });
    }
};
exports.HouseWalletService = HouseWalletService;
exports.HouseWalletService = HouseWalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_repository_1.WalletRepository])
], HouseWalletService);
//# sourceMappingURL=house-wallet.service.js.map