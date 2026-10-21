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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const audit_service_1 = require("../audit/audit.service");
const bet_settlement_service_1 = require("../betting/bet-settlement.service");
const gameservers_service_1 = require("../gameservers/gameservers.service");
const sanctions_service_1 = require("../sanctions/sanctions.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const domain_errors_1 = require("../../common/errors/domain-errors");
let AdminService = class AdminService {
    audit;
    settlements;
    gameservers;
    sanctions;
    prisma;
    constructor(audit, settlements, gameservers, sanctions, prisma) {
        this.audit = audit;
        this.settlements = settlements;
        this.gameservers = gameservers;
        this.sanctions = sanctions;
        this.prisma = prisma;
    }
    rid(actor) {
        return actor.requestId ?? (0, node_crypto_1.randomUUID)();
    }
    async manualSettleMarket(actor, params) {
        if (!params.reason || params.reason.trim().length < 10) {
            throw new domain_errors_1.ValidationError({ field: 'reason', reason: 'Manual settlement requires a documented reason.' });
        }
        await this.audit.record({
            actorUserId: actor.userId,
            action: 'BET_MANUAL_SETTLE',
            targetType: 'BetMarket',
            targetId: params.marketId,
            metadata: { winningSide: params.winningSide ?? null, push: params.push ?? false, reason: params.reason },
            requestId: this.rid(actor),
        });
        return this.settlements.settleMarket({
            marketId: params.marketId,
            winningSide: params.winningSide,
            push: params.push,
            settledById: actor.userId,
        });
    }
    async issueSanction(actor, params) {
        const result = await this.sanctions.issue({ ...params, issuedById: actor.userId });
        await this.audit.record({
            actorUserId: actor.userId,
            action: 'SANCTION_ISSUE',
            targetType: 'Sanction',
            targetId: result.sanctionId,
            metadata: { playerId: params.playerId, type: params.type, reason: params.reason },
            requestId: this.rid(actor),
        });
        return result;
    }
    async drainServer(actor, serverId) {
        await this.audit.record({
            actorUserId: actor.userId,
            action: 'SERVER_DRAIN',
            targetType: 'GameServer',
            targetId: serverId,
            requestId: this.rid(actor),
        });
        return this.gameservers.drain(serverId);
    }
    async openDispute(actor, marketId, reason) {
        await this.audit.record({
            actorUserId: actor.userId,
            action: 'BET_DISPUTE_OPEN',
            targetType: 'BetMarket',
            targetId: marketId,
            metadata: { reason },
            requestId: this.rid(actor),
        });
        return this.settlements.openDispute(marketId, reason);
    }
    async resolveDispute(actor, marketId, outcome, note) {
        await this.audit.record({
            actorUserId: actor.userId,
            action: 'BET_DISPUTE_RESOLVE',
            targetType: 'BetMarket',
            targetId: marketId,
            metadata: { outcome, note },
            requestId: this.rid(actor),
        });
        return this.settlements.resolveDispute(marketId, outcome);
    }
    async dashboard() {
        const [fleet, disputed, settling] = await Promise.all([
            this.gameservers.fleet(),
            this.prisma.betMarket.count({ where: { status: 'DISPUTED' } }),
            this.prisma.betMarket.count({ where: { status: 'SETTLING' } }),
        ]);
        return { fleet, disputedMarkets: disputed, settlingMarkets: settling };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService,
        bet_settlement_service_1.BetSettlementService,
        gameservers_service_1.GameserversService,
        sanctions_service_1.SanctionsService,
        prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map