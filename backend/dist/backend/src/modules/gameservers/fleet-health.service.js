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
var FleetHealthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FleetHealthService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../prisma/prisma.service");
const clock_1 = require("../../common/utils/clock");
const STALE_MS = 30_000;
let FleetHealthService = FleetHealthService_1 = class FleetHealthService {
    prisma;
    clock;
    logger = new common_1.Logger(FleetHealthService_1.name);
    constructor(prisma, clock) {
        this.prisma = prisma;
        this.clock = clock;
    }
    async sweep() {
        const now = this.clock.nowMs();
        const cutoff = new Date(now - STALE_MS);
        const dead = await this.prisma.gameServer.findMany({
            where: { status: { in: ['REGISTERED', 'RESERVED'] }, lastHeartbeatAt: { lt: cutoff } },
            select: { id: true, hostname: true },
        });
        if (dead.length === 0)
            return;
        for (const s of dead) {
            await this.prisma.gameServer.update({ where: { id: s.id }, data: { status: 'OFFLINE' } });
            const orphanCount = await this.prisma.match.updateMany({
                where: { serverId: s.id, status: { in: ['WAITING_FOR_PLAYERS', 'LOADING', 'IN_PROGRESS'] } },
                data: { status: 'INVALIDATED', invalidatedReason: 'SERVER_LOST', finishedAt: new Date(now) },
            });
            this.logger.warn(`Fleet health: server ${s.hostname} OFFLINE (stale heartbeat), ${orphanCount.count} match(es) invalidated`);
        }
    }
    async readyCount() {
        const now = this.clock.nowMs();
        return this.prisma.gameServer.count({
            where: { status: 'REGISTERED', lastHeartbeatAt: { gte: new Date(now - STALE_MS) } },
        });
    }
};
exports.FleetHealthService = FleetHealthService;
__decorate([
    (0, schedule_1.Interval)(10_000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FleetHealthService.prototype, "sweep", null);
exports.FleetHealthService = FleetHealthService = FleetHealthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(clock_1.CLOCK)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], FleetHealthService);
//# sourceMappingURL=fleet-health.service.js.map