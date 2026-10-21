import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly audit;
    constructor(audit: AuditService);
    search(actor?: string, action?: string, targetType?: string, targetId?: string, from?: string, to?: string, limit?: string): Promise<{
        id: string;
        requestId: string;
        createdAt: Date;
        action: string;
        targetType: string;
        targetId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        actorId: string;
    }[]>;
}
