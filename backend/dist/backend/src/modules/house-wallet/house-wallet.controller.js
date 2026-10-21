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
exports.HouseWalletController = void 0;
const common_1 = require("@nestjs/common");
const house_wallet_service_1 = require("./house-wallet.service");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const domain_errors_1 = require("../../common/errors/domain-errors");
let HouseWalletController = class HouseWalletController {
    house;
    constructor(house) {
        this.house = house;
    }
    snapshot() {
        return this.house.getSnapshot();
    }
    transactions(limit, before) {
        return this.house.listTransactions({
            limit: limit ? Number(limit) : undefined,
            before: before ? new Date(before) : undefined,
        });
    }
    snapshots(days) {
        return this.house.listSnapshots(days ? Number(days) : 30);
    }
    async reverse(req, body, _p) {
        void _p;
        const actorUserId = req.user?.userId;
        if (!actorUserId)
            throw new domain_errors_1.AuthUnauthenticatedError();
        return this.house.reverseTransaction({ originalTxId: body.originalTxId, actorUserId, reason: body.reason });
    }
};
exports.HouseWalletController = HouseWalletController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HouseWalletController.prototype, "snapshot", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('before')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], HouseWalletController.prototype, "transactions", null);
__decorate([
    (0, common_1.Get)('snapshots'),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HouseWalletController.prototype, "snapshots", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Post)('reverse'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], HouseWalletController.prototype, "reverse", null);
exports.HouseWalletController = HouseWalletController = __decorate([
    (0, roles_decorator_1.Roles)('ADMIN', 'MODERATOR'),
    (0, common_1.Controller)('v1/admin/house-wallet'),
    __metadata("design:paramtypes", [house_wallet_service_1.HouseWalletService])
], HouseWalletController);
//# sourceMappingURL=house-wallet.controller.js.map