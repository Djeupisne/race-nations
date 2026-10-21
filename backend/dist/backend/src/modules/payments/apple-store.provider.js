"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AppleStoreProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleStoreProvider = void 0;
const common_1 = require("@nestjs/common");
const VERIFY_URL_PROD = 'https://buy.itunes.apple.com/verifyReceipt';
let AppleStoreProvider = AppleStoreProvider_1 = class AppleStoreProvider {
    logger = new common_1.Logger(AppleStoreProvider_1.name);
    async verifyTransaction(transactionId) {
        const secret = process.env.APPLE_SHARED_SECRET;
        if (!secret)
            return { ok: false };
        try {
            const res = await fetch(VERIFY_URL_PROD, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 'receipt-data': transactionId, password: secret, 'exclude-old-transactions': true }),
                signal: AbortSignal.timeout(6_000),
            });
            if (!res.ok)
                return { ok: false };
            const body = (await res.json());
            if (body.status !== 0)
                return { ok: false };
            const match = body.latest_receipt_info?.find((r) => r.transaction_id === transactionId);
            if (!match)
                return { ok: false };
            return { ok: true, productId: match.product_id, bundleId: match.bundle_id };
        }
        catch {
            return { ok: false };
        }
    }
};
exports.AppleStoreProvider = AppleStoreProvider;
exports.AppleStoreProvider = AppleStoreProvider = AppleStoreProvider_1 = __decorate([
    (0, common_1.Injectable)()
], AppleStoreProvider);
//# sourceMappingURL=apple-store.provider.js.map