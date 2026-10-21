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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const admin_service_1 = require("./admin.service");
const audit_service_1 = require("../audit/audit.service");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const domain_errors_1 = require("../../common/errors/domain-errors");
const ManualSettleSchema = zod_1.z.object({
    marketId: zod_1.z.string().uuid(),
    winningSide: zod_1.z.number().int().min(0).max(15).optional(),
    push: zod_1.z.boolean().optional(),
    reason: zod_1.z.string().min(10).max(2000),
});
const SanctionSchema = zod_1.z.object({
    playerId: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['WARN', 'CHAT_MUTE', 'BET_RESTRICTION', 'TEMP_BAN_7D', 'PERM_BAN', 'REWARD_CLAWBACK']),
    reason: zod_1.z.string().min(5).max(2000),
    evidenceRef: zod_1.z.string().max(200).optional(),
});
const DisputeResolveSchema = zod_1.z.object({
    outcome: zod_1.z.enum(['REFUND_ALL', 'UPHELD']),
    note: zod_1.z.string().min(10).max(2000),
});
const DisputeReasonSchema = zod_1.z.enum(['CHEAT_SUSPECTED', 'RESULT_MISMATCH', 'DISCONNECT_DISPUTE', 'SERVER_FAULT', 'OTHER']);
let AdminController = class AdminController {
    admin;
    audit;
    constructor(admin, audit) {
        this.admin = admin;
        this.audit = audit;
    }
    actor(req) {
        const u = req.user;
        if (!u)
            throw new domain_errors_1.AuthUnauthenticatedError();
        return { userId: u.userId, role: u.role === 'ADMIN' ? 'ADMIN' : 'MODERATOR' };
    }
    dashboard() {
        return this.admin.dashboard();
    }
    async settle(req, id, body) {
        const parsed = ManualSettleSchema.safeParse(body);
        if (!parsed.success)
            throw new domain_errors_1.ValidationError({ field: 'body', reason: parsed.error.message });
        return this.admin.manualSettleMarket(this.actor(req), { ...parsed.data, marketId: id });
    }
    dispute(req, id, body) {
        const parsed = DisputeReasonSchema.safeParse(body?.reason);
        if (!parsed.success)
            throw new domain_errors_1.ValidationError({ field: 'reason', reason: parsed.error.message });
        return this.admin.openDispute(this.actor(req), id, parsed.data);
    }
    async resolve(req, id, body) {
        const parsed = DisputeResolveSchema.safeParse(body);
        if (!parsed.success)
            throw new domain_errors_1.ValidationError({ field: 'body', reason: parsed.error.message });
        return this.admin.resolveDispute(this.actor(req), id, parsed.data.outcome, parsed.data.note);
    }
    async sanction(req, body) {
        const parsed = SanctionSchema.safeParse(body);
        if (!parsed.success)
            throw new domain_errors_1.ValidationError({ field: 'body', reason: parsed.error.message });
        return this.admin.issueSanction(this.actor(req), parsed.data);
    }
    drain(req, id) {
        return this.admin.drainServer(this.actor(req), id);
    }
    getAuditLog(targetType, targetId, limit) {
        return this.audit.search({ targetType, targetId, limit: limit ? Number(limit) : undefined });
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "dashboard", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Post)('betting/markets/:id/settle'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "settle", null);
__decorate([
    (0, common_1.Post)('betting/markets/:id/dispute'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "dispute", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Post)('betting/markets/:id/dispute/resolve'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resolve", null);
__decorate([
    (0, common_1.Post)('sanctions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "sanction", null);
__decorate([
    (0, common_1.Post)('servers/:id/drain'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "drain", null);
__decorate([
    (0, common_1.Get)('audit'),
    __param(0, (0, common_1.Query)('targetType')),
    __param(1, (0, common_1.Query)('targetId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAuditLog", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('v1/admin'),
    (0, roles_decorator_1.Roles)('MODERATOR', 'ADMIN'),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        audit_service_1.AuditService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map