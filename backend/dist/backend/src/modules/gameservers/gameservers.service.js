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
var GameserversService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameserversService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const clock_1 = require("../../common/utils/clock");
const game_server_state_machine_1 = require("../../common/state-machines/game-server.state-machine");
const domain_errors_1 = require("../../common/errors/domain-errors");
const HEARTBEAT_STALE_MS = 30_000;
let GameserversService = GameserversService_1 = class GameserversService {
    prisma;
    clock;
    logger = new common_1.Logger(GameserversService_1.name);
    constructor(prisma, clock) {
        this.prisma = prisma;
        this.clock = clock;
    }
    async register(input) {
        const existing = await this.prisma.gameServer.findUnique({ where: { hostname: input.hostname } });
        if (existing) {
            return this.prisma.gameServer.update({
                where: { id: existing.id },
                data: { wsUrl: input.wsUrl, region: input.region, status: 'REGISTERED', lastHeartbeatAt: new Date(this.clock.nowMs()) },
            });
        }
        return this.prisma.gameServer.create({
            data: {
                hostname: input.hostname,
                wsUrl: input.wsUrl,
                region: input.region,
                capacity: input.capacity ?? 8,
                status: 'REGISTERED',
                sharedSecretRef: `kms:gameserver/${input.hostname}`,
                lastHeartbeatAt: new Date(this.clock.nowMs()),
            },
        });
    }
    async allocate(region) {
        const candidates = await this.prisma.gameServer.findMany({
            where: { region, status: 'REGISTERED', activeMatches: { lt: this.prisma.gameServer.fields ? undefined : undefined } },
            orderBy: [{ activeMatches: 'asc' }, { lastHeartbeatAt: 'desc' }],
            take: 5,
            select: { id: true, wsUrl: true, capacity: true, activeMatches: true },
        });
        for (const c of candidates) {
            if (c.activeMatches >= c.capacity)
                continue;
            const updated = await this.prisma.gameServer.updateMany({
                where: { id: c.id, status: 'REGISTERED', activeMatches: { lt: c.capacity } },
                data: { activeMatches: { increment: 1 } },
            });
            if (updated.count === 1) {
                return { serverId: c.id, wsUrl: c.wsUrl };
            }
        }
        throw new domain_errors_1.ServerUnavailableError(`No game server available in region ${region}.`);
    }
    async release(serverId) {
        const server = await this.prisma.gameServer.findUnique({ where: { id: serverId } });
        if (!server)
            return;
        await this.prisma.gameServer.update({
            where: { id: serverId },
            data: { activeMatches: Math.max(0, server.activeMatches - 1) },
        });
    }
    async heartbeat(serverId, activeMatches) {
        const server = await this.prisma.gameServer.findUnique({ where: { id: serverId } });
        if (!server)
            throw new domain_errors_1.NotFoundError('GameServer', serverId);
        await this.prisma.gameServer.update({
            where: { id: serverId },
            data: { lastHeartbeatAt: new Date(this.clock.nowMs()), activeMatches: Math.max(0, Math.floor(activeMatches)) },
        });
        return { command: server.status === 'DRAINING' ? 'drain' : 'continue' };
    }
    async drain(serverId) {
        const server = await this.prisma.gameServer.findUnique({ where: { id: serverId } });
        if (!server)
            throw new domain_errors_1.NotFoundError('GameServer', serverId);
        (0, game_server_state_machine_1.assertGameServerTransition)(server.status, 'DRAINING');
        await this.prisma.gameServer.update({
            where: { id: serverId },
            data: { status: 'DRAINING', drainedAt: new Date(this.clock.nowMs()) },
        });
    }
    async retire(serverId) {
        const server = await this.prisma.gameServer.findUnique({ where: { id: serverId } });
        if (!server)
            throw new domain_errors_1.NotFoundError('GameServer', serverId);
        (0, game_server_state_machine_1.assertGameServerTransition)(server.status, 'OFFLINE');
        await this.prisma.gameServer.update({ where: { id: serverId }, data: { status: 'OFFLINE' } });
    }
    async fleet() {
        const now = this.clock.nowMs();
        const servers = await this.prisma.gameServer.findMany({ orderBy: [{ region: 'asc' }, { hostname: 'asc' }] });
        return servers.map((s) => ({
            id: s.id,
            hostname: s.hostname,
            region: s.region,
            status: s.status,
            activeMatches: s.activeMatches,
            capacity: s.capacity,
            stale: !s.lastHeartbeatAt || now - s.lastHeartbeatAt.getTime() > HEARTBEAT_STALE_MS,
        }));
    }
};
exports.GameserversService = GameserversService;
exports.GameserversService = GameserversService = GameserversService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(clock_1.CLOCK)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], GameserversService);
//# sourceMappingURL=gameservers.service.js.map