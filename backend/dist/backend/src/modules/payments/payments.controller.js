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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const payments_service_1 = require("./payments.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const ownership_guard_1 = require("../../common/guards/ownership.guard");
const idempotency_guard_1 = require("../../common/guards/idempotency.guard");
const rate_limit_guard_1 = require("../../common/guards/rate-limit.guard");
const zod_validation_pipe_1 = require("../../common/pipes/zod-validation.pipe");
const api_contracts_1 = require("@race-nations/api-contracts");
const domain_errors_1 = require("../../common/errors/domain-errors");
const CheckoutInputSchema = zod_1.z
    .object({
    amountCents: zod_1.z.number().int().positive(),
    currencyCode: zod_1.z.enum(['EUR', 'NGN', 'MAD', 'GHS', 'KES']).default('EUR'),
    provider: zod_1.z.enum(['STRIPE', 'FLUTTERWAVE']),
})
    .strict();
let PaymentsController = class PaymentsController {
    payments;
    prisma;
    constructor(payments, prisma) {
        this.payments = payments;
        this.prisma = prisma;
    }
    async checkout(user, input, req) {
        const player = await this.prisma.player.findUnique({
            where: { id: user.playerId },
            select: { countryCode: true },
        });
        if (!player)
            throw new domain_errors_1.NotFoundError('Player', user.playerId);
        const key = req.idempotencyKey;
        if (!key)
            throw new domain_errors_1.ValidationError({ field: 'Idempotency-Key', reason: 'Missing after guard.' });
        return this.payments.createCheckout({
            playerId: user.playerId,
            amountCents: input.amountCents,
            currencyCode: input.currencyCode,
            jurisdiction: player.countryCode,
            provider: input.provider,
            idempotencyKey: key,
        });
    }
    async list(user, query) {
        return this.payments.listForPlayer(user.playerId, query);
    }
    async status(user, id) {
        return this.payments.getStatus(user.playerId, id);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('checkout'),
    (0, common_1.UseGuards)(idempotency_guard_1.IdempotencyGuard, rate_limit_guard_1.RateLimitGuard),
    (0, rate_limit_guard_1.rateLimit)({ bucket: 'money-write', points: 5, durationMs: 60_000, failClosed: true }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(CheckoutInputSchema))),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "checkout", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_validation_pipe_1.ZodValidationPipe(api_contracts_1.PageRequestSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(ownership_guard_1.OwnershipGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "status", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        prisma_service_1.PrismaService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map