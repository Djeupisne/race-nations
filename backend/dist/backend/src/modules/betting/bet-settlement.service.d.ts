import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletRepository } from '../wallet/wallet.repository';
export interface SettleParams {
    marketId: string;
    winningSide?: number;
    push?: boolean;
    settledById?: string;
}
export declare class BetSettlementService {
    private readonly prisma;
    private readonly wallet;
    private readonly logger;
    constructor(prisma: PrismaService, wallet: WalletRepository);
    settleMarket(params: SettleParams): Promise<Prisma.BetSettlementGetPayload<object>>;
    openDispute(marketId: string, reason: 'CHEAT_SUSPECTED' | 'RESULT_MISMATCH' | 'DISCONNECT_DISPUTE' | 'SERVER_FAULT' | 'OTHER'): Promise<void>;
    resolveDispute(marketId: string, outcome: 'REFUND_ALL' | 'UPHELD'): Promise<void>;
}
