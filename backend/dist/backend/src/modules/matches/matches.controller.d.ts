import { type JoinMatchInput } from '@race-nations/api-contracts';
import type { AuthenticatedUser } from '../auth/auth.dto';
import { MatchesService } from './matches.service';
import { MatchSettlementService } from './match-settlement.service';
export declare class MatchesController {
    private readonly matches;
    private readonly settlement;
    constructor(matches: MatchesService, settlement: MatchSettlementService);
    get(id: string): Promise<{
        players: ({
            player: {
                id: string;
                username: string;
                nationality: string;
                plPoints: number;
            };
        } & {
            id: string;
            playerId: string;
            matchId: string;
            position: number | null;
            outcome: import(".prisma/client").$Enums.MatchOutcome | null;
            finishMs: number | null;
            bestLapMs: number | null;
            driftPoints: number;
            plDelta: number;
            disconnectedAt: Date | null;
            reconnectDeadlineAt: Date | null;
            rewardsCredits: number;
            rewardsGems: number;
            rewardsXp: number;
            rewardsTokens: number;
            joinedAt: Date;
        })[];
    } & {
        status: import(".prisma/client").$Enums.MatchStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        mode: import(".prisma/client").$Enums.QueueMode;
        trackId: string;
        weather: string | null;
        serverId: string | null;
        startedAt: Date | null;
        finishedAt: Date | null;
        validatedAt: Date | null;
        invalidatedReason: string | null;
    }>;
    history(user: AuthenticatedUser, limit?: string, cursor?: string): Promise<{
        items: ({
            players: {
                id: string;
                playerId: string;
                matchId: string;
                position: number | null;
                outcome: import(".prisma/client").$Enums.MatchOutcome | null;
                finishMs: number | null;
                bestLapMs: number | null;
                driftPoints: number;
                plDelta: number;
                disconnectedAt: Date | null;
                reconnectDeadlineAt: Date | null;
                rewardsCredits: number;
                rewardsGems: number;
                rewardsXp: number;
                rewardsTokens: number;
                joinedAt: Date;
            }[];
        } & {
            status: import(".prisma/client").$Enums.MatchStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            mode: import(".prisma/client").$Enums.QueueMode;
            trackId: string;
            weather: string | null;
            serverId: string | null;
            startedAt: Date | null;
            finishedAt: Date | null;
            validatedAt: Date | null;
            invalidatedReason: string | null;
        })[];
        nextCursor: string | null;
    }>;
    join(id: string, user: AuthenticatedUser, body: JoinMatchInput): Promise<{
        status: import(".prisma/client").$Enums.MatchStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        mode: import(".prisma/client").$Enums.QueueMode;
        trackId: string;
        weather: string | null;
        serverId: string | null;
        startedAt: Date | null;
        finishedAt: Date | null;
        validatedAt: Date | null;
        invalidatedReason: string | null;
    }>;
    statusReport(id: string, body: {
        status: 'LOADING' | 'IN_PROGRESS' | 'FINISHED';
    }): Promise<{
        status: import(".prisma/client").$Enums.MatchStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        mode: import(".prisma/client").$Enums.QueueMode;
        trackId: string;
        weather: string | null;
        serverId: string | null;
        startedAt: Date | null;
        finishedAt: Date | null;
        validatedAt: Date | null;
        invalidatedReason: string | null;
    }>;
    invalidateByServer(id: string, body: {
        reason: string;
    }): Promise<{
        status: import(".prisma/client").$Enums.MatchStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        mode: import(".prisma/client").$Enums.QueueMode;
        trackId: string;
        weather: string | null;
        serverId: string | null;
        startedAt: Date | null;
        finishedAt: Date | null;
        validatedAt: Date | null;
        invalidatedReason: string | null;
    }>;
    manualSettle(id: string): Promise<{
        ok: boolean;
    }>;
}
