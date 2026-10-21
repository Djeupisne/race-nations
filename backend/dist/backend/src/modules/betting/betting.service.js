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
var BettingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BettingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const wallet_repository_1 = require("../wallet/wallet.repository");
const idempotency_guard_1 = require("../../common/guards/idempotency.guard");
const betting_config_1 = require("../../config/betting.config");
const bet_state_machine_1 = require("../../common/state-machines/bet.state-machine");
const bet_market_state_machine_1 = require("../../common/state-machines/bet-market.state-machine");
const betting_errors_1 = require("../../common/errors/betting-errors");
const domain_errors_1 = require("../../common/errors/domain-errors");
const bet_validator_service_1 = require("./bet-validator.service");
const jurisdiction_service_1 = require("./jurisdiction.service");
const bet_odds_service_1 = require("./bet-odds.service");
const COLUMN_FOR_CURRENCY = { SOFT: 'credits', HARD: 'hardCents' };
let BettingService = BettingService_1 = class BettingService {
    prisma;
    wallet;
    config;
    validator;
    jurisdictions;
    odds;
    logger = new common_1.Logger(BettingService_1.name);
    constructor(prisma, wallet, config, validator, jurisdictions, odds) {
        this.prisma = prisma;
        this.wallet = wallet;
        this.config = config;
        this.validator = validator;
        this.jurisdictions = jurisdictions;
        this.odds = odds;
    }
    async createMarket(params) {
        await this.validator.validateMarketCreation(params.creator, params.currency, params.stake);
        let opponentId = null;
        if (params.opponentUsername) {
            const opp = await this.prisma.player.findUnique({ where: { username: params.opponentUsername } });
            if (!opp)
                throw new domain_errors_1.NotFoundError('Player', params.opponentUsername);
            if (opp.id === params.creator.id)
                throw new domain_errors_1.ForbiddenAdminError({}, 'You cannot challenge yourself.');
            await this.jurisdictions.assertAllowed(opp.countryCode, params.currency);
            opponentId = opp.id;
        }
        return this.prisma.betMarket.create({
            data: {
                creatorId: params.creator.id,
                opponentId,
                currency: params.currency,
                stake: params.stake,
                houseEdgeBps: this.config.constants.HOUSE_EDGE_BPS,
                status: opponentId ? 'CHALLENGED' : 'OPEN',
                public: !opponentId,
                trackId: params.trackId,
                vehicleId: params.vehicleId,
            },
        });
    }
    async joinMarket(marketId, player) {
        const { market } = await this.validator.validateJoin(marketId, player);
        const column = COLUMN_FOR_CURRENCY[market.currency];
        const result = await this.prisma.$transaction(async (tx) => {
            const fresh = await tx.betMarket.findUniqueOrThrow({ where: { id: market.id } });
            if (fresh.status !== 'OPEN' && fresh.status !== 'CHALLENGED') {
                throw new domain_errors_1.ValidationError({ field: 'status', reason: `Market became ${fresh.status}.` });
            }
            const bet = await tx.bet.create({
                data: {
                    marketId: fresh.id,
                    playerId: player.id,
                    side: fresh.creatorId === player.id ? 0 : 1,
                    stake: fresh.stake,
                    status: 'PENDING',
                },
            });
            const walletId = await this.wallet.getOrCreatePlayerWallet(tx, player.id);
            const houseWalletId = await this.wallet.getHouseWalletId(tx);
            const escrowKey = (0, idempotency_guard_1.deriveLedgerKey)('escrow', fresh.id, player.id);
            const escrowTx = await this.wallet
                .debit(tx, {
                walletId,
                column,
                amount: fresh.stake,
                type: 'BET_ESCROW',
                idempotencyKey: escrowKey,
                refType: 'BET_MARKET',
                refId: fresh.id,
            })
                .then((t) => t)
                .catch(async () => {
                const existing = await tx.walletTransaction.findUniqueOrThrow({ where: { idempotencyKey: escrowKey } });
                return existing;
            });
            await this.wallet.credit(tx, {
                walletId: houseWalletId,
                column,
                amount: fresh.stake,
                type: 'HOUSE_FEE',
                idempotencyKey: `${escrowKey}:house`,
                refType: 'BET_MARKET',
                refId: fresh.id,
            });
            await tx.bet.update({
                where: { id: bet.id },
                data: { status: 'ESCROWED', escrowTxId: escrowTx.id },
            });
            (0, bet_state_machine_1.assertBetTransition)('PENDING', 'ESCROWED');
            const poolAgg = await tx.bet.aggregate({
                where: { marketId: fresh.id, status: { in: ['ESCROWED', 'RUNNING'] } },
                _sum: { stake: true },
            });
            const totalPool = poolAgg._sum.stake ?? 0;
            const bothSidesEscrowed = await tx.bet.count({ where: { marketId: fresh.id, status: { in: ['ESCROWED', 'RUNNING'] } } });
            const locked = bothSidesEscrowed >= 2 || (fresh.opponentId !== null && bothSidesEscrowed >= 2);
            const nextStatus = locked ? 'LOCKED' : fresh.status === 'OPEN' ? 'CHALLENGED' : fresh.status;
            if (nextStatus !== fresh.status)
                (0, bet_market_state_machine_1.assertBetMarketTransition)(fresh.status, nextStatus);
            const updated = await tx.betMarket.update({
                where: { id: fresh.id },
                data: {
                    totalPool,
                    houseCutEstimate: this.odds.recomputeCutEstimate(totalPool, fresh.houseEdgeBps),
                    ...(fresh.opponentId === null && !locked ? { opponentId: player.id } : {}),
                    status: nextStatus,
                },
            });
            const finalBet = await tx.bet.findUniqueOrThrow({ where: { id: bet.id } });
            return { market: updated, bet: finalBet };
        });
        this.logger.log(`Joined market=${marketId} player=${player.id} stake=${market.stake}`);
        return result;
    }
    async listMarkets(query) {
        const where = {};
        if (query.status)
            where.status = query.status;
        if (query.currency)
            where.currency = query.currency;
        if (query.trackId)
            where.trackId = query.trackId;
        if (query.cursor)
            where.id = { gt: query.cursor };
        const rows = await this.prisma.betMarket.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: query.limit + 1,
        });
        const hasMore = rows.length > query.limit;
        return { items: rows.slice(0, query.limit), nextCursor: hasMore ? rows[query.limit - 1].id : null };
    }
    async getMarket(marketId) {
        const market = await this.prisma.betMarket.findUnique({
            where: { id: marketId },
            include: { bets: { include: { player: { select: { id: true, username: true, nationality: true, plPoints: true } } } } },
        });
        if (!market)
            throw new domain_errors_1.NotFoundError('BetMarket', marketId);
        return market;
    }
    async myBets(playerId, statusFilter) {
        const where = { playerId };
        if (statusFilter)
            where.status = statusFilter;
        return this.prisma.bet.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: { market: { select: { id: true, status: true, currency: true, trackId: true, totalPool: true } } },
        });
    }
    async cancelMarket(marketId, actor) {
        const market = await this.prisma.betMarket.findUnique({ where: { id: marketId } });
        if (!market)
            throw new domain_errors_1.NotFoundError('BetMarket', marketId);
        if (market.creatorId !== actor.id)
            throw new domain_errors_1.ForbiddenAdminError({}, 'Only the creator can cancel.');
        if (market.status !== 'OPEN' && market.status !== 'CHALLENGED') {
            throw new domain_errors_1.ValidationError({ field: 'status', reason: 'Only an unsettled open market can be cancelled.' });
        }
        const settled = await this.prisma.betSettlement.findUnique({ where: { marketId }, select: { id: true } });
        if (settled)
            throw new betting_errors_1.BetAlreadySettledError(marketId);
        return this.prisma.$transaction(async (tx) => {
            const column = COLUMN_FOR_CURRENCY[market.currency];
            const bets = await tx.bet.findMany({ where: { marketId, status: 'ESCROWED' } });
            for (const b of bets) {
                const walletId = await this.wallet.getOrCreatePlayerWallet(tx, b.playerId);
                const houseWalletId = await this.wallet.getHouseWalletId(tx);
                const refundKey = (0, idempotency_guard_1.deriveLedgerKey)('refund', marketId, b.playerId);
                await tx.walletTransaction.findUnique({ where: { idempotencyKey: refundKey } }).then(async (hit) => {
                    if (hit)
                        return;
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
                        walletId,
                        column,
                        amount: b.stake,
                        type: 'BET_REFUND',
                        idempotencyKey: refundKey,
                        refType: 'BET_MARKET',
                        refId: marketId,
                    });
                });
                (0, bet_state_machine_1.assertBetTransition)(b.status, 'REFUNDED');
                await tx.bet.update({ where: { id: b.id }, data: { status: 'REFUNDED', result: 'REFUND' } });
            }
            (0, bet_market_state_machine_1.assertBetMarketTransition)(market.status, 'CANCELLED');
            return tx.betMarket.update({
                where: { id: marketId },
                data: { status: 'CANCELLED', cancelledAt: new Date(), totalPool: 0 },
            });
        });
    }
    oddsOf(marketId) {
        return this.odds.oddsForMarket(marketId);
    }
};
exports.BettingService = BettingService;
exports.BettingService = BettingService = BettingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(betting_config_1.BETTING_CONFIG)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_repository_1.WalletRepository, Object, bet_validator_service_1.BetValidatorService,
        jurisdiction_service_1.JurisdictionService,
        bet_odds_service_1.BetOddsService])
], BettingService);
//# sourceMappingURL=betting.service.js.map