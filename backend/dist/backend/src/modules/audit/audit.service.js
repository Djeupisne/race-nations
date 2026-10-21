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
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuditService = AuditService_1 = class AuditService {
    prisma;
    logger = new common_1.Logger(AuditService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(event) {
        const row = await this.prisma.adminAuditLog.create({
            data: {
                actorId: event.actorUserId,
                action: event.action,
                targetType: event.targetType,
                targetId: event.targetId,
                metadata: (event.metadata ?? undefined),
                requestId: event.requestId,
            },
            select: { id: true },
        });
        this.logger.log(`AUDIT actor=${event.actorUserId} action=${event.action} target=${event.targetType}/${event.targetId} req=${event.requestId}`);
        return { auditId: row.id };
    }
    async search(params) {
        const take = Math.min(params.limit ?? 100, 500);
        return this.prisma.adminAuditLog.findMany({
            where: {
                ...(params.actorUserId ? { actorId: params.actorUserId } : {}),
                ...(params.action ? { action: params.action } : {}),
                ...(params.targetType ? { targetType: params.targetType } : {}),
                ...(params.targetId ? { targetId: params.targetId } : {}),
                ...(params.from || params.to
                    ? { createdAt: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) } }
                    : {}),
            },
            orderBy: { createdAt: 'desc' },
            take,
        });
    }
    async forMarket(marketId) {
        return this.prisma.adminAuditLog.findMany({
            where: { targetType: 'BetMarket', targetId: marketId },
            orderBy: { createdAt: 'asc' },
        });
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map