import { PrismaService } from '../../prisma/prisma.service';
export interface AuditEvent {
    actorUserId: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: Record<string, unknown>;
    requestId: string;
}
export declare class AuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    record(event: AuditEvent): Promise<{
        auditId: string;
    }>;
    search(params: {
        actorUserId?: string;
        action?: string;
        targetType?: string;
        targetId?: string;
        from?: Date;
        to?: Date;
        limit?: number;
    }): Promise<{
        id: string;
        requestId: string;
        createdAt: Date;
        action: string;
        targetType: string;
        targetId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        actorId: string;
    }[]>;
    forMarket(marketId: string): Promise<{
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
