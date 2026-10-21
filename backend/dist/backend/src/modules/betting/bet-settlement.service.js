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
var BetSettlementService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetSettlementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const wallet_repository_1 = require("../wallet/wallet.repository");
const idempotency_guard_1 = require("../../common/guards/idempotency.guard");
const parimutuel_1 = require("../../common/utils/parimutuel");
const bet_state_machine_1 = require("../../common/state-machines/bet.state-machine");
const bet_market_state_machine_1 = require("../../common/state-machines/bet-market.state-machine");
const betting_errors_1 = require("../../common/errors/betting-errors");
const domain_errors_1 = require("../../common/errors/domain-errors");
const COLUMN_FOR_CURRENCY = { SOFT: 'credits', HARD: 'hardCents' };
let BetSettlementService = BetSettlementService_1 = class BetSettlementService {
    prisma;
    wallet;
    logger = new common_1.Logger(BetSettlementService_1.name);
    constructor(prisma, wallet) {
        this.prisma = prisma;
        this.wallet = wallet;
    }
    async settleMarket(params) {
        const existing = await this.prisma.betSettlement.findUnique({ where: { marketId: params.marketId } });
        if (existing) {
            this.logger.log(`settle skipped (already settled) market=${params.marketId}`);
            return existing;
        }
        const market = await this.prisma.betMarket.findUnique({
            where: { id: params.marketId },
            include: { bets: true, match: { select: { status: true } } },
        });
        if (!market)
            throw new domain_errors_1.NotFoundError('BetMarket', params.marketId);
        if (market.status === 'SETTLED')
            throw new betting_errors_1.BetAlreadySettledError(market.id);
        if (market.status !== 'LOCKED') {
            throw new domain_errors_1.ValidationError({ field: 'status', reason: `Cannot settle a ${market.status} market.` });
        }
        const escrowed = market.bets.filter((b) => b.status === 'ESCROWED' || b.status === 'RUNNING');
        if (escrowed.length < 2) {
            throw new domain_errors_1.ValidationError({ field: 'bets', reason: 'Locked market without two escrowed positions.' });
        }
        const column = COLUMN_FOR_CURRENCY[market.currency];
        const stakes = escrowed.map((b) => ({ playerId: b.playerId, stake: b.stake }));
        const byPlayer = new Map(escrowed.map((b) => [b.playerId, b]));
        let calc;
        if (params.push) {
            calc = (0, parimutuel_1.computePushRefund)(stakes);
        }
        else {
            if (params.winningSide === undefined)
                throw new domain_errors_1.ValidationError({ field: 'winningSide', reason: 'Required unless push.' });
            const winners = new Set(escrowed.filter((b) => b.side === params.winningSide).map((b) => b.playerId));
            if (winners.size === 0)
                throw new domain_errors_1.ValidationError({ field: 'winningSide', reason: 'No escrowed bet on winning side.' });
            calc = (0, parimutuel_1.computeParimutuelSettlement)(stakes, winners, market.houseEdgeBps);
        }
        const payoutByBet = new Map();
        for (const p of calc.payouts) {
            const bet = byPlayer.get(p.playerId);
            if (bet)
                payoutByBet.set(bet.id, p.payout);
        }
        const settlement = await this.prisma.$transaction(async (tx) => {
            (0, bet_market_state_machine_1.assertBetMarketTransition)(market.status, 'SETTLING');
            await tx.betMarket.update({ where: { id: market.id }, data: { status: 'SETTLING' } });
            const idemKey = (0, idempotency_guard_1.deriveLedgerKey)('payout', market.id).replace('payout:', 'settle:');
            try {
                const created = await tx.betSettlement.create({
                    data: {
                        marketId: market.id,
                        totalPool: calc.totalPool,
                        houseCut: calc.houseCut,
                        netPool: calc.netPool,
                        payouts: payoutByBet,
                        residual: calc.residue,
                        idempotencyKey: idemKey,
                        settledBy: params.settledById ?? null,
                    },
                });
                const houseWalletId = await this.wallet.getHouseWalletId(tx);
                for (const b of escrowed) {
                    const payout = payoutByBet.get(b.id) ?? 0;
                    const isWinner = payout > 0;
                    if (isWinner) {
                        const key = (0, idempotency_guard_1.deriveLedgerKey)('payout', market.id, b.id);
                        await this.wallet.debit(tx, {
                            walletId: houseWalletId,
                            column,
                            amount: payout,
                            type: 'HOUSE_REVERSAL',
                            idempotencyKey: `${key}:house`,
                            refType: 'BET_MARKET',
                            refId: market.id,
                        });
                        await this.wallet.credit(tx, {
                            walletId: await this.wallet.getOrCreatePlayerWallet(tx, b.playerId),
                            column,
                            amount: payout,
                            type: 'BET_PAYOUT',
                            idempotencyKey: key,
                            refType: 'BET_MARKET',
                            refId: market.id,
                        });
                    }
                    const nextStatus = params.push ? 'PUSH' : isWinner ? 'WON' : 'LOST';
                    (0, bet_state_machine_1.assertBetTransition)(b.status, nextStatus);
                    await tx.bet.update({
                        where: { id: b.id },
                        data: { status: nextStatus, result: params.push ? 'PUSH' : isWinner ? 'WIN' : 'LOSS', payout: payoutByBet.get(b.id) ?? 0 },
                    });
                }
                if (calc.residue > 0) {
                    await this.wallet.credit(tx, {
                        walletId: houseWalletId,
                        column,
                        amount: calc.residue,
                        type: 'HOUSE_FEE',
                        idempotencyKey: (0, idempotency_guard_1.deriveLedgerKey)('housecut', market.id),
                        refType: 'BET_MARKET',
                        refId: market.id,
                    });
                }
                return created;
            }
            catch (err) {
                if (err.code === 'P2002') {
                    const winner = await tx.betSettlement.findUniqueOrThrow({ where: { marketId: market.id } });
                    return winner;
                }
                throw err;
            }
        });
        await this.prisma.betMarket
            .update({ where: { id: market.id }, data: { status: 'SETTLED' } })
            .catch(() => undefined);
        this.logger.log(`Settled market=${market.id} pool=${calc.totalPool} cut=${calc.houseCut} residue=${calc.residue}`);
        return settlement;
    }
    async openDispute(marketId, reason) {
        const market = await this.prisma.betMarket.findUnique({ where: { id: marketId } });
        if (!market)
            throw new domain_errors_1.NotFoundError('BetMarket', marketId);
        if (market.status === 'DISPUTED')
            return;
        if (market.status !== 'SETTLED' && market.status !== 'LOCKED' && market.status !== 'RUNNING') {
            throw new domain_errors_1.ValidationError({ field: 'status', reason: `Cannot dispute a ${market.status} market.` });
        }
        (0, bet_market_state_machine_1.assertBetMarketTransition)(market.status, 'DISPUTED');
        await this.prisma.betMarket.update({
            where: { id: marketId },
            data: { status: 'DISPUTED', disputedAt: new Date(), disputeReason: reason },
        });
        this.logger.warn(`Market ${marketId} DISPUTED (${reason}) — resolution manuelle requise sous 72 h`);
    }
    async resolveDispute(marketId, outcome) {
        const market = await this.prisma.betMarket.findUnique({ where: { id: marketId }, include: { bets: true } });
        if (!market)
            throw new domain_errors_1.NotFoundError('BetMarket', marketId);
        if (market.status !== 'DISPUTED')
            throw new domain_errors_1.ValidationError({ field: 'status', reason: 'Market is not disputed.' });
        if (outcome === 'UPHELD') {
            await this.prisma.betMarket.update({ where: { id: marketId }, data: { status: 'SETTLED', disputedAt: null } });
            return;
        }
        const column = COLUMN_FOR_CURRENCY[market.currency];
        await this.prisma.$transaction(async (tx) => {
            const houseWalletId = await this.wallet.getHouseWalletId(tx);
            for (const b of market.bets) {
                if (b.status !== 'WON' && b.status !== 'LOST' && b.status !== 'PUSH' && b.status !== 'ESCROWED' && b.status !== 'RUNNING')
                    continue;
                const refundKey = (0, idempotency_guard_1.deriveLedgerKey)('refund', marketId, b.playerId);
                const already = await tx.walletTransaction.findUnique({ where: { idempotencyKey: refundKey } });
                if (already)
                    continue;
                const creditTo = await this.wallet.getOrCreatePlayerWallet(tx, b.playerId);
                await this.wallet.debit(tx, {
                    walletId: houseWalletId,
                    column,
                    amount: b.stake,
                    type: 'REVERSAL',
                    idempotencyKey: `${refundKey}:house`,
                    refType: 'BET_MARKET',
                    refId: marketId,
                });
                await this.wallet.credit(tx, {
                    walletId: creditTo,
                    column,
                    amount: b.stake,
                    type: 'BET_REFUND',
                    idempotencyKey: refundKey,
                    refType: 'BET_MARKET',
                    refId: marketId,
                });
                const currentBetState = b.status;
                if (currentBetState !== 'REFUNDED' && currentBetState !== 'VOIDED')
                    (0, bet_state_machine_1.assertBetTransition)(currentBetState, 'REFUNDED');
                await tx.bet.update({ where: { id: b.id }, data: { status: 'REFUNDED', result: 'REFUND' } });
            }
            await tx.betMarket.update({ where: { id: marketId }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
        });
        this.logger.log(`Dispute ${marketId} resolved REFUND_ALL`);
    }
};
exports.BetSettlementService = BetSettlementService;
exports.BetSettlementService = BetSettlementService = BetSettlementService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_repository_1.WalletRepository])
], BetSettlementService);
//# sourceMappingURL=bet-settlement.service.js.map