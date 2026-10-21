import type { Match } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { type Clock } from '../../common/utils/clock';
export declare class MatchesService {
    private readonly prisma;
    private readonly clock;
    private readonly logger;
    constructor(prisma: PrismaService, clock: Clock);
    getMatch(matchId: string): Promise<{
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
    historyForPlayer(playerId: string, query: {
        limit: number;
        cursor?: string;
    }): Promise<{
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
    join(matchId: string, playerId: string): Promise<Match>;
    updateStatusFromServer(matchId: string, to: 'LOADING' | 'IN_PROGRESS' | 'FINISHED'): Promise<Match>;
    markValidated(matchId: string, rows: Array<{
        playerId: string;
        position: number;
        finishMs: number;
        bestLapMs?: number;
        driftPoints?: number;
    }>): Promise<Match>;
    invalidate(matchId: string, reason: string): Promise<Match>;
    releaseServer(serverId: string): Promise<void>;
}
