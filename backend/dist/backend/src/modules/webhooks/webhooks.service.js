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
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const payments_service_1 = require("../payments/payments.service");
const verifier_registry_1 = require("./verifiers/verifier.registry");
const safe_json_1 = require("../../common/utils/safe-json");
const domain_errors_1 = require("../../common/errors/domain-errors");
let WebhooksService = WebhooksService_1 = class WebhooksService {
    prisma;
    payments;
    registry;
    logger = new common_1.Logger(WebhooksService_1.name);
    constructor(prisma, payments, registry) {
        this.prisma = prisma;
        this.payments = payments;
        this.registry = registry;
    }
    async ingest(path, req) {
        const verifier = this.registry.resolve(path);
        if (!verifier)
            throw new domain_errors_1.NotFoundError('WebhookEndpoint', path);
        const raw = req.rawBody;
        if (raw && raw.byteLength > safe_json_1.MAX_PAYLOAD_BYTES) {
            return { accepted: false, duplicate: false, eventId: '', reason: 'PAYLOAD_TOO_LARGE' };
        }
        if (req.body === undefined || req.body === null) {
            void (0, safe_json_1.safeJsonParse)(raw?.toString('utf8') ?? '');
        }
        const verdict = await verifier.verify(req);
        const externalId = verdict.externalId ?? `noid-${Date.now()}`;
        const idemKey = verifier_registry_1.VerifierRegistry.idempotencyKey(verifier.provider, externalId);
        let event = await this.prisma.webhookEvent.findUnique({ where: { idempotencyKey: idemKey } });
        let duplicate = true;
        if (!event) {
            try {
                event = await this.prisma.webhookEvent.create({
                    data: {
                        provider: verifier.provider,
                        externalId,
                        idempotencyKey: idemKey,
                        payload: (req.body ?? {}),
                        signatureValid: verdict.valid,
                    },
                });
                duplicate = false;
            }
            catch (e) {
                if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                    event = await this.prisma.webhookEvent.findUnique({ where: { idempotencyKey: idemKey } });
                    duplicate = true;
                }
                else {
                    throw e;
                }
            }
        }
        if (!event)
            throw new ServerTraceMissing();
        if (!verdict.valid) {
            this.logger.warn(`Webhook ${verifier.provider} signature rejected: ${verdict.reason ?? 'unknown'} (event=${event.id})`);
            return { accepted: false, duplicate, eventId: event.id, reason: verdict.reason };
        }
        if (event.processedAt) {
            return { accepted: true, duplicate: true, eventId: event.id };
        }
        await this.runBusiness(verifier.provider, verdict);
        await this.prisma.webhookEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } });
        return { accepted: true, duplicate, eventId: event.id };
    }
    async runBusiness(provider, verdict) {
        if (verdict.kind !== 'PAYMENT_SUCCEEDED' && verdict.kind !== 'PAYMENT_FAILED')
            return;
        let paymentId = verdict.paymentId;
        if (!paymentId && verdict.providerRef) {
            const p = await this.prisma.payment.findFirst({ where: { providerRef: verdict.providerRef }, select: { id: true } });
            paymentId = p?.id;
        }
        if (!paymentId && provider === 'FLUTTERWAVE' && verdict.externalId) {
            const p = await this.prisma.payment.findFirst({ where: { idempotencyKey: `${verdict.externalId}`.slice(0, 128) }, select: { id: true } });
            paymentId = p?.id;
        }
        if (!paymentId) {
            this.logger.error(`Webhook ${provider}: cannot resolve payment for event ${verdict.externalId} — manual reconciliation needed`);
            return;
        }
        if (verdict.kind === 'PAYMENT_SUCCEEDED') {
            await this.payments.markSucceeded(paymentId, verdict.providerRef ?? '');
        }
        else {
            await this.payments.markTerminalFailure(paymentId, 'FAILED');
        }
    }
    async recent(provider, limit) {
        return this.prisma.webhookEvent.findMany({
            where: provider ? { provider } : {},
            orderBy: { receivedAt: 'desc' },
            take: Math.min(Math.max(limit, 1), 100),
            select: { id: true, provider: true, externalId: true, signatureValid: true, processedAt: true, receivedAt: true, failureReason: true },
        });
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        payments_service_1.PaymentsService,
        verifier_registry_1.VerifierRegistry])
], WebhooksService);
class ServerTraceMissing extends Error {
    constructor() {
        super('webhook trace missing after create');
        this.name = 'ServerTraceMissing';
    }
}
//# sourceMappingURL=webhooks.service.js.map