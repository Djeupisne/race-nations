import type { Request } from 'express';
import { z } from 'zod';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.dto';
declare const CheckoutInputSchema: z.ZodObject<{
    amountCents: z.ZodNumber;
    currencyCode: z.ZodDefault<z.ZodEnum<["EUR", "NGN", "MAD", "GHS", "KES"]>>;
    provider: z.ZodEnum<["STRIPE", "FLUTTERWAVE"]>;
}, "strict", z.ZodTypeAny, {
    provider: "STRIPE" | "FLUTTERWAVE";
    amountCents: number;
    currencyCode: "EUR" | "NGN" | "MAD" | "GHS" | "KES";
}, {
    provider: "STRIPE" | "FLUTTERWAVE";
    amountCents: number;
    currencyCode?: "EUR" | "NGN" | "MAD" | "GHS" | "KES" | undefined;
}>;
type CheckoutInput = z.infer<typeof CheckoutInputSchema>;
export declare class PaymentsController {
    private readonly payments;
    private readonly prisma;
    constructor(payments: PaymentsService, prisma: PrismaService);
    checkout(user: AuthenticatedUser, input: CheckoutInput, req: Request & {
        idempotencyKey?: string;
    }): Promise<{
        paymentId: string;
        providerRef: string;
        checkoutUrl: string;
        status: import(".prisma/client").Payment["status"];
    }>;
    list(user: AuthenticatedUser, query: {
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
    status(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        amountCents: number;
        currencyCode: string;
        provider: import(".prisma/client").$Enums.PaymentProvider;
    }>;
}
export {};
