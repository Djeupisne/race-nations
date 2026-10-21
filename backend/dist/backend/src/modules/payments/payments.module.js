"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const wallet_module_1 = require("../wallet/wallet.module");
const audit_module_1 = require("../audit/audit.module");
const payments_service_1 = require("./payments.service");
const payments_controller_1 = require("./payments.controller");
const stripe_provider_1 = require("./stripe.provider");
const flutterwave_provider_1 = require("./flutterwave.provider");
const google_play_provider_1 = require("./google-play.provider");
const apple_store_provider_1 = require("./apple-store.provider");
const huawei_iap_provider_1 = require("./huawei-iap.provider");
let PaymentsModule = class PaymentsModule {
};
exports.PaymentsModule = PaymentsModule;
exports.PaymentsModule = PaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, wallet_module_1.WalletModule, audit_module_1.AuditModule],
        providers: [
            payments_service_1.PaymentsService,
            stripe_provider_1.StripeProvider,
            flutterwave_provider_1.FlutterwaveProvider,
            google_play_provider_1.GooglePlayProvider,
            apple_store_provider_1.AppleStoreProvider,
            huawei_iap_provider_1.HuaweiIapProvider,
        ],
        controllers: [payments_controller_1.PaymentsController],
        exports: [payments_service_1.PaymentsService, google_play_provider_1.GooglePlayProvider, apple_store_provider_1.AppleStoreProvider, huawei_iap_provider_1.HuaweiIapProvider],
    })
], PaymentsModule);
//# sourceMappingURL=payments.module.js.map