"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HuaweiIapProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuaweiIapProvider = void 0;
const common_1 = require("@nestjs/common");
let HuaweiIapProvider = HuaweiIapProvider_1 = class HuaweiIapProvider {
    logger = new common_1.Logger(HuaweiIapProvider_1.name);
    async verifyPurchase(purchaseToken, productId) {
        const clientId = process.env.HUAWEI_CLIENT_ID;
        const clientSecret = process.env.HUAWEI_CLIENT_SECRET;
        if (!clientId || !clientSecret)
            return { ok: false };
        try {
            const tokRes = await fetch('https://oauth-login.cloud.huawei.com/oauth2/v3/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: clientId,
                    client_secret: clientSecret,
                }).toString(),
                signal: AbortSignal.timeout(6_000),
            });
            if (!tokRes.ok)
                return { ok: false };
            const { access_token } = (await tokRes.json());
            if (!access_token)
                return { ok: false };
            const res = await fetch(`https://orders-drcn.iap.cloud.huawei.com/applications/purchases/tokens/verify?purchaseToken=${encodeURIComponent(purchaseToken)}&productId=${encodeURIComponent(productId)}`, { headers: { Authorization: `Bearer ${access_token}` }, signal: AbortSignal.timeout(6_000) });
            if (!res.ok)
                return { ok: false };
            const body = (await res.json());
            const expectedMerchant = process.env.HUAWEI_MERCHANT_ID;
            const ok = body.responseCode === '0' && (!expectedMerchant || body.developerMerchantId === expectedMerchant);
            return { ok, orderId: body.purchaseTokenData };
        }
        catch {
            return { ok: false };
        }
    }
};
exports.HuaweiIapProvider = HuaweiIapProvider;
exports.HuaweiIapProvider = HuaweiIapProvider = HuaweiIapProvider_1 = __decorate([
    (0, common_1.Injectable)()
], HuaweiIapProvider);
//# sourceMappingURL=huawei-iap.provider.js.map