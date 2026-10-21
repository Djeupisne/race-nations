import type { Request } from 'express';
import { ModerationService } from './moderation.service';
import { AuditService } from '../audit/audit.service';
export declare class ModerationController {
    private readonly moderation;
    private readonly audit;
    constructor(moderation: ModerationService, audit: AuditService);
    queue(query: unknown): Promise<{
        cheatReports: {
            id: string;
            matchId: string;
            invalidReason: string | null;
            receivedAt: Date;
        }[];
    }>;
    detail(id: string): Promise<{
        id: string;
        matchId: string;
        valid: boolean;
        invalidReason: string | null;
        receivedAt: Date;
        body: import("@prisma/client/runtime/library").JsonValue;
    }>;
    dismiss(req: Request & {
        user?: {
            userId: string;
        };
    }, id: string, body: unknown): Promise<{
        ok: boolean;
    }>;
    filterTest(body: unknown): import("./moderation.service").TextVerdict;
}
