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
exports.BetLimitsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const clock_1 = require("../../common/utils/clock");
const betting_config_1 = require("../../config/betting.config");
const betting_errors_1 = require("../../common/errors/betting-errors");
const jurisdiction_service_1 = require("./jurisdiction.service");
let BetLimitsService = class BetLimitsService {
    prisma;
    config;
    clock;
    jurisdictions;
    constructor(prisma, config, clock, jurisdictions) {
        this.prisma = prisma;
        this.config = config;
        this.clock = clock;
        this.jurisdictions = jurisdictions;
    }
    assertStakeBounds(currency, stake) {
        const { min, max } = (0, betting_config_1.stakeBounds)(currency);
        if (!Number.isSafeInteger(stake) || stake < min || stake > max) {
            throw new betting_errors_1.BetStakeOutOfRangeError(min, max, stake);
        }
    }
    async assertWithinLimits(ctx, additionalStake) {
        const since = new Date(this.clock.nowMs() - this.config.constants.DAILY_WINDOW_MS);
        if (ctx.currency === 'SOFT') {
            const used = await this.sumEscrowSince(ctx.playerId, 'CREDITS', since);
            const limit = this.config.constants.DAILY_SOFT_LIMIT;
            if (used + additionalStake > limit) {
                throw new betting_errors_1.BetDailyLimitExceededError(limit, used, additionalStake);
            }
            return;
        }
        const player = await this.prisma.player.findUnique({
            where: { id: ctx.playerId },
            select: { reputation: true, ageVerifiedAt: true },
        });
        if (!player)
            throw new betting_errors_1.AgeVerificationRequiredError();
        if (player.reputation < this.config.constants.MIN_REPUTATION_HARD) {
            throw new betting_errors_1.ReputationTooLowError(player.reputation, this.config.constants.MIN_REPUTATION_HARD);
        }
        if (!player.ageVerifiedAt)
            throw new betting_errors_1.AgeVerificationRequiredError();
        const juris = await this.jurisdictions.get(ctx.countryCode);
        const monthAgo = new Date(this.clock.nowMs() - 30 * 24 * 3_600_000);
        const usedMonth = await this.sumEscrowSince(ctx.playerId, 'HARD_CENTS', monthAgo);
        const monthlyCap = Math.min(juris.monthlyHardLimitCents ?? Number.MAX_SAFE_INTEGER, this.config.constants.MONTHLY_HARD_CAP_CENTS);
        if (usedMonth + additionalStake > monthlyCap) {
            throw new betting_errors_1.BetDailyLimitExceededError(monthlyCap, usedMonth, additionalStake);
        }
        if (juris.dailyHardLimitCents !== null) {
            const dayAgo = new Date(this.clock.nowMs() - 24 * 3_600_000);
            const usedDay = await this.sumEscrowSince(ctx.playerId, 'HARD_CENTS', dayAgo);
            if (usedDay + additionalStake > juris.dailyHardLimitCents) {
                throw new betting_errors_1.BetDailyLimitExceededError(juris.dailyHardLimitCents, usedDay, additionalStake);
            }
        }
    }
    async usage(playerId, currency) {
        const since = new Date(this.clock.nowMs() - this.config.constants.DAILY_WINDOW_MS);
        const used24h = await this.sumEscrowSince(playerId, currency === 'SOFT' ? 'CREDITS' : 'HARD_CENTS', since);
        return {
            currency,
            windowHours: 24,
            used: used24h,
            softDailyLimit: this.config.constants.DAILY_SOFT_LIMIT,
        };
    }
    async sumEscrowSince(playerId, kind, since) {
        const wallet = await this.prisma.wallet.findUnique({ where: { playerId }, select: { id: true } });
        if (!wallet)
            return 0;
        const col = kind === 'CREDITS' ? 'credits' : 'hardCents';
        const agg = await this.prisma.walletTransaction.aggregate({
            where: {
                walletId: wallet.id,
                type: 'BET_ESCROW',
                createdAt: { gte: since },
            },
            _sum: { amountSigned: true },
        });
        void col;
        return Math.abs(agg._sum.amountSigned ?? 0);
    }
};
exports.BetLimitsService = BetLimitsService;
exports.BetLimitsService = BetLimitsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(betting_config_1.BETTING_CONFIG)),
    __param(2, (0, common_1.Inject)(clock_1.CLOCK)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, Object, jurisdiction_service_1.JurisdictionService])
], BetLimitsService);
//# sourceMappingURL=bet-limits.service.js.map