import type { Request } from 'express';
import { z } from 'zod';
import { AdminService } from './admin.service';
import { AuditService } from '../audit/audit.service';
interface AuthedRequest extends Request {
    user?: {
        userId: string;
        playerId: string | null;
        role: 'PLAYER' | 'MODERATOR' | 'ADMIN' | 'SYSTEM';
    };
}
declare const DisputeReasonSchema: z.ZodEnum<["CHEAT_SUSPECTED", "RESULT_MISMATCH", "DISCONNECT_DISPUTE", "SERVER_FAULT", "OTHER"]>;
export declare class AdminController {
    private readonly admin;
    private readonly audit;
    constructor(admin: AdminService, audit: AuditService);
    private actor;
    dashboard(): Promise<{
        fleet: {
            id: string;
            hostname: string;
            region: string;
            status: import(".prisma/client").GameServer["status"];
            activeMatches: number;
            capacity: number;
            stale: boolean;
        }[];
        disputedMarkets: number;
        settlingMarkets: number;
    }>;
    settle(req: AuthedRequest, id: string, body: unknown): Promise<{
        idempotencyKey: string;
        id: string;
        marketId: string;
        totalPool: number;
        netPool: number;
        settledAt: Date;
        houseCut: number;
        payouts: import("@prisma/client/runtime/library").JsonValue;
        residual: number;
        settledBy: string | null;
    }>;
    dispute(req: AuthedRequest, id: string, body: {
        reason: z.infer<typeof DisputeReasonSchema>;
    }): Promise<void>;
    resolve(req: AuthedRequest, id: string, body: unknown): Promise<void>;
    sanction(req: AuthedRequest, body: unknown): Promise<{
        sanctionId: string;
        endsAt: Date | null;
    }>;
    drain(req: AuthedRequest, id: string): Promise<void>;
    getAuditLog(targetType?: string, targetId?: string, limit?: string): Promise<{
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
export {};
