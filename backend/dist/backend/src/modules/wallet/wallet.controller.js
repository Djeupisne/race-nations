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
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const wallet_service_1 = require("./wallet.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const ownership_guard_1 = require("../../common/guards/ownership.guard");
const idempotency_guard_1 = require("../../common/guards/idempotency.guard");
const rate_limit_guard_1 = require("../../common/guards/rate-limit.guard");
const api_contracts_1 = require("@race-nations/api-contracts");
const PurchaseInputSchema = zod_1.z
    .object({
    itemRef: zod_1.z.string().min(1).max(64),
    quantity: zod_1.z.number().int().min(1).max(10).default(1),
})
    .strict();
let WalletController = class WalletController {
    wallet;
    constructor(wallet) {
        this.wallet = wallet;
    }
    async balances(user) {
        return this.wallet.balances(user.playerId);
    }
    async transactions(user, query) {
        return this.wallet.transactions(user.playerId, query);
    }
    async purchase(user, input, req) {
        const catalogPrice = await this.priceOf(input.itemRef);
        return this.wallet.purchase(user.playerId, {
            column: catalogPrice.column,
            amount: catalogPrice.amount * input.quantity,
            itemRef: `${input.itemRef}#x${input.quantity}`,
            idempotencyKey: req.idempotencyKey ?? `purchase:${user.playerId}:${req.headers['idempotency-key']}`,
        });
    }
    async priceOf(itemRef) {
        switch (itemRef) {
            case 'ticket:tournament': return { column: 'credits', amount: 500 };
            case 'ticket:matchday': return { column: 'credits', amount: 500 };
            case 'ticket:clan-wars': return { column: 'credits', amount: 500 };
            case 'ticket:premium': return { column: 'gems', amount: 10 };
            default:
                throw Object.assign(new Error(`Unknown catalog item: ${itemRef}`), { status: 404 });
        }
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Get)('balances'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "balances", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(api_contracts_1.PageRequestSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "transactions", null);
__decorate([
    (0, common_1.Post)('purchase'),
    (0, common_1.UseGuards)(idempotency_guard_1.IdempotencyGuard, ownership_guard_1.OwnershipGuard, rate_limit_guard_1.RateLimitGuard),
    (0, rate_limit_guard_1.rateLimit)({ bucket: 'wallet.purchase', limit: 30, windowMs: 60_000, failClosed: true }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(PurchaseInputSchema)),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "purchase", null);
exports.WalletController = WalletController = __decorate([
    (0, common_1.Controller)('wallet'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map