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
exports.ModerationController = void 0;
const common_1 = require("@nestjs/common");
const moderation_service_1 = require("./moderation.service");
const moderation_dto_1 = require("./moderation.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const audit_service_1 = require("../audit/audit.service");
const domain_errors_1 = require("../../common/errors/domain-errors");
let ModerationController = class ModerationController {
    moderation;
    audit;
    constructor(moderation, audit) {
        this.moderation = moderation;
        this.audit = audit;
    }
    queue(query) {
        const parsed = moderation_dto_1.ModerationQueueQuerySchema.safeParse(query);
        if (!parsed.success)
            throw new domain_errors_1.ValidationError({ field: 'query', reason: parsed.error.message });
        return this.moderation.queue(parsed.data.limit);
    }
    detail(id) {
        return this.moderation.reportDetail(id);
    }
    async dismiss(req, id, body) {
        const parsed = moderation_dto_1.DismissReportSchema.safeParse(body);
        if (!parsed.success)
            throw new domain_errors_1.ValidationError({ field: 'body', reason: parsed.error.message });
        if (!req.user?.userId)
            throw new domain_errors_1.AuthUnauthenticatedError();
        await this.moderation.dismissReport(id, parsed.data.note);
        await this.audit.record({
            actorUserId: req.user.userId,
            action: 'REPORT_DISMISS',
            targetType: 'ResultPayload',
            targetId: id,
            metadata: { note: parsed.data.note },
            requestId: req.headers['x-request-id'] ?? 'unknown',
        });
        return { ok: true };
    }
    filterTest(body) {
        const parsed = moderation_dto_1.FilterTextSchema.safeParse(body);
        if (!parsed.success)
            throw new domain_errors_1.ValidationError({ field: 'body', reason: parsed.error.message });
        return this.moderation.filterText(parsed.data.text);
    }
};
exports.ModerationController = ModerationController;
__decorate([
    (0, common_1.Get)('reports'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ModerationController.prototype, "queue", null);
__decorate([
    (0, common_1.Get)('reports/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ModerationController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)('reports/:id/dismiss'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "dismiss", null);
__decorate([
    (0, common_1.Post)('filter-test'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ModerationController.prototype, "filterTest", null);
exports.ModerationController = ModerationController = __decorate([
    (0, roles_decorator_1.Roles)('MODERATOR', 'ADMIN'),
    (0, common_1.Controller)('v1/moderation'),
    __metadata("design:paramtypes", [moderation_service_1.ModerationService,
        audit_service_1.AuditService])
], ModerationController);
//# sourceMappingURL=moderation.controller.js.map