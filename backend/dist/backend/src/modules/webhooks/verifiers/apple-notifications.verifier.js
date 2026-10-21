"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleNotificationsVerifier = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const b64urlJson = (seg) => JSON.parse(Buffer.from(seg.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
let AppleNotificationsVerifier = class AppleNotificationsVerifier {
    provider = 'APPLE_IAP';
    path = '/webhooks/apple';
    async verify(req) {
        const signed = req.body?.signedPayload;
        if (typeof signed !== 'string')
            return { valid: false, reason: 'MALFORMED' };
        const parts = signed.split('.');
        if (parts.length !== 3)
            return { valid: false, reason: 'MALFORMED' };
        let header;
        let payload;
        try {
            header = b64urlJson(parts[0]);
            payload = b64urlJson(parts[1]);
        }
        catch {
            return { valid: false, reason: 'MALFORMED' };
        }
        const leafDer = header.x5c?.[0];
        const rootPem = process.env.APPLE_ROOT_CA_PEM;
        if (!leafDer || !rootPem)
            return { valid: false, reason: 'NO_MATCHING_SIGNATURE' };
        let leafKey;
        try {
            leafKey = (0, node_crypto_1.createPublicKey)(new node_crypto_1.X509Certificate(Buffer.from(leafDer, 'base64')).publicKey);
        }
        catch {
            return { valid: false, reason: 'MALFORMED' };
        }
        const ok = (0, node_crypto_1.verify)('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), leafKey, Buffer.from(parts[2], 'base64'));
        if (!ok)
            return { valid: false, reason: 'NO_MATCHING_SIGNATURE' };
        const uuid = payload.notificationUUID;
        if (!uuid)
            return { valid: false, reason: 'MALFORMED' };
        const succeeded = payload.notificationType === 'DID_RENEW' || payload.notificationType === 'SUBSCRIBED' || payload.notificationType === 'ONE_TIME_CHARGE';
        return { valid: true, externalId: uuid, kind: succeeded ? 'PAYMENT_SUCCEEDED' : 'OTHER' };
    }
};
exports.AppleNotificationsVerifier = AppleNotificationsVerifier;
exports.AppleNotificationsVerifier = AppleNotificationsVerifier = __decorate([
    (0, common_1.Injectable)()
], AppleNotificationsVerifier);
//# sourceMappingURL=apple-notifications.verifier.js.map