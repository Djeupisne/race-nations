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
exports.BettingController = void 0;
const common_1 = require("@nestjs/common");
const api_contracts_1 = require("@race-nations/api-contracts");
const zod_validation_pipe_1 = require("../../common/pipes/zod-validation.pipe");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const ownership_guard_1 = require("../../common/guards/ownership.guard");
const rate_limit_guard_1 = require("../../common/guards/rate-limit.guard");
const betting_service_1 = require("./betting.service");
const bet_settlement_service_1 = require("./bet-settlement.service");
const bet_limits_service_1 = require("./bet-limits.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const createMarketPipe = new zod_validation_pipe_1.ZodValidationPipe(api_contracts_1.CreateMarketInputSchema);
const acceptPipe = new zod_validation_pipe_1.ZodValidationPipe(api_contracts_1.AcceptChallengeInputSchema);
const disputePipe = new zod_validation_pipe_1.ZodValidationPipe(api_contracts_1.OpenDisputeInputSchema);
let BettingController = class BettingController {
    betting;
    settlement;
    limits;
    prisma;
    constructor(betting, settlement, limits, prisma) {
        this.betting = betting;
        this.settlement = settlement;
        this.limits = limits;
        this.prisma = prisma;
    }
    async createMarket(user, body) {
        const player = await this.mustPlayer(user);
        return this.betting.createMarket({ creator: player, ...body });
    }
    joinMarket(id, user, _body) {
        return this.mustPlayer(user).then((player) => this.betting.joinMarket(id, player));
    }
    listMarkets(query) {
        return this.betting.listMarkets(query);
    }
    getMarket(id) {
        return this.betting.getMarket(id);
    }
    odds(id) {
        return this.betting.oddsOf(id);
    }
    myBets(user, status) {
        return this.mustPlayer(user).then((p) => this.betting.myBets(p.id, status));
    }
    async limitsUsage(user) {
        const p = await this.mustPlayer(user);
        return {
            soft: await this.limits.usage(p.id, 'SOFT'),
            hard: await this.limits.usage(p.id, 'HARD'),
            reputation: p.reputation,
            minReputationHard: 30,
        };
    }
    async cancel(id, user) {
        const player = await this.mustPlayer(user);
        return this.betting.cancelMarket(id, player);
    }
    async dispute(id, user, body) {
        const player = await this.mustPlayer(user);
        const involved = await this.prisma.bet.findUnique({ where: { marketId_playerId: { marketId: id, playerId: player.id } } });
        if (!involved && (await this.prisma.betMarket.findUnique({ where: { id }, select: { creatorId: true } }))?.creatorId !== player.id) {
            const { ForbiddenAdminError } = await Promise.resolve().then(() => __importStar(require('../../common/errors/domain-errors')));
            throw new ForbiddenAdminError({}, 'Only participants can open a dispute.');
        }
        await this.settlement.openDispute(id, body.reason);
        return { ok: true };
    }
    manualSettle(id, user, body) {
        return this.settlement.settleMarket({ marketId: id, winningSide: body.winningSide, push: body.push, settledById: user.userId });
    }
    async resolveDispute(id, body) {
        await this.settlement.resolveDispute(id, body.outcome);
        return { ok: true };
    }
    async mustPlayer(user) {
        const player = await this.prisma.player.findUnique({ where: { id: user.playerId } });
        if (!player) {
            const { NotFoundError } = await Promise.resolve().then(() => __importStar(require('../../common/errors/domain-errors')));
            throw new NotFoundError('Player', user.playerId);
        }
        return player;
    }
};
exports.BettingController = BettingController;
__decorate([
    (0, common_1.Post)('markets'),
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, rate_limit_guard_1.rateLimit)({ keyPrefix: 'bet:create', limit: 10, windowSeconds: 60 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(createMarketPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BettingController.prototype, "createMarket", null);
__decorate([
    (0, common_1.Post)('markets/:id/join'),
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, rate_limit_guard_1.rateLimit)({ keyPrefix: 'bet:join', limit: 20, windowSeconds: 60 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)(acceptPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], BettingController.prototype, "joinMarket", null);
__decorate([
    (0, common_1.Get)('markets'),
    __param(0, (0, common_1.Query)((0, zod_validation_pipe_1.zodQueryPipe)(api_contracts_1.ListMarketsQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BettingController.prototype, "listMarkets", null);
__decorate([
    (0, common_1.Get)('markets/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BettingController.prototype, "getMarket", null);
__decorate([
    (0, common_1.Get)('markets/:id/odds'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BettingController.prototype, "odds", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BettingController.prototype, "myBets", null);
__decorate([
    (0, common_1.Get)('limits'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BettingController.prototype, "limitsUsage", null);
__decorate([
    (0, common_1.Post)('markets/:id/cancel'),
    (0, common_1.UseGuards)(ownership_guard_1.OwnershipGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BettingController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)('markets/:id/dispute'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)(disputePipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], BettingController.prototype, "dispute", null);
__decorate([
    (0, common_1.Post)('markets/:id/settle'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], BettingController.prototype, "manualSettle", null);
__decorate([
    (0, common_1.Post)('markets/:id/dispute/resolve'),
    (0, roles_decorator_1.Roles)('MODERATOR', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BettingController.prototype, "resolveDispute", null);
exports.BettingController = BettingController = __decorate([
    (0, common_1.Controller)('v1/betting'),
    __metadata("design:paramtypes", [betting_service_1.BettingService,
        bet_settlement_service_1.BetSettlementService,
        bet_limits_service_1.BetLimitsService,
        prisma_service_1.PrismaService])
], BettingController);
//# sourceMappingURL=betting.controller.js.map