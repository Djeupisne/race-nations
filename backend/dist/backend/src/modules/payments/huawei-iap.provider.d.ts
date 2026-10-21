export declare class HuaweiIapProvider {
    private readonly logger;
    verifyPurchase(purchaseToken: string, productId: string): Promise<{
        ok: boolean;
        orderId?: string;
    }>;
}
