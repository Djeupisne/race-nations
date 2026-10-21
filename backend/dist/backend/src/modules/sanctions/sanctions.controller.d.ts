import type { Request } from 'express';
import { SanctionsService } from './sanctions.service';
export declare class SanctionsController {
    private readonly sanctions;
    constructor(sanctions: SanctionsService);
    private user;
    mine(req: Request): Promise<{
        status: import(".prisma/client").$Enums.SanctionStatus;
        type: import(".prisma/client").$Enums.SanctionType;
        id: string;
        createdAt: Date;
        reason: string;
        startsAt: Date;
        endsAt: Date | null;
    }[]>;
    appeal(req: Request, id: string, body: unknown): Promise<{
        ok: boolean;
    }>;
    issue(req: Request, body: unknown): Promise<{
        sanctionId: string;
        endsAt: Date | null;
    }>;
    decide(id: string, body: unknown): Promise<{
        ok: boolean;
    }>;
    lift(id: string): Promise<{
        ok: boolean;
    }>;
}
