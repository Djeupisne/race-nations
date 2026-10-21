export declare class AppleStoreProvider {
    private readonly logger;
    verifyTransaction(transactionId: string): Promise<{
        ok: boolean;
        productId?: string;
        bundleId?: string;
    }>;
}
