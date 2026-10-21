"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseWalletModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const wallet_module_1 = require("../wallet/wallet.module");
const house_wallet_service_1 = require("./house-wallet.service");
const house_wallet_controller_1 = require("./house-wallet.controller");
let HouseWalletModule = class HouseWalletModule {
};
exports.HouseWalletModule = HouseWalletModule;
exports.HouseWalletModule = HouseWalletModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, wallet_module_1.WalletModule],
        providers: [house_wallet_service_1.HouseWalletService],
        controllers: [house_wallet_controller_1.HouseWalletController],
        exports: [house_wallet_service_1.HouseWalletService],
    })
], HouseWalletModule);
//# sourceMappingURL=house-wallet.module.js.map