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
var MatchmakingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchmakingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const clock_1 = require("../../common/utils/clock");
const ticket_state_machine_1 = require("../../common/state-machines/ticket.state-machine");
const domain_errors_1 = require("../../common/errors/domain-errors");
const QUEUE_TTL_MS = {
    RANKED_1V1: 120_000,
    RANKED_FFA: 120_000,
    QUICK_RACE: 60_000,
    BATTLE_ROYALE: 120_000,
    TOURNAMENT: 300_000,
    CLAN_WARS: 180_000,
    PRACTICE: 60_000,
};
let MatchmakingService = MatchmakingService_1 = class MatchmakingService {
    prisma;
    clock;
    logger = new common_1.Logger(MatchmakingService_1.name);
    constructor(prisma, clock) {
        this.prisma = prisma;
        this.clock = clock;
    }
    async enqueue(playerId, mode, preferredTrackId) {
        const player = await this.prisma.player.findUnique({ where: { id: playerId }, select: { plPoints: true } });
        if (!player)
            throw new domain_errors_1.NotFoundError('Player', playerId);
        const active = await this.prisma.matchmakingTicket.findFirst({
            where: { playerId, mode: mode, status: { in: ['QUEUED', 'MATCHED'] } },
            select: { id: true },
        });
        if (active)
            throw new domain_errors_1.ValidationError({ field: 'mode', reason: `Already queued (ticket ${active.id}).` });
        const ttl = QUEUE_TTL_MS[mode] ?? 120_000;
        const now = this.clock.nowMs();
        const ticket = await this.prisma.matchmakingTicket.create({
            data: {
                playerId,
                mode: mode,
                status: 'QUEUED',
                plAtQueue: player.plPoints,
                requestedAt: new Date(now),
                expiresAt: new Date(now + ttl),
            },
        });
        void preferredTrackId;
        const queueDepth = await this.prisma.matchmakingTicket.count({ where: { mode: mode, status: 'QUEUED' } });
        const estimatedWaitMs = Math.min(ttl, Math.max(5_000, queueDepth * 3_000));
        this.logger.log(`Queued ticket=${ticket.id} player=${playerId} mode=${mode} pl=${player.plPoints}`);
        return { ticketId: ticket.id, estimatedWaitMs };
    }
    async ticket(ticketId, ownerId) {
        const t = await this.prisma.matchmakingTicket.findUnique({ where: { id: ticketId } });
        if (!t)
            throw new domain_errors_1.NotFoundError('MatchmakingTicket', ticketId);
        if (t.playerId !== ownerId)
            throw new domain_errors_1.NotFoundError('MatchmakingTicket', ticketId);
        let queuePosition = null;
        if (t.status === 'QUEUED') {
            queuePosition = await this.prisma.matchmakingTicket.count({
                where: { mode: t.mode, status: 'QUEUED', requestedAt: { lt: t.requestedAt } },
            });
        }
        return { ...t, queuePosition };
    }
    async cancel(ticketId, playerId, reason = 'PLAYER_CANCEL') {
        const t = await this.prisma.matchmakingTicket.findUnique({ where: { id: ticketId } });
        if (!t)
            throw new domain_errors_1.NotFoundError('MatchmakingTicket', ticketId);
        if (t.playerId !== playerId)
            throw new domain_errors_1.NotFoundError('MatchmakingTicket', ticketId);
        if (t.status === 'CANCELLED')
            return t;
        (0, ticket_state_machine_1.assertTicketTransition)(t.status, 'CANCELLED');
        return this.prisma.matchmakingTicket.update({
            where: { id: ticketId },
            data: { status: 'CANCELLED', cancelReason: reason },
        });
    }
    async myActiveTickets(playerId) {
        return this.prisma.matchmakingTicket.findMany({
            where: { playerId, status: { in: ['QUEUED', 'MATCHED', 'JOINED'] } },
            orderBy: { requestedAt: 'desc' },
        });
    }
    async queueStats() {
        const grouped = await this.prisma.matchmakingTicket.groupBy({
            by: ['mode'],
            where: { status: 'QUEUED' },
            _count: { _all: true },
        });
        return grouped.map((g) => ({ mode: g.mode, depth: g._count._all }));
    }
    findCandidates(plCenter, plWindow, excludeTicketId, mode, limit = 10) {
        return this.prisma.matchmakingTicket.findMany({
            where: {
                mode: mode,
                status: 'QUEUED',
                id: { not: excludeTicketId },
                plAtQueue: { gte: plCenter - plWindow, lte: plCenter + plWindow },
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date(this.clock.nowMs()) } }],
            },
            orderBy: { requestedAt: 'asc' },
            take: limit,
            select: { id: true, playerId: true, plAtQueue: true },
        });
    }
};
exports.MatchmakingService = MatchmakingService;
exports.MatchmakingService = MatchmakingService = MatchmakingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(clock_1.CLOCK)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], MatchmakingService);
//# sourceMappingURL=matchmaking.service.js.map