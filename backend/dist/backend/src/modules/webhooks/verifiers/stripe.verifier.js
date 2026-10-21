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
exports.StripeVerifier = void 0;
const common_1 = require("@nestjs/common");
const signature_1 = require("../../../common/utils/signature");
const clock_1 = require("../../../common/utils/clock");
const common_2 = require("@nestjs/common");
let StripeVerifier = class StripeVerifier {
    clock;
    provider = 'STRIPE';
    path = '/webhooks/stripe';
    constructor(clock) {
        this.clock = clock;
    }
    async verify(req) {
        const header = req.headers['stripe-signature'];
        if (typeof header !== 'string')
            return { valid: false, reason: 'MALFORMED' };
        const secret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
        const raw = req.rawBody?.toString('utf8') ?? JSON.stringify(req.body ?? {});
        const res = (0, signature_1.verifySignedHeader)(header, raw, secret, this.clock.nowMs(), 300_000);
        if (!res.valid)
            return { valid: false, reason: res.reason };
        const body = (req.body ?? {});
        if (!body.id || !body.type)
            return { valid: false, reason: 'MALFORMED' };
        const obj = body.data?.object ?? {};
        const paymentId = obj.metadata?.paymentId;
        if (body.type === 'payment_intent.succeeded') {
            if (!paymentId)
                return { valid: false, reason: 'UNKNOWN_EVENT' };
            return { valid: true, externalId: body.id, paymentId, providerRef: obj.id, kind: 'PAYMENT_SUCCEEDED' };
        }
        if (body.type === 'payment_intent.payment_failed' || body.type === 'payment_intent.canceled') {
            if (!paymentId)
                return { valid: false, reason: 'UNKNOWN_EVENT' };
            return { valid: true, externalId: body.id, paymentId, providerRef: obj.id, kind: 'PAYMENT_FAILED' };
        }
        return { valid: true, externalId: body.id, kind: 'OTHER' };
    }
};
exports.StripeVerifier = StripeVerifier;
exports.StripeVerifier = StripeVerifier = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_2.Inject)(clock_1.CLOCK)),
    __metadata("design:paramtypes", [Object])
], StripeVerifier);
//# sourceMappingURL=stripe.verifier.js.map