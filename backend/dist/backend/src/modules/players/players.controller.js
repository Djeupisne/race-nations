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
exports.LeaderboardsController = exports.PlayersController = void 0;
const common_1 = require("@nestjs/common");
const players_service_1 = require("./players.service");
const players_dto_1 = require("./players.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const ownership_guard_1 = require("../../common/guards/ownership.guard");
let PlayersController = class PlayersController {
    players;
    constructor(players) {
        this.players = players;
    }
    async me(user) {
        return this.players.getProfileByUserId(user.userId);
    }
    async updateMe(user, input) {
        return this.players.updateProfile(user.userId, input);
    }
    async setNationality(user, input) {
        return this.players.setNationality(user.userId, input);
    }
    async stats(user) {
        return this.players.stats(user.playerId);
    }
    async records(user, query) {
        const s = await this.players.stats(user.playerId);
        return { playerId: user.playerId, ...s, trackFilter: query.trackId ?? null, season: query.season ?? null };
    }
    async publicProfile(id) {
        return this.players.getPublicProfile(id);
    }
};
exports.PlayersController = PlayersController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlayersController.prototype, "me", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, common_1.UseGuards)(ownership_guard_1.OwnershipGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(players_dto_1.UpdatePlayerDtoPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PlayersController.prototype, "updateMe", null);
__decorate([
    (0, common_1.Post)('me/nationality'),
    (0, common_1.UseGuards)(ownership_guard_1.OwnershipGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(players_dto_1.SetNationalityInputSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PlayersController.prototype, "setNationality", null);
__decorate([
    (0, common_1.Get)('me/stats'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlayersController.prototype, "stats", null);
__decorate([
    (0, common_1.Get)('me/records'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(players_dto_1.PlayerRecordsQuerySchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PlayersController.prototype, "records", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(ownership_guard_1.OwnershipGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PlayersController.prototype, "publicProfile", null);
exports.PlayersController = PlayersController = __decorate([
    (0, common_1.Controller)('players'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [players_service_1.PlayersService])
], PlayersController);
let LeaderboardsController = class LeaderboardsController {
    players;
    constructor(players) {
        this.players = players;
    }
    async list(query) {
        return this.players.leaderboard(query);
    }
};
exports.LeaderboardsController = LeaderboardsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)(players_dto_1.LeaderboardQuerySchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LeaderboardsController.prototype, "list", null);
exports.LeaderboardsController = LeaderboardsController = __decorate([
    (0, common_1.Controller)('leaderboards'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [players_service_1.PlayersService])
], LeaderboardsController);
//# sourceMappingURL=players.controller.js.map