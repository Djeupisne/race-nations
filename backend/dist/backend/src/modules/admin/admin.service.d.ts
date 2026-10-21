import { AuditService } from '../audit/audit.service';
import { BetSettlementService } from '../betting/bet-settlement.service';
import { GameserversService } from '../gameservers/gameservers.service';
import { SanctionsService } from '../sanctions/sanctions.service';
import { PrismaService } from '../../prisma/prisma.service';
export interface AdminActor {
    userId: string;
    role: 'ADMIN' | 'MODERATOR';
    requestId?: string;
}
export declare class AdminService {
    private readonly audit;
    private readonly settlements;
    private readonly gameservers;
    private readonly sanctions;
    private readonly prisma;
    constructor(audit: AuditService, settlements: BetSettlementService, gameservers: GameserversService, sanctions: SanctionsService, prisma: PrismaService);
    private rid;
    manualSettleMarket(actor: AdminActor, params: {
        marketId: string;
        winningSide?: number;
        push?: boolean;
        reason: string;
    }): Promise<{
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
    issueSanction(actor: AdminActor, params: {
        playerId: string;
        type: Parameters<SanctionsService['issue']>[0]['type'];
        reason: string;
        evidenceRef?: string;
    }): Promise<{
        sanctionId: string;
        endsAt: Date | null;
    }>;
    drainServer(actor: AdminActor, serverId: string): Promise<void>;
    openDispute(actor: AdminActor, marketId: string, reason: 'CHEAT_SUSPECTED' | 'RESULT_MISMATCH' | 'DISCONNECT_DISPUTE' | 'SERVER_FAULT' | 'OTHER'): Promise<void>;
    resolveDispute(actor: AdminActor, marketId: string, outcome: 'REFUND_ALL' | 'UPHELD', note: string): Promise<void>;
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
}
