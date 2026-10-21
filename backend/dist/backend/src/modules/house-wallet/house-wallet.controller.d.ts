import type { Request } from 'express';
import { HouseWalletService } from './house-wallet.service';
interface AuthedRequest extends Request {
    user?: {
        userId: string;
        playerId: string | null;
        role: string;
    };
}
export declare class HouseWalletController {
    private readonly house;
    constructor(house: HouseWalletService);
    snapshot(): Promise<{
        hardCents: number;
        escrowOutstandingCents: number;
        cumulativeFeesCents: number;
        liabilitiesCents: number;
    }>;
    transactions(limit?: string, before?: string): Promise<{
        type: import(".prisma/client").$Enums.WalletTransactionType;
        idempotencyKey: string;
        id: string;
        createdAt: Date;
        currencyKind: import(".prisma/client").$Enums.SoftCurrency;
        amountSigned: number;
        balanceAfter: number;
        refType: string | null;
        refId: string | null;
    }[]>;
    snapshots(days?: string): Promise<{
        id: string;
        balanceCents: number;
        escrowOutstanding: number;
        cumulativeFees: number;
        day: Date;
        takenAt: Date;
    }[]>;
    reverse(req: AuthedRequest, body: {
        originalTxId: string;
        reason: string;
    }, _p: unknown): Promise<{
        reversalTxId: string;
    }>;
}
export {};
