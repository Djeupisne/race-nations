import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { type Clock } from '../../common/utils/clock';
import { WalletRepository, type CurrencyColumn } from './wallet.repository';
export interface RewardBundle {
    credits: number;
    gems: number;
    xp: number;
    tokens: number;
}
export declare class WalletService {
    private readonly prisma;
    private readonly repo;
    private readonly clock;
    constructor(prisma: PrismaService, repo: WalletRepository, clock: Clock);
    balances(playerId: string): Promise<{
        credits: number;
        gems: number;
        tokens: number;
        hardCents: number;
    }>;
    transactions(playerId: string, query: {
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
    creditRaceRewards(playerId: string, matchId: string, rewards: RewardBundle): Promise<void>;
    creditDeposit(tx: Prisma.TransactionClient, playerId: string, amountCents: number, paymentId: string): Promise<{
        type: import(".prisma/client").$Enums.WalletTransactionType;
        walletId: string;
        idempotencyKey: string;
        id: string;
        createdAt: Date;
        currencyKind: import(".prisma/client").$Enums.SoftCurrency;
        amountSigned: number;
        balanceAfter: number;
        refType: string | null;
        refId: string | null;
        reversalOfId: string | null;
    }>;
    purchase(playerId: string, params: {
        column: Extract<CurrencyColumn, 'credits' | 'gems'>;
        amount: number;
        itemRef: string;
        idempotencyKey: string;
    }): Promise<{
        transactionId: string;
        balanceAfter: number;
    }>;
    adminAdjust(playerId: string, params: {
        column: CurrencyColumn;
        deltaSigned: number;
        reason: string;
        idempotencyKey: string;
    }): Promise<{
        type: import(".prisma/client").$Enums.WalletTransactionType;
        walletId: string;
        idempotencyKey: string;
        id: string;
        createdAt: Date;
        currencyKind: import(".prisma/client").$Enums.SoftCurrency;
        amountSigned: number;
        balanceAfter: number;
        refType: string | null;
        refId: string | null;
        reversalOfId: string | null;
    }>;
    private getWalletOf;
}
