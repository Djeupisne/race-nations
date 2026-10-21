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
exports.MatchesController = void 0;
const common_1 = require("@nestjs/common");
const api_contracts_1 = require("@race-nations/api-contracts");
const zod_1 = require("zod");
const zod_validation_pipe_1 = require("../../common/pipes/zod-validation.pipe");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const server_auth_guard_1 = require("../../common/guards/server-auth.guard");
const ownership_guard_1 = require("../../common/guards/ownership.guard");
const matches_service_1 = require("./matches.service");
const match_settlement_service_1 = require("./match-settlement.service");
const joinPipe = new zod_validation_pipe_1.ZodValidationPipe(api_contracts_1.JoinMatchInputSchema);
const StatusReportSchema = zod_1.z
    .object({ status: zod_1.z.enum(['LOADING', 'IN_PROGRESS', 'FINISHED']) })
    .strict();
const InvalidateSchema = zod_1.z.object({ reason: zod_1.z.string().min(3).max(500) }).strict();
let MatchesController = class MatchesController {
    matches;
    settlement;
    constructor(matches, settlement) {
        this.matches = matches;
        this.settlement = settlement;
    }
    get(id) {
        return this.matches.getMatch(id);
    }
    history(user, limit, cursor) {
        return this.matches.historyForPlayer(user.playerId, { limit: Math.min(parseInt(limit ?? '20', 10) || 20, 50), cursor });
    }
    join(id, user, body) {
        void body;
        return this.matches.join(id, user.playerId);
    }
    statusReport(id, body) {
        return this.matches.updateStatusFromServer(id, body.status);
    }
    async invalidateByServer(id, body) {
        const m = await this.matches.invalidate(id, `SERVER:${body.reason}`);
        await this.settlement.handleInvalidatedMatch(id, body.reason);
        return m;
    }
    async manualSettle(id) {
        await this.settlement.settleValidatedMatch(id);
        return { ok: true };
    }
};
exports.MatchesController = MatchesController;
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MatchesController.prototype, "get", null);
__decorate([
    (0, common_1.Get)('me/history'),
    (0, common_1.UseGuards)(ownership_guard_1.OwnershipGuard),
    (0, ownership_guard_1.ownership)({ resource: 'self' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('cursor')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], MatchesController.prototype, "history", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    (0, common_1.UseGuards)(ownership_guard_1.OwnershipGuard),
    (0, ownership_guard_1.ownership)({ resource: 'matchParticipant' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)(joinPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], MatchesController.prototype, "join", null);
__decorate([
    (0, common_1.Post)(':id/status-report'),
    (0, common_1.UseGuards)(server_auth_guard_1.ServerAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(StatusReportSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MatchesController.prototype, "statusReport", null);
__decorate([
    (0, common_1.Post)(':id/invalidate'),
    (0, common_1.UseGuards)(server_auth_guard_1.ServerAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(InvalidateSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MatchesController.prototype, "invalidateByServer", null);
__decorate([
    (0, common_1.Post)(':id/settle'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MatchesController.prototype, "manualSettle", null);
exports.MatchesController = MatchesController = __decorate([
    (0, common_1.Controller)('v1/matches'),
    __metadata("design:paramtypes", [matches_service_1.MatchesService,
        match_settlement_service_1.MatchSettlementService])
], MatchesController);
//# sourceMappingURL=matches.controller.js.map