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
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const webhooks_service_1 = require("./webhooks.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const common_2 = require("@nestjs/common");
let WebhooksController = class WebhooksController {
    webhooks;
    constructor(webhooks) {
        this.webhooks = webhooks;
    }
    async stripe(req, res) {
        res.status(200);
        return this.webhooks.ingest('/webhooks/stripe', req);
    }
    async flutterwave(req) {
        return this.webhooks.ingest('/webhooks/flutterwave', req);
    }
    async googlePlay(req) {
        return this.webhooks.ingest('/webhooks/google-play', req);
    }
    async apple(req) {
        return this.webhooks.ingest('/webhooks/apple', req);
    }
    async huawei(req) {
        return this.webhooks.ingest('/webhooks/huawei', req);
    }
    async recent(provider, limit) {
        return this.webhooks.recent(provider, Number.parseInt(limit ?? '50', 10) || 50);
    }
    async echo(body) {
        return { received: body !== undefined && body !== null };
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Post)('stripe'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "stripe", null);
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Post)('flutterwave'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "flutterwave", null);
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Post)('google-play'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "googlePlay", null);
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Post)('apple'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "apple", null);
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Post)('huawei'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "huawei", null);
__decorate([
    (0, common_2.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('MODERATOR', 'ADMIN'),
    (0, common_1.Get)('recent'),
    __param(0, (0, common_1.Query)('provider')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "recent", null);
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Post)('_echo'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "echo", null);
exports.WebhooksController = WebhooksController = __decorate([
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [webhooks_service_1.WebhooksService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map