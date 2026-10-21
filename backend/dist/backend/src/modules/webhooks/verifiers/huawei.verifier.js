"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuaweiVerifier = void 0;
const common_1 = require("@nestjs/common");
let HuaweiVerifier = class HuaweiVerifier {
    provider = 'HUAWEI_IAP';
    path = '/webhooks/huawei';
    async verify(req) {
        const auth = req.headers['authorization'];
        const expected = process.env.HUAWEI_WEBHOOK_TOKEN;
        if (!expected || typeof auth !== 'string' || !auth.endsWith(expected)) {
            return { valid: false, reason: 'NO_MATCHING_SIGNATURE' };
        }
        const body = (req.body ?? {});
        if (!body.orderId)
            return { valid: false, reason: 'MALFORMED' };
        return {
            valid: true,
            externalId: body.orderId,
            providerRef: body.orderId,
            kind: body.purchaseState === 0 ? 'PAYMENT_SUCCEEDED' : 'OTHER',
        };
    }
};
exports.HuaweiVerifier = HuaweiVerifier;
exports.HuaweiVerifier = HuaweiVerifier = __decorate([
    (0, common_1.Injectable)()
], HuaweiVerifier);
//# sourceMappingURL=huawei.verifier.js.map