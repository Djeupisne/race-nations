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
var MatchSettlementService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchSettlementService = exports.BET_SETTLEMENT_QUEUE = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const wallet_service_1 = require("../wallet/wallet.service");
const players_service_1 = require("../players/players.service");
const matches_service_1 = require("./matches.service");
const bet_settlement_service_1 = require("../betting/bet-settlement.service");
const match_state_machine_1 = require("../../common/state-machines/match.state-machine");
const domain_errors_1 = require("../../common/errors/domain-errors");
exports.BET_SETTLEMENT_QUEUE = 'outbox:bet.settlement';
const REWARD_GRID_1V1 = {
    1: { credits: 500, gems: 5, xp: 100, tokens: 0 },
    2: { credits: 200, gems: 0, xp: 40, tokens: 0 },
};
let MatchSettlementService = MatchSettlementService_1 = class MatchSettlementService {
    prisma;
    redis;
    wallet;
    players;
    matches;
    betSettler;
    logger = new common_1.Logger(MatchSettlementService_1.name);
    constructor(prisma, redis, wallet, players, matches, betSettler) {
        this.prisma = prisma;
        this.redis = redis;
        this.wallet = wallet;
        this.players = players;
        this.matches = matches;
        this.betSettler = betSettler;
    }
    async settleValidatedMatch(matchId) {
        const match = await this.prisma.match.findUnique({ where: { id: matchId }, include: { players: true } });
        if (!match)
            throw new domain_errors_1.NotFoundError('Match', matchId);
        if (match.status !== 'FINISHED_VALIDATED') {
            this.logger.warn(`settle skipped match=${matchId} status=${match.status}`);
            return;
        }
        const ranked = [...match.players]
            .filter((p) => p.position !== null)
            .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
        for (const mp of ranked) {
            const grid = REWARD_GRID_1V1[mp.position ?? 99];
            if (grid) {
                await this.wallet.creditRaceRewards(mp.playerId, matchId, {
                    credits: grid.credits,
                    gems: grid.gems,
                    xp: grid.xp,
                    tokens: grid.tokens,
                });
            }
            const plDelta = !grid ? -30 : mp.position === 1 ? 25 : -20;
            await this.players.applyPlDelta(mp.playerId, plDelta);
            await this.prisma.matchPlayer.update({
                where: { matchId_playerId: { matchId, playerId: mp.playerId } },
                data: {
                    outcome: mp.position === 1 ? 'VICTORY' : 'DEFEAT',
                    plDelta,
                    rewardsCredits: grid?.credits ?? 0,
                    rewardsGems: grid?.gems ?? 0,
                    rewardsXp: grid?.xp ?? 0,
                    rewardsTokens: grid?.tokens ?? 0,
                },
            });
            await this.players.lockNationalityIfNeeded(mp.playerId);
        }
        const markets = await this.prisma.betMarket.findMany({
            where: { matchId, status: { in: ['LOCKED', 'RUNNING'] } },
            select: { id: true },
        });
        for (const m of markets) {
            const winnerSide = this.inferWinningSide(ranked, match.id, m.id);
            const payload = JSON.stringify({ marketId: m.id, matchId, winningSide: winnerSide ?? undefined, push: winnerSide === null });
            await this.enqueueBetSettlement(payload);
        }
        if (match.serverId)
            await this.matches.releaseServer(match.serverId);
        this.logger.log(`Match ${matchId} settled (${ranked.length} players, ${markets.length} bet markets queued)`);
    }
    async handleInvalidatedMatch(matchId, reason) {
        const markets = await this.prisma.betMarket.findMany({
            where: { matchId, status: { in: ['LOCKED', 'RUNNING', 'SETTLED'] } },
            select: { id: true },
        });
        for (const m of markets) {
            await this.enqueueBetDispute(JSON.stringify({ marketId: m.id, matchId, reason }));
        }
    }
    async processBetSettlementMessage(raw) {
        let msg;
        try {
            msg = JSON.parse(raw);
        }
        catch {
            this.logger.error(`Unparseable bet.settlement payload dropped: ${raw.slice(0, 200)}`);
            return;
        }
        await this.betSettler?.settleMarket({ marketId: msg.marketId, winningSide: msg.winningSide, push: msg.push });
    }
    inferWinningSide(ranked, _matchId, marketId) {
        void ranked;
        void marketId;
        return undefined;
    }
    async enqueueBetSettlement(payload) {
        const client = this.redis.client;
        if (client) {
            await client.lPush(exports.BET_SETTLEMENT_QUEUE, payload);
        }
        else {
            this.logger.warn(`Redis unavailable — bet.settlement deferred to reconciliation: ${payload}`);
        }
    }
    async enqueueBetDispute(payload) {
        const client = this.redis.client;
        if (client)
            await client.lPush('outbox:bet.dispute', payload);
    }
    assertValidated(status) {
        (0, match_state_machine_1.assertMatchTransition)(status, 'FINISHED_VALIDATED');
    }
};
exports.MatchSettlementService = MatchSettlementService;
exports.MatchSettlementService = MatchSettlementService = MatchSettlementService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(5, (0, common_1.Optional)()),
    __param(5, (0, common_1.Inject)('BET_SETTLER')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        wallet_service_1.WalletService,
        players_service_1.PlayersService,
        matches_service_1.MatchesService,
        bet_settlement_service_1.BetSettlementService])
], MatchSettlementService);
//# sourceMappingURL=match-settlement.service.js.map