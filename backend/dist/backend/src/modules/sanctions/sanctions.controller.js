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
exports.SanctionsController = void 0;
const common_1 = require("@nestjs/common");
const sanctions_service_1 = require("./sanctions.service");
const sanctions_dto_1 = require("./sanctions.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const domain_errors_1 = require("../../common/errors/domain-errors");
let SanctionsController = class SanctionsController {
    sanctions;
    constructor(sanctions) {
        this.sanctions = sanctions;
    }
    user(req) {
        const u = req.user;
        if (!u)
            throw new domain_errors_1.AuthUnauthenticatedError();
        return u;
    }
    mine(req) {
        const u = this.user(req);
        if (!u.playerId)
            throw new domain_errors_1.AuthUnauthenticatedError();
        return this.sanctions.listForPlayer(u.playerId);
    }
    async appeal(req, id, body) {
        const u = this.user(req);
        if (!u.playerId)
            throw new domain_errors_1.AuthUnauthenticatedError();
        const parsed = sanctions_dto_1.AppealSanctionSchema.safeParse(body);
        if (!parsed.success)
            throw new domain_errors_1.ValidationError({ field: 'body', reason: parsed.error.message });
        await this.sanctions.appeal(id, u.playerId, parsed.data.note);
        return { ok: true };
    }
    issue(req, body) {
        const u = this.user(req);
        const parsed = sanctions_dto_1.IssueSanctionSchema.safeParse(body);
        if (!parsed.success)
            throw new domain_errors_1.ValidationError({ field: 'body', reason: parsed.error.message });
        return this.sanctions.issue({ ...parsed.data, issuedById: u.userId });
    }
    async decide(id, body) {
        const parsed = sanctions_dto_1.DecideAppealSchema.safeParse(body);
        if (!parsed.success)
            throw new domain_errors_1.ValidationError({ field: 'body', reason: parsed.error.message });
        await this.sanctions.decideAppeal(id, parsed.data.decision);
        return { ok: true };
    }
    async lift(id) {
        await this.sanctions.lift(id);
        return { ok: true };
    }
};
exports.SanctionsController = SanctionsController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SanctionsController.prototype, "mine", null);
__decorate([
    (0, common_1.Post)(':id/appeal'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SanctionsController.prototype, "appeal", null);
__decorate([
    (0, roles_decorator_1.Roles)('MODERATOR', 'ADMIN'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SanctionsController.prototype, "issue", null);
__decorate([
    (0, roles_decorator_1.Roles)('MODERATOR', 'ADMIN'),
    (0, common_1.Post)(':id/decide'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SanctionsController.prototype, "decide", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Post)(':id/lift'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SanctionsController.prototype, "lift", null);
exports.SanctionsController = SanctionsController = __decorate([
    (0, common_1.Controller)('v1/sanctions'),
    __metadata("design:paramtypes", [sanctions_service_1.SanctionsService])
], SanctionsController);
//# sourceMappingURL=sanctions.controller.js.map