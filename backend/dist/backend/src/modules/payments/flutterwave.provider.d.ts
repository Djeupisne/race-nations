import { ConfigService } from '@nestjs/config';
export declare class FlutterwaveProvider {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService);
    initiateTransfer(paymentId: string, amountCents: number, currency: string, email: string): Promise<{
        flwRef: string;
        link: string;
    }>;
}
