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
var StripeProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let StripeProvider = StripeProvider_1 = class StripeProvider {
    config;
    logger = new common_1.Logger(StripeProvider_1.name);
    constructor(config) {
        this.config = config;
    }
    get enabled() {
        return Boolean(this.config.get('providers.stripe.secretKey'));
    }
    async createCheckout(input) {
        const key = this.config.get('providers.stripe.secretKey');
        if (!key)
            throw new Error('Stripe not configured');
        const body = new URLSearchParams({
            mode: 'payment',
            'payment_intent_data[metadata]': JSON.stringify({ paymentId: input.paymentId }),
            'line_items[0][price_data][currency]': input.currency,
            'line_items[0][price_data][product_data][name]': input.description,
            'line_items[0][price_data][unit_amount]': String(input.amountCents),
            'line_items[0][quantity]': '1',
            'metadata[paymentId]': input.paymentId,
            success_url: input.successUrl,
            cancel_url: input.cancelUrl,
        });
        const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body,
            signal: AbortSignal.timeout(8_000),
        });
        if (!res.ok) {
            const txt = await res.text();
            this.logger.error(`Stripe checkout failed status=${res.status}`);
            throw new Error(`stripe_error:${res.status}:${txt.slice(0, 200)}`);
        }
        const session = (await res.json());
        if (!session.url)
            throw new Error('stripe_missing_url');
        return { providerRef: session.id, checkoutUrl: session.url };
    }
};
exports.StripeProvider = StripeProvider;
exports.StripeProvider = StripeProvider = StripeProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StripeProvider);
//# sourceMappingURL=stripe.provider.js.map