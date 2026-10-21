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
exports.BetValidatorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const betting_config_1 = require("../../config/betting.config");
const betting_errors_1 = require("../../common/errors/betting-errors");
const domain_errors_1 = require("../../common/errors/domain-errors");
const bet_market_state_machine_1 = require("../../common/state-machines/bet-market.state-machine");
const jurisdiction_service_1 = require("./jurisdiction.service");
const bet_limits_service_1 = require("./bet-limits.service");
let BetValidatorService = class BetValidatorService {
    prisma;
    config;
    jurisdictions;
    limits;
    constructor(prisma, config, jurisdictions, limits) {
        this.prisma = prisma;
        this.config = config;
        this.jurisdictions = jurisdictions;
        this.limits = limits;
    }
    async validateMarketCreation(player, currency, stake) {
        this.assertKillSwitch(currency);
        await this.jurisdictions.assertAllowed(player.countryCode, currency);
        this.limits.assertStakeBounds(currency, stake);
        await this.limits.assertWithinLimits({ playerId: player.id, countryCode: player.countryCode, currency }, stake);
    }
    async validateJoin(marketId, player) {
        const market = await this.prisma.betMarket.findUnique({ where: { id: marketId } });
        if (!market)
            throw new domain_errors_1.NotFoundError('BetMarket', marketId);
        if (market.creatorId === player.id) {
            throw new domain_errors_1.ForbiddenAdminError({}, 'You cannot bet against yourself.');
        }
        const existing = await this.prisma.bet.findUnique({
            where: { marketId_playerId: { marketId, playerId: player.id } },
            select: { id: true },
        });
        if (existing)
            throw new domain_errors_1.ValidationError({ field: 'marketId', reason: 'Already positioned on this market.' });
        if (market.status !== 'OPEN' && market.status !== 'CHALLENGED') {
            throw new domain_errors_1.ValidationError({ field: 'status', reason: `Market is ${market.status}; joining requires OPEN or CHALLENGED.` });
        }
        if (!(0, bet_market_state_machine_1.canBetMarketTransition)(market.status, 'LOCKED')) {
            throw new domain_errors_1.ValidationError({ field: 'status', reason: 'Illegal market transition for join.' });
        }
        if (market.opponentId && market.opponentId !== player.id) {
            throw new domain_errors_1.ForbiddenAdminError({}, 'This challenge is reserved for another player.');
        }
        const currency = market.currency;
        this.assertKillSwitch(currency);
        await this.jurisdictions.assertAllowed(player.countryCode, currency);
        this.limits.assertStakeBounds(currency, market.stake);
        await this.limits.assertWithinLimits({ playerId: player.id, countryCode: player.countryCode, currency }, market.stake);
        if (market.opponentId === null || market.opponentId === player.id) {
            const creator = await this.prisma.player.findUnique({
                where: { id: market.creatorId },
                select: { plPoints: true },
            });
            if (creator && Math.abs(creator.plPoints - player.plPoints) > this.config.constants.PL_DELTA_MAX) {
                throw new domain_errors_1.ValidationError({
                    field: 'plDelta',
                    reason: `PL gap ${Math.abs(creator.plPoints - player.plPoints)} exceeds max ${this.config.constants.PL_DELTA_MAX}.`,
                });
            }
        }
        return { market, player };
    }
    assertEqualStakes(stakeA, stakeB) {
        if (stakeA !== stakeB)
            throw new betting_errors_1.BetStakeMismatchError(stakeA, stakeB);
    }
    assertKillSwitch(currency) {
        const flags = this.config.flags();
        if (currency === 'HARD' && !flags.hardEnabled) {
            throw new domain_errors_1.ValidationError({ field: 'currency', reason: 'Hard-currency betting is temporarily disabled.' });
        }
        if (currency === 'SOFT' && !flags.softEnabled) {
            throw new domain_errors_1.ValidationError({ field: 'currency', reason: 'Soft-currency betting is temporarily disabled.' });
        }
    }
};
exports.BetValidatorService = BetValidatorService;
exports.BetValidatorService = BetValidatorService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(betting_config_1.BETTING_CONFIG)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, jurisdiction_service_1.JurisdictionService,
        bet_limits_service_1.BetLimitsService])
], BetValidatorService);
//# sourceMappingURL=bet-validator.service.js.map