import { ConfigService } from '@nestjs/config';
export interface CreateCheckoutInput {
    paymentId: string;
    amountCents: number;
    currency: string;
    description: string;
    successUrl: string;
    cancelUrl: string;
}
export interface CreateCheckoutResult {
    providerRef: string;
    checkoutUrl: string;
}
export declare class StripeProvider {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService);
    get enabled(): boolean;
    createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
}
