import { PrismaService } from '../../prisma/prisma.service';
import { WalletRepository } from '../wallet/wallet.repository';
export declare class HouseWalletService {
    private readonly prisma;
    private readonly wallet;
    constructor(prisma: PrismaService, wallet: WalletRepository);
    getSnapshot(): Promise<{
        hardCents: number;
        escrowOutstandingCents: number;
        cumulativeFeesCents: number;
        liabilitiesCents: number;
    }>;
    listTransactions(params: {
        limit?: number;
        before?: Date;
    }): Promise<{
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
    reverseTransaction(params: {
        originalTxId: string;
        actorUserId: string;
        reason: string;
    }): Promise<{
        reversalTxId: string;
    }>;
    listSnapshots(days?: number): Promise<{
        id: string;
        balanceCents: number;
        escrowOutstanding: number;
        cumulativeFees: number;
        day: Date;
        takenAt: Date;
    }[]>;
}
