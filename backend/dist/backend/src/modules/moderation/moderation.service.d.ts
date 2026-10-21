import { PrismaService } from '../../prisma/prisma.service';
export interface TextVerdict {
    clean: boolean;
    matchedTerms: string[];
    severity: 'none' | 'toxic' | 'cheat_ad' | 'pii';
}
export declare class ModerationService {
    private readonly prisma;
    private readonly logger;
    private readonly lexicon;
    constructor(prisma: PrismaService);
    private normalize;
    filterText(raw: string): TextVerdict;
    queue(limit?: number): Promise<{
        cheatReports: {
            id: string;
            matchId: string;
            invalidReason: string | null;
            receivedAt: Date;
        }[];
    }>;
    reportDetail(payloadId: string): Promise<{
        id: string;
        matchId: string;
        valid: boolean;
        invalidReason: string | null;
        receivedAt: Date;
        body: import("@prisma/client/runtime/library").JsonValue;
    }>;
    dismissReport(payloadId: string, note: string): Promise<void>;
}
