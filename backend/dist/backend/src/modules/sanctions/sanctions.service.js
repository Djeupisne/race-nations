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
exports.SanctionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const wallet_repository_1 = require("../wallet/wallet.repository");
const sanction_state_machine_1 = require("../../common/state-machines/sanction.state-machine");
const domain_errors_1 = require("../../common/errors/domain-errors");
const clock_1 = require("../../common/utils/clock");
const common_2 = require("@nestjs/common");
const SANCTION_MS = {
    WARN: null,
    CHAT_MUTE: 24 * 3_600_000,
    BET_RESTRICTION: 7 * 86_400_000,
    TEMP_BAN_7D: 7 * 86_400_000,
    PERM_BAN: null,
    REWARD_CLAWBACK: null,
};
let SanctionsService = class SanctionsService {
    prisma;
    wallet;
    clock;
    constructor(prisma, wallet, clock) {
        this.prisma = prisma;
        this.wallet = wallet;
        this.clock = clock;
    }
    async issue(params) {
        if (!params.reason || params.reason.trim().length < 5) {
            throw new domain_errors_1.ValidationError({ field: 'reason', reason: 'Sanction requires a documented reason.' });
        }
        const player = await this.prisma.player.findUnique({
            where: { id: params.playerId },
            select: { id: true, reputation: true },
        });
        if (!player)
            throw new domain_errors_1.NotFoundError('Player', params.playerId);
        if (params.type === 'TEMP_BAN_7D' && player.reputation >= 10) {
            throw new domain_errors_1.ValidationError({ field: 'type', reason: `TEMP_BAN_7D requires reputation < 10 (INV-21), got ${player.reputation}.` });
        }
        const nowMs = this.clock.nowMs();
        const duration = SANCTION_MS[params.type];
        const endsAt = duration ? new Date(nowMs + duration) : params.type === 'PERM_BAN' ? null : null;
        const sanction = await this.prisma.sanction.create({
            data: {
                playerId: params.playerId,
                type: params.type,
                status: 'ACTIVE',
                reason: params.reason,
                evidenceRef: params.evidenceRef,
                issuedById: params.issuedById,
                startsAt: new Date(nowMs),
                endsAt,
            },
        });
        return { sanctionId: sanction.id, endsAt };
    }
    async appeal(sanctionId, playerId, note) {
        const s = await this.prisma.sanction.findUnique({ where: { id: sanctionId } });
        if (!s || s.playerId !== playerId)
            throw new domain_errors_1.NotFoundError('Sanction', sanctionId);
        (0, sanction_state_machine_1.assertSanctionTransition)(s.status, 'APPEALED');
        if (!note || note.trim().length < 10) {
            throw new domain_errors_1.ValidationError({ field: 'note', reason: 'Appeal note must be at least 10 characters.' });
        }
        await this.prisma.sanction.update({ where: { id: sanctionId }, data: { status: 'APPEALED', appealNote: note } });
    }
    async decideAppeal(sanctionId, decision) {
        const s = await this.prisma.sanction.findUnique({ where: { id: sanctionId } });
        if (!s)
            throw new domain_errors_1.NotFoundError('Sanction', sanctionId);
        (0, sanction_state_machine_1.assertSanctionTransition)(s.status, decision);
        await this.prisma.sanction.update({
            where: { id: sanctionId },
            data: { status: decision, ...(decision === 'LIFTED' ? { liftedAt: new Date(this.clock.nowMs()), endsAt: new Date(this.clock.nowMs()) } : {}) },
        });
    }
    async lift(sanctionId) {
        const s = await this.prisma.sanction.findUnique({ where: { id: sanctionId } });
        if (!s)
            throw new domain_errors_1.NotFoundError('Sanction', sanctionId);
        (0, sanction_state_machine_1.assertSanctionTransition)(s.status, 'LIFTED');
        const now = new Date(this.clock.nowMs());
        await this.prisma.sanction.update({ where: { id: sanctionId }, data: { status: 'LIFTED', liftedAt: now, endsAt: now } });
    }
    async clawbackRewards(sanctionId, actorUserId) {
        const s = await this.prisma.sanction.findUnique({ where: { id: sanctionId } });
        if (!s || s.type !== 'REWARD_CLAWBACK')
            throw new domain_errors_1.NotFoundError('Sanction(REWARD_CLAWBACK)', sanctionId);
        void actorUserId;
        return this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({ where: { playerId: s.playerId } });
            if (!wallet)
                return { reversedCents: 0, reversedCredits: 0 };
            const toReverseHard = wallet.hardCents;
            const toReverseSoft = wallet.credits;
            let reversedCents = 0;
            let reversedCredits = 0;
            if (toReverseHard > 0) {
                await this.wallet.debit(tx, {
                    walletId: wallet.id,
                    column: 'hardCents',
                    amount: toReverseHard,
                    type: 'REVERSAL',
                    idempotencyKey: `clawback:${sanctionId}:hard`,
                    refType: 'SANCTION',
                    refId: sanctionId,
                });
                reversedCents = toReverseHard;
            }
            if (toReverseSoft > 0) {
                await this.wallet.debit(tx, {
                    walletId: wallet.id,
                    column: 'credits',
                    amount: toReverseSoft,
                    type: 'REVERSAL',
                    idempotencyKey: `clawback:${sanctionId}:soft`,
                    refType: 'SANCTION',
                    refId: sanctionId,
                });
                reversedCredits = toReverseSoft;
            }
            await tx.sanction.update({ where: { id: sanctionId }, data: { status: 'UPHELD' } });
            return { reversedCents, reversedCredits };
        });
    }
    async listForPlayer(playerId) {
        return this.prisma.sanction.findMany({
            where: { playerId },
            orderBy: { createdAt: 'desc' },
            select: { id: true, type: true, status: true, reason: true, startsAt: true, endsAt: true, createdAt: true },
        });
    }
    async hasActive(playerId, types) {
        const now = new Date(this.clock.nowMs());
        const count = await this.prisma.sanction.count({
            where: { playerId, type: { in: types }, status: 'ACTIVE', OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        });
        return count > 0;
    }
};
exports.SanctionsService = SanctionsService;
exports.SanctionsService = SanctionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_2.Inject)(clock_1.CLOCK)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_repository_1.WalletRepository, Object])
], SanctionsService);
//# sourceMappingURL=sanctions.service.js.map