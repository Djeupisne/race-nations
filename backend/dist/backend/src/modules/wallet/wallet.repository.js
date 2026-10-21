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
exports.WalletRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const domain_errors_1 = require("../../common/errors/domain-errors");
const WALLET_COLUMNS = new Set(['credits', 'gems', 'tokens', 'hardCents']);
let WalletRepository = class WalletRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async lockWallet(tx, walletId) {
        const rows = await tx.$queryRaw `
      SELECT id, credits, gems, tokens, "hardCents"
      FROM wallets
      WHERE id = ${walletId}::uuid
      FOR UPDATE
    `;
        const wallet = rows[0];
        if (!wallet)
            throw new domain_errors_1.NotFoundError('Wallet', walletId);
        return wallet;
    }
    async findTxByIdempotencyKey(idempotencyKey) {
        return this.prisma.walletTransaction.findUnique({ where: { idempotencyKey } });
    }
    async debit(tx, params) {
        assertAmount(params.amount);
        assertColumn(params.column);
        const existing = await tx.walletTransaction.findUnique({ where: { idempotencyKey: params.idempotencyKey } });
        if (existing)
            return existing;
        const wallet = await this.lockWallet(tx, params.walletId);
        const before = wallet[params.column];
        if (before < params.amount) {
            throw new domain_errors_1.InsufficientFundsError(params.column === 'hardCents' ? 'HARD' : 'SOFT', params.amount, before);
        }
        const after = before - params.amount;
        await tx.wallet.update({ where: { id: params.walletId }, data: { [params.column]: after } });
        return this.appendTx(tx, {
            walletId: params.walletId,
            type: params.type,
            currencyKind: currencyKindOf(params.column),
            amountSigned: -params.amount,
            balanceAfter: after,
            idempotencyKey: params.idempotencyKey,
            refType: params.refType,
            refId: params.refId,
        });
    }
    async credit(tx, params) {
        assertAmount(params.amount);
        assertColumn(params.column);
        const existing = await tx.walletTransaction.findUnique({ where: { idempotencyKey: params.idempotencyKey } });
        if (existing)
            return existing;
        const wallet = await this.lockWallet(tx, params.walletId);
        const after = wallet[params.column] + params.amount;
        await tx.wallet.update({ where: { id: params.walletId }, data: { [params.column]: after } });
        return this.appendTx(tx, {
            walletId: params.walletId,
            type: params.type,
            currencyKind: currencyKindOf(params.column),
            amountSigned: params.amount,
            balanceAfter: after,
            idempotencyKey: params.idempotencyKey,
            refType: params.refType,
            refId: params.refId,
            reversalOfId: params.reversalOfId,
        });
    }
    async transfer(tx, params) {
        const [first, second] = params.fromWalletId < params.toWalletId
            ? [params.fromWalletId, params.toWalletId]
            : [params.toWalletId, params.fromWalletId];
        await this.lockWallet(tx, first);
        await this.lockWallet(tx, second);
        await this.debit(tx, {
            walletId: params.fromWalletId,
            column: params.column,
            amount: params.amount,
            type: params.debitType,
            idempotencyKey: params.debitKey,
            refType: params.refType,
            refId: params.refId,
        });
        await this.credit(tx, {
            walletId: params.toWalletId,
            column: params.column,
            amount: params.amount,
            type: params.creditType,
            idempotencyKey: params.creditKey,
            refType: params.refType,
            refId: params.refId,
        });
    }
    async getBalances(walletId) {
        const w = await this.prisma.wallet.findUnique({
            where: { id: walletId },
            select: { id: true, credits: true, gems: true, tokens: true, hardCents: true },
        });
        if (!w)
            throw new domain_errors_1.NotFoundError('Wallet', walletId);
        return w;
    }
    async getHouseWalletId(tx) {
        const client = tx ?? this.prisma;
        const house = await client.wallet.findFirst({ where: { ownerType: 'HOUSE' }, select: { id: true } });
        if (!house) {
            throw new domain_errors_1.ServerUnavailableError('House wallet missing (run 0006_house_wallet seed).');
        }
        return house.id;
    }
    async getOrCreatePlayerWallet(tx, playerId) {
        const existing = await tx.wallet.findUnique({ where: { playerId }, select: { id: true } });
        if (existing)
            return existing.id;
        const created = await tx.wallet.create({ data: { playerId, ownerType: 'PLAYER' }, select: { id: true } });
        return created.id;
    }
    appendTx(tx, data) {
        return tx.walletTransaction.create({
            data: {
                walletId: data.walletId,
                type: data.type,
                currencyKind: data.currencyKind,
                amountSigned: data.amountSigned,
                balanceAfter: data.balanceAfter,
                idempotencyKey: data.idempotencyKey,
                refType: data.refType,
                refId: data.refId,
                reversalOfId: data.reversalOfId,
            },
        }).catch((err) => {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                return tx.walletTransaction.findUniqueOrThrow({ where: { idempotencyKey: data.idempotencyKey } });
            }
            throw err;
        });
    }
};
exports.WalletRepository = WalletRepository;
exports.WalletRepository = WalletRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletRepository);
function assertAmount(amount) {
    if (!Number.isInteger(amount) || amount <= 0) {
        throw new TypeError(`Wallet amount must be a positive integer, got ${String(amount)}`);
    }
}
function assertColumn(column) {
    if (!WALLET_COLUMNS.has(column))
        throw new TypeError(`Unknown wallet column: ${String(column)}`);
}
function currencyKindOf(column) {
    switch (column) {
        case 'credits': return 'CREDITS';
        case 'gems': return 'GEMS';
        case 'tokens': return 'TOKENS';
        case 'hardCents': return 'HARD_CENTS';
    }
}
//# sourceMappingURL=wallet.repository.js.map