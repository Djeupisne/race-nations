import type { Request } from 'express';
import { z } from 'zod';
import { WalletService } from './wallet.service';
import type { AuthenticatedUser } from '../auth/auth.dto';
declare const PurchaseInputSchema: z.ZodObject<{
    itemRef: z.ZodString;
    quantity: z.ZodDefault<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    itemRef: string;
    quantity: number;
}, {
    itemRef: string;
    quantity?: number | undefined;
}>;
type PurchaseInput = z.infer<typeof PurchaseInputSchema>;
export declare class WalletController {
    private readonly wallet;
    constructor(wallet: WalletService);
    balances(user: AuthenticatedUser): Promise<{
        credits: number;
        gems: number;
        tokens: number;
        hardCents: number;
    }>;
    transactions(user: AuthenticatedUser, query: {
        limit: number;
        cursor?: string;
    }): Promise<{
        items: {
            createdAt: string;
            type: import(".prisma/client").$Enums.WalletTransactionType;
            id: string;
            currencyKind: import(".prisma/client").$Enums.SoftCurrency;
            amountSigned: number;
            balanceAfter: number;
            refType: string | null;
            refId: string | null;
            reversalOfId: string | null;
        }[];
        nextCursor: string | null;
    }>;
    purchase(user: AuthenticatedUser, input: PurchaseInput, req: Request & {
        idempotencyKey?: string;
    }): Promise<{
        transactionId: string;
        balanceAfter: number;
    }>;
    private priceOf;
}
export {};
