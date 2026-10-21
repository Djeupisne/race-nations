import type { MatchmakingTicket, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { type Clock } from '../../common/utils/clock';
export declare class MatchmakingService {
    private readonly prisma;
    private readonly clock;
    private readonly logger;
    constructor(prisma: PrismaService, clock: Clock);
    enqueue(playerId: string, mode: string, preferredTrackId?: string): Promise<{
        ticketId: string;
        estimatedWaitMs: number;
    }>;
    ticket(ticketId: string, ownerId: string): Promise<MatchmakingTicket & {
        queuePosition: number | null;
    }>;
    cancel(ticketId: string, playerId: string, reason?: string): Promise<MatchmakingTicket>;
    myActiveTickets(playerId: string): Promise<{
        status: import(".prisma/client").$Enums.TicketStatus;
        id: string;
        playerId: string;
        mode: import(".prisma/client").$Enums.QueueMode;
        plAtQueue: number;
        matchId: string | null;
        requestedAt: Date;
        matchedAt: Date | null;
        expiresAt: Date | null;
        cancelReason: string | null;
    }[]>;
    queueStats(): Promise<Array<{
        mode: string;
        depth: number;
    }>>;
    findCandidates(plCenter: number, plWindow: number, excludeTicketId: string, mode: string, limit?: number): Promise<Prisma.PickEnumerable<MatchmakingTicket, 'id' | 'playerId' | 'plAtQueue'>[]>;
}
