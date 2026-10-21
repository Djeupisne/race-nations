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
var FlutterwaveProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlutterwaveProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let FlutterwaveProvider = FlutterwaveProvider_1 = class FlutterwaveProvider {
    config;
    logger = new common_1.Logger(FlutterwaveProvider_1.name);
    constructor(config) {
        this.config = config;
    }
    async initiateTransfer(paymentId, amountCents, currency, email) {
        const key = process.env.FLUTTERWAVE_SECRET_KEY;
        if (!key)
            throw new Error('Flutterwave not configured');
        const res = await fetch('https://api.flutterwave.com/v3/payments', {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tx_ref: paymentId,
                amount: amountCents,
                currency,
                email,
                redirect_url: this.config.get('payments.fwRedirectUrl') ?? 'https://app racenations.invalid/deposit-done',
                meta: { paymentId },
            }),
            signal: AbortSignal.timeout(8_000),
        });
        if (!res.ok) {
            this.logger.error(`FW initiate failed status=${res.status}`);
            throw new Error('provider_unavailable');
        }
        const body = (await res.json());
        if (body.status !== 'success' || !body.data?.link)
            throw new Error('provider_error');
        return { flwRef: paymentId, link: body.data.link };
    }
};
exports.FlutterwaveProvider = FlutterwaveProvider;
exports.FlutterwaveProvider = FlutterwaveProvider = FlutterwaveProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FlutterwaveProvider);
//# sourceMappingURL=flutterwave.provider.js.map