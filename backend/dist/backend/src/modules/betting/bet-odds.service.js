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
exports.BetOddsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const money_1 = require("../../common/utils/money");
const domain_errors_1 = require("../../common/errors/domain-errors");
let BetOddsService = class BetOddsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async oddsForMarket(marketId) {
        const market = await this.prisma.betMarket.findUnique({
            where: { id: marketId },
            include: { bets: { include: { player: { select: { id: true, username: true } } } } },
        });
        if (!market)
            throw new domain_errors_1.NotFoundError('BetMarket', marketId);
        const counted = market.bets.filter((b) => ['ACCEPTED', 'ESCROWED', 'RUNNING', 'WON', 'LOST', 'PUSH'].includes(b.status));
        const totalPool = counted.reduce((acc, b) => acc + b.stake, 0);
        const houseCut = (0, money_1.applyBpsFloor)(totalPool, market.houseEdgeBps);
        const netPool = totalPool - houseCut;
        const sidesMap = new Map();
        for (const b of counted) {
            const entry = sidesMap.get(b.side) ?? { staked: 0, players: [] };
            entry.staked += b.stake;
            entry.players.push({ playerId: b.playerId, username: b.player.username, stake: b.stake });
            sidesMap.set(b.side, entry);
        }
        const sides = [0, 1].map((side) => {
            const info = sidesMap.get(side) ?? { staked: 0, players: [] };
            const payoutEstimate = info.staked > 0 && netPool > 0 ? (0, money_1.floorDiv)(info.staked * netPool, info.staked) : 0;
            const implied = info.staked > 0 ? Math.round((netPool / info.staked) * 100) / 100 : null;
            return {
                side,
                stakedTotal: info.staked,
                players: info.players,
                payoutEstimate: info.staked > 0 ? netPool : 0,
                impliedDecimalOdds: implied,
            };
        });
        return {
            marketId: market.id,
            status: market.status,
            currency: market.currency,
            totalPool,
            houseCutEstimate: houseCut,
            netPool,
            sides,
        };
    }
    recomputeCutEstimate(totalPool, houseEdgeBps) {
        return (0, money_1.applyBpsFloor)(totalPool, houseEdgeBps);
    }
};
exports.BetOddsService = BetOddsService;
exports.BetOddsService = BetOddsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BetOddsService);
//# sourceMappingURL=bet-odds.service.js.map