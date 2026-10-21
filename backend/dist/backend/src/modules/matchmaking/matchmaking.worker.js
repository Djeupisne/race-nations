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
var MatchmakingWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchmakingWorker = void 0;
exports.computePlWindow = computePlWindow;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const gameservers_service_1 = require("../gameservers/gameservers.service");
const betting_config_1 = require("../../config/betting.config");
const clock_1 = require("../../common/utils/clock");
const PL_WINDOW_STEPS = [
    { afterMs: 0, window: 200 },
    { afterMs: 20_000, window: 350 },
    { afterMs: 40_000, window: 500 },
];
const SEAT_COUNT = {
    RANKED_1V1: 2,
    RANKED_FFA: 8,
    QUICK_RACE: 6,
    BATTLE_ROYALE: 12,
    TOURNAMENT: 8,
    CLAN_WARS: 8,
    PRACTICE: 4,
};
const TRACKS = ['lome', 'accra', 'lagos', 'dakar', 'paris', 'tokyo'];
function computePlWindow(waitMs) {
    let window = PL_WINDOW_STEPS[0].window;
    for (const step of PL_WINDOW_STEPS)
        if (waitMs >= step.afterMs)
            window = step.window;
    return window;
}
let MatchmakingWorker = MatchmakingWorker_1 = class MatchmakingWorker {
    prisma;
    gameservers;
    clock;
    logger = new common_1.Logger(MatchmakingWorker_1.name);
    timer;
    running = false;
    config = (0, betting_config_1.loadBettingConfig)();
    constructor(prisma, gameservers, clock) {
        this.prisma = prisma;
        this.gameservers = gameservers;
        this.clock = clock;
    }
    onModuleInit() {
        this.timer = setInterval(() => void this.tick().catch((err) => this.logger.error(err)), 500);
        this.timer.unref?.();
    }
    onModuleDestroy() {
        if (this.timer)
            clearInterval(this.timer);
    }
    async tick() {
        if (this.running)
            return;
        this.running = true;
        try {
            await this.expireStaleTickets();
            if (this.config.flags().matchmakingPaused)
                return;
            for (const mode of Object.keys(SEAT_COUNT)) {
                await this.pairMode(mode);
            }
        }
        finally {
            this.running = false;
        }
    }
    async expireStaleTickets() {
        const now = new Date(this.clock.nowMs());
        const stale = await this.prisma.matchmakingTicket.findMany({
            where: { status: 'QUEUED', expiresAt: { lte: now } },
            select: { id: true },
            take: 200,
        });
        for (const t of stale) {
            await this.prisma.matchmakingTicket.updateMany({
                where: { id: t.id, status: 'QUEUED' },
                data: { status: 'EXPIRED' },
            });
        }
        if (stale.length > 0)
            this.logger.debug(`Expired ${stale.length} stale tickets`);
    }
    async pairMode(mode) {
        const seats = SEAT_COUNT[mode];
        const tickets = await this.prisma.matchmakingTicket.findMany({
            where: { mode: mode, status: 'QUEUED' },
            orderBy: { requestedAt: 'asc' },
            take: 64,
        });
        if (tickets.length < 2 && seats === 2)
            return;
        if (tickets.length === 0)
            return;
        const nowMs = this.clock.nowMs();
        const group = [];
        for (const candidate of tickets) {
            if (group.length === 0) {
                group.push(candidate);
                continue;
            }
            const anchor = group[0];
            const waitMs = nowMs - anchor.requestedAt.getTime();
            const window = computePlWindow(waitMs);
            if (Math.abs(candidate.plAtQueue - anchor.plAtQueue) <= window)
                group.push(candidate);
            if (group.length >= seats)
                break;
        }
        if (group.length < (seats === 2 ? 2 : 2))
            return;
        const trackId = TRACKS[(anchor_hash(group.map((g) => g.id))) % TRACKS.length];
        await this.createMatchAndAssign(mode, trackId, group);
    }
    async createMatchAndAssign(mode, trackId, group) {
        const now = new Date(this.clock.nowMs());
        const match = await this.prisma.$transaction(async (tx) => {
            const created = await tx.match.create({
                data: {
                    status: 'WAITING_FOR_PLAYERS',
                    mode: mode,
                    trackId,
                    players: { create: group.map((g) => ({ playerId: g.playerId })) },
                },
            });
            for (const g of group) {
                const updated = await tx.matchmakingTicket.updateMany({
                    where: { id: g.id, status: 'QUEUED' },
                    data: { status: 'MATCHED', matchId: created.id, matchedAt: now },
                });
                if (updated.count !== 1) {
                    throw new MatchAssignmentRaceError();
                }
            }
            return created;
        }).catch((err) => {
            if (err instanceof MatchAssignmentRaceError) {
                this.logger.warn(`Pairing race on mode=${mode}, retry next tick`);
                return null;
            }
            throw err;
        });
        if (!match)
            return;
        try {
            await this.gameservers.allocate(match.id);
            await this.prisma.match.update({ where: { id: match.id }, data: { status: 'LOADING' } });
            this.logger.log(`Match ${match.id} created mode=${mode} players=${group.length}`);
        }
        catch (err) {
            this.logger.warn(`No server available for match ${match.id}: ${err.message}`);
        }
    }
};
exports.MatchmakingWorker = MatchmakingWorker;
exports.MatchmakingWorker = MatchmakingWorker = MatchmakingWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(clock_1.CLOCK)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        gameservers_service_1.GameserversService, Object])
], MatchmakingWorker);
class MatchAssignmentRaceError extends Error {
}
function anchor_hash(ids) {
    let h = 0;
    for (const id of ids)
        for (let i = 0; i < id.length; i++)
            h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return h;
}
//# sourceMappingURL=matchmaking.worker.js.map