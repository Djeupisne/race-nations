"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const payments_module_1 = require("../payments/payments.module");
const wallet_module_1 = require("../wallet/wallet.module");
const webhooks_service_1 = require("./webhooks.service");
const webhooks_controller_1 = require("./webhooks.controller");
const verifier_registry_1 = require("./verifiers/verifier.registry");
const stripe_verifier_1 = require("./verifiers/stripe.verifier");
const flutterwave_verifier_1 = require("./verifiers/flutterwave.verifier");
const google_rtdn_verifier_1 = require("./verifiers/google-rtdn.verifier");
const apple_notifications_verifier_1 = require("./verifiers/apple-notifications.verifier");
const huawei_verifier_1 = require("./verifiers/huawei.verifier");
let WebhooksModule = class WebhooksModule {
};
exports.WebhooksModule = WebhooksModule;
exports.WebhooksModule = WebhooksModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, payments_module_1.PaymentsModule, wallet_module_1.WalletModule],
        providers: [
            webhooks_service_1.WebhooksService,
            verifier_registry_1.VerifierRegistry,
            stripe_verifier_1.StripeVerifier,
            flutterwave_verifier_1.FlutterwaveVerifier,
            google_rtdn_verifier_1.GoogleRtdnVerifier,
            apple_notifications_verifier_1.AppleNotificationsVerifier,
            huawei_verifier_1.HuaweiVerifier,
        ],
        controllers: [webhooks_controller_1.WebhooksController],
        exports: [webhooks_service_1.WebhooksService],
    })
], WebhooksModule);
//# sourceMappingURL=webhooks.module.js.map