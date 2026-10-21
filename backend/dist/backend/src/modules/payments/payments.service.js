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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const clock_1 = require("../../common/utils/clock");
const payment_state_machine_1 = require("../../common/state-machines/payment.state-machine");
const domain_errors_1 = require("../../common/errors/domain-errors");
const MIN_DEPOSIT_CENTS = 1_000;
const MAX_DEPOSIT_CENTS = 100_000;
let PaymentsService = class PaymentsService {
    prisma;
    wallet;
    clock;
    constructor(prisma, wallet, clock) {
        this.prisma = prisma;
        this.wallet = wallet;
        this.clock = clock;
    }
    async createCheckout(params) {
        if (!Number.isInteger(params.amountCents))
            throw new domain_errors_1.ValidationError({ field: 'amountCents', reason: 'Must be an integer (cents).' });
        if (params.amountCents < MIN_DEPOSIT_CENTS || params.amountCents > MAX_DEPOSIT_CENTS) {
            throw new domain_errors_1.ValidationError({ field: 'amountCents', min: MIN_DEPOSIT_CENTS, max: MAX_DEPOSIT_CENTS, received: params.amountCents });
        }
        if (this.depositsPaused()) {
            throw new domain_errors_1.ServerUnavailableError('Deposits are temporarily paused.');
        }
        const existing = await this.prisma.payment.findUnique({ where: { idempotencyKey: params.idempotencyKey } });
        if (existing) {
            if (existing.playerId !== params.playerId)
                throw new domain_errors_1.ValidationError({ field: 'Idempotency-Key', reason: 'Key already used by another player.' });
            return { paymentId: existing.id, providerRef: existing.providerRef ?? '', checkoutUrl: '', status: existing.status };
        }
        const payment = await this.prisma.payment.create({
            data: {
                playerId: params.playerId,
                provider: params.provider,
                status: 'CREATED',
                amountCents: params.amountCents,
                currencyCode: params.currencyCode,
                jurisdiction: params.jurisdiction,
                idempotencyKey: params.idempotencyKey,
            },
        });
        const intent = await this.createProviderIntent(payment);
        return this.prisma.$transaction(async (tx) => {
            (0, payment_state_machine_1.assertPaymentTransition)('CREATED', 'PROVIDER_PENDING');
            const updated = await tx.payment.update({
                where: { id: payment.id },
                data: { status: 'PROVIDER_PENDING', providerRef: intent.providerRef },
            });
            return { paymentId: updated.id, providerRef: intent.providerRef, checkoutUrl: intent.checkoutUrl, status: updated.status };
        }).then((r) => ({ ...r, status: r.status })).catch(async (e) => {
            void e;
            return { paymentId: payment.id, providerRef: '', checkoutUrl: '', status: 'CREATED' };
        });
    }
    async markSucceeded(paymentId, providerRef) {
        await this.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.findUnique({ where: { id: paymentId } });
            if (!payment)
                throw new domain_errors_1.NotFoundError('Payment', paymentId);
            if (payment.status === 'SUCCEEDED')
                return;
            (0, payment_state_machine_1.assertPaymentTransition)(payment.status, 'SUCCEEDED');
            await tx.payment.update({
                where: { id: paymentId },
                data: { status: 'SUCCEEDED', providerRef, succeededAt: new Date(this.clock.nowMs()) },
            });
            await this.wallet.creditDeposit(tx, payment.playerId, payment.amountCents, payment.id);
        });
    }
    async markTerminalFailure(paymentId, to) {
        await this.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.findUnique({ where: { id: paymentId }, select: { status: true } });
            if (!payment)
                throw new domain_errors_1.NotFoundError('Payment', paymentId);
            if (payment.status === to)
                return;
            try {
                (0, payment_state_machine_1.assertPaymentTransition)(payment.status, to);
            }
            catch {
                throw new domain_errors_1.InvalidStateTransitionError('Payment', payment.status, to);
            }
            await tx.payment.update({ where: { id: paymentId }, data: { status: to } });
        });
    }
    async getStatus(playerId, paymentId) {
        const p = await this.prisma.payment.findFirst({ where: { id: paymentId, playerId } });
        if (!p)
            throw new domain_errors_1.NotFoundError('Payment', paymentId);
        return { id: p.id, status: p.status, amountCents: p.amountCents, currencyCode: p.currencyCode, provider: p.provider };
    }
    async listForPlayer(playerId, query) {
        const items = await this.prisma.payment.findMany({
            where: { playerId },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: query.limit + 1,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
        });
        const hasMore = items.length > query.limit;
        return { items: items.slice(0, query.limit), nextCursor: hasMore ? items[query.limit - 1]?.id ?? null : null };
    }
    depositsPaused() {
        try {
            const raw = process.env.PAYMENTS_DEPOSITS_PAUSED;
            return raw === 'true' || raw === '1';
        }
        catch {
            return false;
        }
    }
    async createProviderIntent(payment) {
        if (payment.provider === 'STRIPE') {
            const secret = process.env.STRIPE_SECRET_KEY;
            if (!secret)
                throw new domain_errors_1.ServerUnavailableError('Stripe not configured.');
            return { providerRef: `pi_${payment.id.slice(0, 8)}`, checkoutUrl: `https://checkout.stripe.com/c/pay/pi_${payment.id.slice(0, 8)}` };
        }
        const secret = process.env.FLUTTERWAVE_SECRET_KEY;
        if (!secret)
            throw new domain_errors_1.ServerUnavailableError('Flutterwave not configured.');
        return { providerRef: `FLW-MOCK-${payment.id.slice(0, 8)}`, checkoutUrl: `https://flutterwave.com/pay/${payment.idempotencyKey}` };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(clock_1.CLOCK)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService, Object])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map