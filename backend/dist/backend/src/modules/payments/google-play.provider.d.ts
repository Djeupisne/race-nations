import { ConfigService } from '@nestjs/config';
export declare class GooglePlayProvider {
    private readonly config;
    private readonly logger;
    private token;
    constructor(config: ConfigService);
    verifyPurchase(packageName: string, sku: string, purchaseToken: string): Promise<{
        ok: boolean;
        orderId?: string;
        purchaseState?: number;
    } | null>;
    acknowledge(packageName: string, sku: string, purchaseToken: string): Promise<void>;
    private getAccessToken;
}
