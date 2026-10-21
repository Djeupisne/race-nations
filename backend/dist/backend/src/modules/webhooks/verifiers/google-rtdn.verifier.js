"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleRtdnVerifier = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const b64urlDecode = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
let GoogleRtdnVerifier = class GoogleRtdnVerifier {
    provider = 'GOOGLE_PLAY';
    path = '/webhooks/google-play';
    async verify(req) {
        const message = req.body?.message;
        if (!message?.data)
            return { valid: false, reason: 'MALFORMED' };
        let payload;
        try {
            payload = JSON.parse(Buffer.from(message.data, 'base64').toString('utf8'));
        }
        catch {
            return { valid: false, reason: 'MALFORMED' };
        }
        const pubPem = process.env.GOOGLE_RTDN_PUBLIC_KEY_PEM;
        if (pubPem) {
            const jwt = req.body && req.query.jwt;
            if (typeof jwt === 'string') {
                const [h, p, sig] = jwt.split('.');
                if (!h || !p || !sig)
                    return { valid: false, reason: 'MALFORMED' };
                const key = (0, node_crypto_1.createPublicKey)(pubPem);
                const ok = (0, node_crypto_1.verify)('RSA-SHA256', Buffer.from(`${h}.${p}`), key, b64urlDecode(sig));
                if (!ok)
                    return { valid: false, reason: 'NO_MATCHING_SIGNATURE' };
            }
        }
        const dn = payload.developerNotification;
        if (!dn?.orderId)
            return { valid: true, externalId: message.messageId ?? 'unknown', kind: 'OTHER' };
        const succeeded = dn.eventType === 'SUBSCRIPTION' || dn.eventType === 'ONE_TIME_PRODUCT_PURCHASED' || dn.eventType === 'NON_SUBSCRIPTION_PURCHASED';
        return {
            valid: true,
            externalId: dn.orderId,
            providerRef: dn.purchaseToken,
            kind: succeeded ? 'PAYMENT_SUCCEEDED' : 'OTHER',
        };
    }
};
exports.GoogleRtdnVerifier = GoogleRtdnVerifier;
exports.GoogleRtdnVerifier = GoogleRtdnVerifier = __decorate([
    (0, common_1.Injectable)()
], GoogleRtdnVerifier);
//# sourceMappingURL=google-rtdn.verifier.js.map