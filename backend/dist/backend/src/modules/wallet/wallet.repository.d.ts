import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export type CurrencyColumn = 'credits' | 'gems' | 'tokens' | 'hardCents';
export interface LedgerEntry {
    id: string;
    walletId: string;
    type: Prisma.EnumWalletTransactionTypeFilter['equals'] extends never ? string : string;
    currencyKind: CurrencyColumn extends infer _ ? string : string;
    amountSigned: number;
    balanceAfter: number;
    idempotencyKey: string;
}
export declare class WalletRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private lockWallet;
    findTxByIdempotencyKey(idempotencyKey: string): Promise<{
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
    } | null>;
    debit(tx: Prisma.TransactionClient, params: {
        walletId: string;
        column: CurrencyColumn;
        amount: number;
        type: 'PURCHASE' | 'BET_ESCROW' | 'REVERSAL' | 'HOUSE_REVERSAL' | 'ADMIN_ADJUSTMENT';
        idempotencyKey: string;
        refType?: string;
        refId?: string;
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
    credit(tx: Prisma.TransactionClient, params: {
        walletId: string;
        column: CurrencyColumn;
        amount: number;
        type: 'DEPOSIT' | 'REWARD' | 'BET_PAYOUT' | 'BET_REFUND' | 'HOUSE_FEE' | 'HOUSE_REVERSAL' | 'REVERSAL' | 'ADMIN_ADJUSTMENT';
        idempotencyKey: string;
        refType?: string;
        refId?: string;
        reversalOfId?: string;
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
    transfer(tx: Prisma.TransactionClient, params: {
        fromWalletId: string;
        toWalletId: string;
        column: CurrencyColumn;
        amount: number;
        debitType: 'BET_ESCROW' | 'PURCHASE' | 'HOUSE_REVERSAL';
        creditType: 'BET_PAYOUT' | 'BET_REFUND' | 'HOUSE_FEE' | 'DEPOSIT';
        debitKey: string;
        creditKey: string;
        refType?: string;
        refId?: string;
    }): Promise<void>;
    getBalances(walletId: string): Promise<{
        id: string;
        credits: number;
        gems: number;
        tokens: number;
        hardCents: number;
    }>;
    getHouseWalletId(tx?: Prisma.TransactionClient): Promise<string>;
    getOrCreatePlayerWallet(tx: Prisma.TransactionClient, playerId: string): Promise<string>;
    private appendTx;
}
