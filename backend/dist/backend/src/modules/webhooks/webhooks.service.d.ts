import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { VerifierRegistry } from './verifiers/verifier.registry';
export interface IngestResult {
    accepted: boolean;
    duplicate: boolean;
    eventId: string;
    reason?: string;
}
export declare class WebhooksService {
    private readonly prisma;
    private readonly payments;
    private readonly registry;
    private readonly logger;
    constructor(prisma: PrismaService, payments: PaymentsService, registry: VerifierRegistry);
    ingest(path: string, req: Request): Promise<IngestResult>;
    private runBusiness;
    recent(provider: string | undefined, limit: number): Promise<{
        id: string;
        receivedAt: Date;
        provider: string;
        externalId: string;
        signatureValid: boolean;
        processedAt: Date | null;
        failureReason: string | null;
    }[]>;
}
