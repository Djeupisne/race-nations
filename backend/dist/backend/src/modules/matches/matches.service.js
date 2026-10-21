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
var MatchesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const clock_1 = require("../../common/utils/clock");
const match_state_machine_1 = require("../../common/state-machines/match.state-machine");
const domain_errors_1 = require("../../common/errors/domain-errors");
let MatchesService = MatchesService_1 = class MatchesService {
    prisma;
    clock;
    logger = new common_1.Logger(MatchesService_1.name);
    constructor(prisma, clock) {
        this.prisma = prisma;
        this.clock = clock;
    }
    async getMatch(matchId) {
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
            include: { players: { include: { player: { select: { id: true, username: true, nationality: true, plPoints: true } } } } },
        });
        if (!match)
            throw new domain_errors_1.NotFoundError('Match', matchId);
        return match;
    }
    async historyForPlayer(playerId, query) {
        const where = {};
        if (query.cursor)
            where.createdAt = { lt: new Date(query.cursor) };
        const rows = await this.prisma.match.findMany({
            where: { ...where, players: { some: { playerId } } },
            orderBy: [{ createdAt: 'desc' }],
            take: query.limit + 1,
            include: { players: true },
        });
        const hasMore = rows.length > query.limit;
        return { items: rows.slice(0, query.limit), nextCursor: hasMore ? rows[query.limit - 1].createdAt.toISOString() : null };
    }
    async join(matchId, playerId) {
        return this.prisma.$transaction(async (tx) => {
            const match = await tx.match.findUnique({ where: { id: matchId }, include: { players: true } });
            if (!match)
                throw new domain_errors_1.NotFoundError('Match', matchId);
            if (match.status !== 'WAITING_FOR_PLAYERS') {
                throw new domain_errors_1.ValidationError({ field: 'status', reason: `Match is ${match.status}; joining requires WAITING_FOR_PLAYERS.` });
            }
            if (!match.players.some((p) => p.playerId === playerId)) {
                throw new domain_errors_1.ValidationError({ field: 'playerId', reason: 'Not invited to this match.' });
            }
            const allJoined = match.players.length >= 2;
            if (allJoined && match.status === 'WAITING_FOR_PLAYERS') {
                (0, match_state_machine_1.assertMatchTransition)(match.status, 'LOADING');
                return tx.match.update({ where: { id: matchId }, data: { status: 'LOADING' } });
            }
            return match;
        });
    }
    async updateStatusFromServer(matchId, to) {
        const match = await this.prisma.match.findUnique({ where: { id: matchId } });
        if (!match)
            throw new domain_errors_1.NotFoundError('Match', matchId);
        if (match.status === to)
            return match;
        (0, match_state_machine_1.assertMatchTransition)(match.status, to);
        const data = { status: to };
        if (to === 'IN_PROGRESS')
            data.startedAt = new Date(this.clock.nowMs());
        if (to === 'FINISHED')
            data.finishedAt = new Date(this.clock.nowMs());
        this.logger.log(`Match ${matchId}: ${match.status} -> ${to}`);
        return this.prisma.match.update({ where: { id: matchId }, data });
    }
    async markValidated(matchId, rows) {
        return this.prisma.$transaction(async (tx) => {
            const match = await tx.match.findUniqueOrThrow({ where: { id: matchId } });
            if (match.status === 'FINISHED_VALIDATED')
                return match;
            (0, match_state_machine_1.assertMatchTransition)(match.status, 'FINISHED_VALIDATED');
            for (const r of rows) {
                await tx.matchPlayer.update({
                    where: { matchId_playerId: { matchId, playerId: r.playerId } },
                    data: { position: r.position, finishMs: r.finishMs, bestLapMs: r.bestLapMs, driftPoints: r.driftPoints ?? 0 },
                });
            }
            return tx.match.update({
                where: { id: matchId },
                data: { status: 'FINISHED_VALIDATED', validatedAt: new Date(this.clock.nowMs()) },
            });
        });
    }
    async invalidate(matchId, reason) {
        const match = await this.prisma.match.findUnique({ where: { id: matchId } });
        if (!match)
            throw new domain_errors_1.NotFoundError('Match', matchId);
        if (match.status === 'INVALIDATED')
            return match;
        (0, match_state_machine_1.assertMatchTransition)(match.status, 'INVALIDATED');
        this.logger.warn(`Match ${matchId} INVALIDATED: ${reason}`);
        return this.prisma.match.update({
            where: { id: matchId },
            data: { status: 'INVALIDATED', invalidatedReason: reason, finishedAt: match.finishedAt ?? new Date(this.clock.nowMs()) },
        });
    }
    async releaseServer(serverId) {
        await this.prisma.gameServer.updateMany({
            where: { id: serverId, activeMatches: { gt: 0 } },
            data: { activeMatches: { decrement: 1 } },
        });
        await this.prisma.gameServer.updateMany({
            where: { id: serverId, status: 'RESERVED', activeMatches: 0 },
            data: { status: 'REGISTERED' },
        });
    }
};
exports.MatchesService = MatchesService;
exports.MatchesService = MatchesService = MatchesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(clock_1.CLOCK)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], MatchesService);
//# sourceMappingURL=matches.service.js.map