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
exports.PlayersService = void 0;
const common_1 = require("@nestjs/common");
const api_contracts_1 = require("@race-nations/api-contracts");
const prisma_service_1 = require("../../prisma/prisma.service");
const clock_1 = require("../../common/utils/clock");
const domain_errors_1 = require("../../common/errors/domain-errors");
let PlayersService = class PlayersService {
    prisma;
    clock;
    constructor(prisma, clock) {
        this.prisma = prisma;
        this.clock = clock;
    }
    async getByPlayerId(playerId) {
        const player = await this.prisma.player.findUnique({
            where: { id: playerId },
            include: { user: { select: { role: true } }, wallet: true },
        });
        if (!player)
            throw new domain_errors_1.NotFoundError('Player', playerId);
        return player;
    }
    async getProfileByUserId(userId) {
        const player = await this.prisma.player.findUnique({
            where: { userId },
            include: { user: { select: { role: true } } },
        });
        if (!player)
            throw new domain_errors_1.NotFoundError('Player', userId);
        return this.toProfile(player);
    }
    async getPublicProfile(playerId) {
        const p = await this.prisma.player.findUnique({
            where: { id: playerId },
            select: { id: true, username: true, nationality: true, level: true, plPoints: true, division: true },
        });
        if (!p)
            throw new domain_errors_1.NotFoundError('Player', playerId);
        return {
            id: p.id,
            username: p.username,
            nationality: p.nationality,
            level: p.level,
            plPoints: p.plPoints,
            division: p.division,
        };
    }
    async updateProfile(userId, input) {
        const player = await this.prisma.player.findUnique({ where: { userId }, include: { user: true } });
        if (!player)
            throw new domain_errors_1.NotFoundError('Player', userId);
        const data = {};
        if (input.username !== undefined) {
            const clash = await this.prisma.player.findUnique({ where: { username: input.username }, select: { id: true } });
            if (clash && clash.id !== player.id)
                throw new domain_errors_1.ValidationError({ field: 'username', reason: 'Already taken.' });
            data.username = input.username;
        }
        if (input.preferredLanguage !== undefined)
            data.preferredLanguage = input.preferredLanguage;
        if (input.chatGlobalEnabled !== undefined)
            data.chatGlobalEnabled = input.chatGlobalEnabled;
        if (input.marketingOptIn !== undefined)
            data.marketingOptIn = input.marketingOptIn;
        const updated = await this.prisma.player.update({ where: { id: player.id }, data, include: { user: true } });
        return this.toProfile(updated);
    }
    async setNationality(userId, input) {
        const player = await this.prisma.player.findUnique({ where: { userId }, include: { user: true } });
        if (!player)
            throw new domain_errors_1.NotFoundError('Player', userId);
        if (player.nationalityLocked) {
            throw new domain_errors_1.ValidationError({
                field: 'nationality',
                reason: 'Nationality is locked after the first ranked race (INV-31).',
            });
        }
        const updated = await this.prisma.player.update({
            where: { id: player.id },
            data: { nationality: input.nationality },
            include: { user: true },
        });
        return this.toProfile(updated);
    }
    async stats(playerId) {
        const entries = await this.prisma.matchPlayer.findMany({
            where: { playerId, match: { status: 'FINISHED_VALIDATED' } },
            select: { outcome: true, driftPoints: true, position: true },
        });
        let victories = 0;
        let defeats = 0;
        let draws = 0;
        let abandons = 0;
        let totalDrift = 0;
        for (const e of entries) {
            totalDrift += e.driftPoints;
            switch (e.outcome) {
                case 'VICTORY':
                    victories++;
                    break;
                case 'DEFEAT':
                    defeats++;
                    break;
                case 'DRAW':
                    draws++;
                    break;
                case 'ABANDON':
                    abandons++;
                    break;
                default: break;
            }
        }
        const betsWon = await this.prisma.bet.count({ where: { playerId, status: 'WON' } });
        const betsLost = await this.prisma.bet.count({ where: { playerId, status: 'LOST' } });
        const recordsHeld = await this.prisma.matchPlayer.count({
            where: { playerId, match: { status: 'FINISHED_VALIDATED' }, position: 1 },
        });
        return {
            racesPlayed: entries.length,
            victories,
            defeats,
            draws,
            abandons,
            winStreakCurrent: 0,
            winStreakBest: 0,
            totalDriftPoints: totalDrift,
            perfectRaces: 0,
            recordsHeld,
            betsWon,
            betsLost,
        };
    }
    async leaderboard(query) {
        const where = {};
        switch (query.scope) {
            case 'country':
                if (!query.filter)
                    throw new domain_errors_1.ValidationError({ field: 'filter', reason: 'Required for scope=country.' });
                where.nationality = query.filter.toUpperCase();
                break;
            case 'division':
                if (!query.filter)
                    throw new domain_errors_1.ValidationError({ field: 'filter', reason: 'Required for scope=division.' });
                where.division = query.filter.toUpperCase();
                break;
            case 'clan':
                where.clanMembership = query.filter ? { clanId: query.filter } : { isNot: null };
                break;
            case 'vehicle':
                where.ownedVehicles = { some: { vehicleId: query.filter ?? '' } };
                break;
            case 'season':
            case 'world':
            default:
                break;
        }
        const cursor = query.cursor ? decodeCursor(query.cursor) : undefined;
        const rows = await this.prisma.player.findMany({
            where,
            orderBy: [{ plPoints: 'desc' }, { id: 'asc' }],
            take: query.limit + 1,
            ...(cursor ? { cursor: { id: cursor.id }, skip: 1 } : {}),
            select: { id: true, username: true, nationality: true, division: true, plPoints: true },
        });
        const items = rows.slice(0, query.limit).map((r, i) => ({
            rank: i + 1 + (cursor?.offset ?? 0),
            playerId: r.id,
            username: r.username,
            nationality: r.nationality,
            division: r.division,
            plPoints: r.plPoints,
            metric: r.plPoints,
        }));
        const hasMore = rows.length > query.limit;
        const last = items[items.length - 1];
        return {
            items,
            nextCursor: hasMore && last ? encodeCursor(last.playerId, (cursor?.offset ?? 0) + items.length) : null,
        };
    }
    async lockNationalityIfNeeded(playerId) {
        await this.prisma.player.updateMany({
            where: { id: playerId, nationalityLocked: false },
            data: { nationalityLocked: true },
        });
    }
    async applyPlDelta(playerId, delta) {
        const player = await this.prisma.player.findUnique({ where: { id: playerId }, select: { plPoints: true } });
        if (!player)
            throw new domain_errors_1.NotFoundError('Player', playerId);
        const plPoints = Math.max(0, player.plPoints + delta);
        const division = (0, api_contracts_1.divisionFromPl)(plPoints);
        await this.prisma.player.update({ where: { id: playerId }, data: { plPoints, division } });
        return { plPoints, division };
    }
    toProfile(p) {
        return {
            id: p.id,
            username: p.username,
            countryCode: p.countryCode,
            nationality: p.nationality,
            nationalityLocked: p.nationalityLocked ?? false,
            role: p.user.role,
            level: p.level,
            xp: p.xp,
            plPoints: p.plPoints,
            division: p.division,
            reputation: p.reputation,
            ageVerified: p.ageVerifiedAt !== null,
            createdAt: p.createdAt.toISOString(),
        };
    }
};
exports.PlayersService = PlayersService;
exports.PlayersService = PlayersService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(clock_1.CLOCK)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], PlayersService);
function encodeCursor(id, offset) {
    return `${Buffer.from(id, 'utf8').toString('base64url')}:${offset}`;
}
function decodeCursor(raw) {
    const [b64, off] = raw.split(':');
    if (!b64)
        return undefined;
    try {
        return { id: Buffer.from(b64, 'base64url').toString('utf8'), offset: Number.parseInt(off ?? '0', 10) || 0 };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=players.service.js.map