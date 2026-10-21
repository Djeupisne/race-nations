import type { Payment } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { type Clock } from '../../common/utils/clock';
export interface CreateCheckoutParams {
    playerId: string;
    amountCents: number;
    currencyCode: string;
    jurisdiction: string;
    provider: 'STRIPE' | 'FLUTTERWAVE';
    idempotencyKey: string;
}
export declare class PaymentsService {
    private readonly prisma;
    private readonly wallet;
    private readonly clock;
    constructor(prisma: PrismaService, wallet: WalletService, clock: Clock);
    createCheckout(params: CreateCheckoutParams): Promise<{
        paymentId: string;
        providerRef: string;
        checkoutUrl: string;
        status: Payment['status'];
    }>;
    markSucceeded(paymentId: string, providerRef: string): Promise<void>;
    markTerminalFailure(paymentId: string, to: 'FAILED' | 'CANCELLED'): Promise<void>;
    getStatus(playerId: string, paymentId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        amountCents: number;
        currencyCode: string;
        provider: import(".prisma/client").$Enums.PaymentProvider;
    }>;
    listForPlayer(playerId: string, query: {
        limit: number;
        cursor?: string;
    }): Promise<{
        items: {
            status: import(".prisma/client").$Enums.PaymentStatus;
            idempotencyKey: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            playerId: string;
            provider: import(".prisma/client").$Enums.PaymentProvider;
            amountCents: number;
            currencyCode: string;
            jurisdiction: string;
            providerRef: string | null;
            succeededAt: Date | null;
        }[];
        nextCursor: string | null;
    }>;
    private depositsPaused;
    private createProviderIntent;
}
