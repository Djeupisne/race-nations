"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlutterwaveVerifier = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const signature_1 = require("../../../common/utils/signature");
let FlutterwaveVerifier = class FlutterwaveVerifier {
    provider = 'FLUTTERWAVE';
    path = '/webhooks/flutterwave';
    async verify(req) {
        const provided = req.headers['verif-hash'];
        if (typeof provided !== 'string')
            return { valid: false, reason: 'MALFORMED' };
        const secret = process.env.FLUTTERWAVE_WEBHOOK_HASH ?? '';
        const raw = req.rawBody?.toString('utf8') ?? JSON.stringify(req.body ?? {});
        const expected = (0, node_crypto_1.createHash)('sha256').update(secret + raw, 'utf8').digest('hex');
        if (!(0, signature_1.verifySignatureConstantTime)(expected, provided))
            return { valid: false, reason: 'NO_MATCHING_SIGNATURE' };
        const body = (req.body ?? {});
        const externalId = String(body.id ?? '');
        if (!externalId)
            return { valid: false, reason: 'MALFORMED' };
        const status = body.data?.status;
        if (status === 'successful' || status === 'completed') {
            return { valid: true, externalId, providerRef: body.data?.flw_ref ?? body.data?.payment_id, kind: 'PAYMENT_SUCCEEDED' };
        }
        if (status === 'failed' || status === 'cancelled') {
            return { valid: true, externalId, providerRef: body.data?.flw_ref, kind: 'PAYMENT_FAILED' };
        }
        return { valid: true, externalId, kind: 'OTHER' };
    }
};
exports.FlutterwaveVerifier = FlutterwaveVerifier;
exports.FlutterwaveVerifier = FlutterwaveVerifier = __decorate([
    (0, common_1.Injectable)()
], FlutterwaveVerifier);
//# sourceMappingURL=flutterwave.verifier.js.map