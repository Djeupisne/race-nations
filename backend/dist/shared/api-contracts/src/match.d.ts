import { z } from 'zod';
export declare const EnqueueInputSchema: z.ZodObject<{
    mode: z.ZodEnum<["RANKED_1V1", "RANKED_FFA", "QUICK_RACE", "BATTLE_ROYALE", "TOURNAMENT", "CLAN_WARS", "PRACTICE"]>;
    preferredTrackId: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    mode: "RANKED_1V1" | "RANKED_FFA" | "QUICK_RACE" | "BATTLE_ROYALE" | "TOURNAMENT" | "CLAN_WARS" | "PRACTICE";
    preferredTrackId?: string | undefined;
}, {
    mode: "RANKED_1V1" | "RANKED_FFA" | "QUICK_RACE" | "BATTLE_ROYALE" | "TOURNAMENT" | "CLAN_WARS" | "PRACTICE";
    preferredTrackId?: string | undefined;
}>;
export type EnqueueInput = z.infer<typeof EnqueueInputSchema>;
export declare const TicketDtoSchema: z.ZodObject<{
    id: z.ZodString;
    playerId: z.ZodString;
    mode: z.ZodEnum<["RANKED_1V1", "RANKED_FFA", "QUICK_RACE", "BATTLE_ROYALE", "TOURNAMENT", "CLAN_WARS", "PRACTICE"]>;
    status: z.ZodEnum<["QUEUED", "MATCHED", "JOINED", "COMPLETED", "CANCELLED", "EXPIRED"]>;
    plAtQueue: z.ZodNumber;
    matchId: z.ZodNullable<z.ZodString>;
    requestedAt: z.ZodString;
    matchedAt: z.ZodNullable<z.ZodString>;
    expiresAt: z.ZodNullable<z.ZodString>;
    queuePosition: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: "QUEUED" | "MATCHED" | "JOINED" | "COMPLETED" | "CANCELLED" | "EXPIRED";
    id: string;
    playerId: string;
    mode: "RANKED_1V1" | "RANKED_FFA" | "QUICK_RACE" | "BATTLE_ROYALE" | "TOURNAMENT" | "CLAN_WARS" | "PRACTICE";
    plAtQueue: number;
    matchId: string | null;
    requestedAt: string;
    matchedAt: string | null;
    expiresAt: string | null;
    queuePosition: number | null;
}, {
    status: "QUEUED" | "MATCHED" | "JOINED" | "COMPLETED" | "CANCELLED" | "EXPIRED";
    id: string;
    playerId: string;
    mode: "RANKED_1V1" | "RANKED_FFA" | "QUICK_RACE" | "BATTLE_ROYALE" | "TOURNAMENT" | "CLAN_WARS" | "PRACTICE";
    plAtQueue: number;
    matchId: string | null;
    requestedAt: string;
    matchedAt: string | null;
    expiresAt: string | null;
    queuePosition: number | null;
}>;
export type TicketDto = z.infer<typeof TicketDtoSchema>;
export declare const MatchPlayerDtoSchema: z.ZodObject<{
    playerId: z.ZodString;
    username: z.ZodString;
    nationality: z.ZodString;
    position: z.ZodNullable<z.ZodNumber>;
    outcome: z.ZodNullable<z.ZodEnum<["VICTORY", "DEFEAT", "DRAW", "ABANDON", "DISQUALIFIED"]>>;
    finishMs: z.ZodNullable<z.ZodNumber>;
    bestLapMs: z.ZodNullable<z.ZodNumber>;
    driftPoints: z.ZodNumber;
    rewards: z.ZodObject<{
        credits: z.ZodNumber;
        gems: z.ZodNumber;
        xp: z.ZodNumber;
        tokens: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        credits: number;
        gems: number;
        tokens: number;
        xp: number;
    }, {
        credits: number;
        gems: number;
        tokens: number;
        xp: number;
    }>;
    plDelta: z.ZodNumber;
    disconnectedAt: z.ZodNullable<z.ZodString>;
    reconnectDeadlineAt: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    username: string;
    nationality: string;
    playerId: string;
    position: number | null;
    outcome: "VICTORY" | "DEFEAT" | "DRAW" | "ABANDON" | "DISQUALIFIED" | null;
    finishMs: number | null;
    bestLapMs: number | null;
    driftPoints: number;
    rewards: {
        credits: number;
        gems: number;
        tokens: number;
        xp: number;
    };
    plDelta: number;
    disconnectedAt: string | null;
    reconnectDeadlineAt: string | null;
}, {
    username: string;
    nationality: string;
    playerId: string;
    position: number | null;
    outcome: "VICTORY" | "DEFEAT" | "DRAW" | "ABANDON" | "DISQUALIFIED" | null;
    finishMs: number | null;
    bestLapMs: number | null;
    driftPoints: number;
    rewards: {
        credits: number;
        gems: number;
        tokens: number;
        xp: number;
    };
    plDelta: number;
    disconnectedAt: string | null;
    reconnectDeadlineAt: string | null;
}>;
export type MatchPlayerDto = z.infer<typeof MatchPlayerDtoSchema>;
export declare const MatchDtoSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodEnum<["WAITING_FOR_PLAYERS", "LOADING", "IN_PROGRESS", "FINISHED", "FINISHED_VALIDATED", "INVALIDATED"]>;
    mode: z.ZodEnum<["RANKED_1V1", "RANKED_FFA", "QUICK_RACE", "BATTLE_ROYALE", "TOURNAMENT", "CLAN_WARS", "PRACTICE"]>;
    trackId: z.ZodString;
    weather: z.ZodNullable<z.ZodString>;
    serverId: z.ZodNullable<z.ZodString>;
    startedAt: z.ZodNullable<z.ZodString>;
    finishedAt: z.ZodNullable<z.ZodString>;
    validatedAt: z.ZodNullable<z.ZodString>;
    invalidatedReason: z.ZodNullable<z.ZodString>;
    players: z.ZodArray<z.ZodObject<{
        playerId: z.ZodString;
        username: z.ZodString;
        nationality: z.ZodString;
        position: z.ZodNullable<z.ZodNumber>;
        outcome: z.ZodNullable<z.ZodEnum<["VICTORY", "DEFEAT", "DRAW", "ABANDON", "DISQUALIFIED"]>>;
        finishMs: z.ZodNullable<z.ZodNumber>;
        bestLapMs: z.ZodNullable<z.ZodNumber>;
        driftPoints: z.ZodNumber;
        rewards: z.ZodObject<{
            credits: z.ZodNumber;
            gems: z.ZodNumber;
            xp: z.ZodNumber;
            tokens: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            credits: number;
            gems: number;
            tokens: number;
            xp: number;
        }, {
            credits: number;
            gems: number;
            tokens: number;
            xp: number;
        }>;
        plDelta: z.ZodNumber;
        disconnectedAt: z.ZodNullable<z.ZodString>;
        reconnectDeadlineAt: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        username: string;
        nationality: string;
        playerId: string;
        position: number | null;
        outcome: "VICTORY" | "DEFEAT" | "DRAW" | "ABANDON" | "DISQUALIFIED" | null;
        finishMs: number | null;
        bestLapMs: number | null;
        driftPoints: number;
        rewards: {
            credits: number;
            gems: number;
            tokens: number;
            xp: number;
        };
        plDelta: number;
        disconnectedAt: string | null;
        reconnectDeadlineAt: string | null;
    }, {
        username: string;
        nationality: string;
        playerId: string;
        position: number | null;
        outcome: "VICTORY" | "DEFEAT" | "DRAW" | "ABANDON" | "DISQUALIFIED" | null;
        finishMs: number | null;
        bestLapMs: number | null;
        driftPoints: number;
        rewards: {
            credits: number;
            gems: number;
            tokens: number;
            xp: number;
        };
        plDelta: number;
        disconnectedAt: string | null;
        reconnectDeadlineAt: string | null;
    }>, "many">;
    betMarketIds: z.ZodArray<z.ZodString, "many">;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "WAITING_FOR_PLAYERS" | "LOADING" | "IN_PROGRESS" | "FINISHED" | "FINISHED_VALIDATED" | "INVALIDATED";
    id: string;
    createdAt: string;
    mode: "RANKED_1V1" | "RANKED_FFA" | "QUICK_RACE" | "BATTLE_ROYALE" | "TOURNAMENT" | "CLAN_WARS" | "PRACTICE";
    trackId: string;
    weather: string | null;
    serverId: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    validatedAt: string | null;
    invalidatedReason: string | null;
    players: {
        username: string;
        nationality: string;
        playerId: string;
        position: number | null;
        outcome: "VICTORY" | "DEFEAT" | "DRAW" | "ABANDON" | "DISQUALIFIED" | null;
        finishMs: number | null;
        bestLapMs: number | null;
        driftPoints: number;
        rewards: {
            credits: number;
            gems: number;
            tokens: number;
            xp: number;
        };
        plDelta: number;
        disconnectedAt: string | null;
        reconnectDeadlineAt: string | null;
    }[];
    betMarketIds: string[];
}, {
    status: "WAITING_FOR_PLAYERS" | "LOADING" | "IN_PROGRESS" | "FINISHED" | "FINISHED_VALIDATED" | "INVALIDATED";
    id: string;
    createdAt: string;
    mode: "RANKED_1V1" | "RANKED_FFA" | "QUICK_RACE" | "BATTLE_ROYALE" | "TOURNAMENT" | "CLAN_WARS" | "PRACTICE";
    trackId: string;
    weather: string | null;
    serverId: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    validatedAt: string | null;
    invalidatedReason: string | null;
    players: {
        username: string;
        nationality: string;
        playerId: string;
        position: number | null;
        outcome: "VICTORY" | "DEFEAT" | "DRAW" | "ABANDON" | "DISQUALIFIED" | null;
        finishMs: number | null;
        bestLapMs: number | null;
        driftPoints: number;
        rewards: {
            credits: number;
            gems: number;
            tokens: number;
            xp: number;
        };
        plDelta: number;
        disconnectedAt: string | null;
        reconnectDeadlineAt: string | null;
    }[];
    betMarketIds: string[];
}>;
export type MatchDto = z.infer<typeof MatchDtoSchema>;
export declare const MatchSummaryDtoSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodEnum<["WAITING_FOR_PLAYERS", "LOADING", "IN_PROGRESS", "FINISHED", "FINISHED_VALIDATED", "INVALIDATED"]>;
    mode: z.ZodEnum<["RANKED_1V1", "RANKED_FFA", "QUICK_RACE", "BATTLE_ROYALE", "TOURNAMENT", "CLAN_WARS", "PRACTICE"]>;
    trackId: z.ZodString;
    playerCount: z.ZodNumber;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "WAITING_FOR_PLAYERS" | "LOADING" | "IN_PROGRESS" | "FINISHED" | "FINISHED_VALIDATED" | "INVALIDATED";
    id: string;
    createdAt: string;
    mode: "RANKED_1V1" | "RANKED_FFA" | "QUICK_RACE" | "BATTLE_ROYALE" | "TOURNAMENT" | "CLAN_WARS" | "PRACTICE";
    trackId: string;
    playerCount: number;
}, {
    status: "WAITING_FOR_PLAYERS" | "LOADING" | "IN_PROGRESS" | "FINISHED" | "FINISHED_VALIDATED" | "INVALIDATED";
    id: string;
    createdAt: string;
    mode: "RANKED_1V1" | "RANKED_FFA" | "QUICK_RACE" | "BATTLE_ROYALE" | "TOURNAMENT" | "CLAN_WARS" | "PRACTICE";
    trackId: string;
    playerCount: number;
}>;
export type MatchSummaryDto = z.infer<typeof MatchSummaryDtoSchema>;
export declare const JoinMatchInputSchema: z.ZodObject<{
    ticketId: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    ticketId?: string | undefined;
}, {
    ticketId?: string | undefined;
}>;
export type JoinMatchInput = z.infer<typeof JoinMatchInputSchema>;
export declare const ReconnectInputSchema: z.ZodObject<{
    matchId: z.ZodString;
    sessionNonce: z.ZodString;
}, "strict", z.ZodTypeAny, {
    matchId: string;
    sessionNonce: string;
}, {
    matchId: string;
    sessionNonce: string;
}>;
export type ReconnectInput = z.infer<typeof ReconnectInputSchema>;
export declare const ResultRowSchema: z.ZodObject<{
    playerId: z.ZodString;
    position: z.ZodNumber;
    finishMs: z.ZodNumber;
    bestLapMs: z.ZodNumber;
    driftPoints: z.ZodNumber;
    maxSpeedKmh: z.ZodNumber;
    perfectRace: z.ZodDefault<z.ZodBoolean>;
    checkpoints: z.ZodArray<z.ZodNumber, "many">;
    disconnectedMs: z.ZodDefault<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    playerId: string;
    position: number;
    finishMs: number;
    bestLapMs: number;
    driftPoints: number;
    maxSpeedKmh: number;
    perfectRace: boolean;
    checkpoints: number[];
    disconnectedMs: number;
}, {
    playerId: string;
    position: number;
    finishMs: number;
    bestLapMs: number;
    driftPoints: number;
    maxSpeedKmh: number;
    checkpoints: number[];
    perfectRace?: boolean | undefined;
    disconnectedMs?: number | undefined;
}>;
export type ResultRow = z.infer<typeof ResultRowSchema>;
export declare const RaceResultBodySchema: z.ZodObject<{
    matchId: z.ZodString;
    serverId: z.ZodString;
    nonce: z.ZodString;
    timestampMs: z.ZodNumber;
    rows: z.ZodArray<z.ZodObject<{
        playerId: z.ZodString;
        position: z.ZodNumber;
        finishMs: z.ZodNumber;
        bestLapMs: z.ZodNumber;
        driftPoints: z.ZodNumber;
        maxSpeedKmh: z.ZodNumber;
        perfectRace: z.ZodDefault<z.ZodBoolean>;
        checkpoints: z.ZodArray<z.ZodNumber, "many">;
        disconnectedMs: z.ZodDefault<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        playerId: string;
        position: number;
        finishMs: number;
        bestLapMs: number;
        driftPoints: number;
        maxSpeedKmh: number;
        perfectRace: boolean;
        checkpoints: number[];
        disconnectedMs: number;
    }, {
        playerId: string;
        position: number;
        finishMs: number;
        bestLapMs: number;
        driftPoints: number;
        maxSpeedKmh: number;
        checkpoints: number[];
        perfectRace?: boolean | undefined;
        disconnectedMs?: number | undefined;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    matchId: string;
    serverId: string;
    nonce: string;
    timestampMs: number;
    rows: {
        playerId: string;
        position: number;
        finishMs: number;
        bestLapMs: number;
        driftPoints: number;
        maxSpeedKmh: number;
        perfectRace: boolean;
        checkpoints: number[];
        disconnectedMs: number;
    }[];
}, {
    matchId: string;
    serverId: string;
    nonce: string;
    timestampMs: number;
    rows: {
        playerId: string;
        position: number;
        finishMs: number;
        bestLapMs: number;
        driftPoints: number;
        maxSpeedKmh: number;
        checkpoints: number[];
        perfectRace?: boolean | undefined;
        disconnectedMs?: number | undefined;
    }[];
}>;
export type RaceResultBody = z.infer<typeof RaceResultBodySchema>;
export declare const GameServerResultEnvelopeSchema: z.ZodObject<{
    body: z.ZodObject<{
        matchId: z.ZodString;
        serverId: z.ZodString;
        nonce: z.ZodString;
        timestampMs: z.ZodNumber;
        rows: z.ZodArray<z.ZodObject<{
            playerId: z.ZodString;
            position: z.ZodNumber;
            finishMs: z.ZodNumber;
            bestLapMs: z.ZodNumber;
            driftPoints: z.ZodNumber;
            maxSpeedKmh: z.ZodNumber;
            perfectRace: z.ZodDefault<z.ZodBoolean>;
            checkpoints: z.ZodArray<z.ZodNumber, "many">;
            disconnectedMs: z.ZodDefault<z.ZodNumber>;
        }, "strict", z.ZodTypeAny, {
            playerId: string;
            position: number;
            finishMs: number;
            bestLapMs: number;
            driftPoints: number;
            maxSpeedKmh: number;
            perfectRace: boolean;
            checkpoints: number[];
            disconnectedMs: number;
        }, {
            playerId: string;
            position: number;
            finishMs: number;
            bestLapMs: number;
            driftPoints: number;
            maxSpeedKmh: number;
            checkpoints: number[];
            perfectRace?: boolean | undefined;
            disconnectedMs?: number | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        matchId: string;
        serverId: string;
        nonce: string;
        timestampMs: number;
        rows: {
            playerId: string;
            position: number;
            finishMs: number;
            bestLapMs: number;
            driftPoints: number;
            maxSpeedKmh: number;
            perfectRace: boolean;
            checkpoints: number[];
            disconnectedMs: number;
        }[];
    }, {
        matchId: string;
        serverId: string;
        nonce: string;
        timestampMs: number;
        rows: {
            playerId: string;
            position: number;
            finishMs: number;
            bestLapMs: number;
            driftPoints: number;
            maxSpeedKmh: number;
            checkpoints: number[];
            perfectRace?: boolean | undefined;
            disconnectedMs?: number | undefined;
        }[];
    }>;
    signature: z.ZodString;
}, "strict", z.ZodTypeAny, {
    body: {
        matchId: string;
        serverId: string;
        nonce: string;
        timestampMs: number;
        rows: {
            playerId: string;
            position: number;
            finishMs: number;
            bestLapMs: number;
            driftPoints: number;
            maxSpeedKmh: number;
            perfectRace: boolean;
            checkpoints: number[];
            disconnectedMs: number;
        }[];
    };
    signature: string;
}, {
    body: {
        matchId: string;
        serverId: string;
        nonce: string;
        timestampMs: number;
        rows: {
            playerId: string;
            position: number;
            finishMs: number;
            bestLapMs: number;
            driftPoints: number;
            maxSpeedKmh: number;
            checkpoints: number[];
            perfectRace?: boolean | undefined;
            disconnectedMs?: number | undefined;
        }[];
    };
    signature: string;
}>;
export type GameServerResultEnvelope = z.infer<typeof GameServerResultEnvelopeSchema>;
export declare const ResultValidationDtoSchema: z.ZodObject<{
    matchId: z.ZodString;
    accepted: z.ZodBoolean;
    matchStatus: z.ZodEnum<["WAITING_FOR_PLAYERS", "LOADING", "IN_PROGRESS", "FINISHED", "FINISHED_VALIDATED", "INVALIDATED"]>;
    invalidReason: z.ZodNullable<z.ZodString>;
    settlementQueued: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    matchId: string;
    accepted: boolean;
    matchStatus: "WAITING_FOR_PLAYERS" | "LOADING" | "IN_PROGRESS" | "FINISHED" | "FINISHED_VALIDATED" | "INVALIDATED";
    invalidReason: string | null;
    settlementQueued: boolean;
}, {
    matchId: string;
    accepted: boolean;
    matchStatus: "WAITING_FOR_PLAYERS" | "LOADING" | "IN_PROGRESS" | "FINISHED" | "FINISHED_VALIDATED" | "INVALIDATED";
    invalidReason: string | null;
    settlementQueued: boolean;
}>;
export type ResultValidationDto = z.infer<typeof ResultValidationDtoSchema>;
export declare const LeaderboardScopeSchema: z.ZodEnum<["world", "country", "division", "clan", "vehicle", "season"]>;
export type LeaderboardScope = z.infer<typeof LeaderboardScopeSchema>;
export declare const LeaderboardEntrySchema: z.ZodObject<{
    rank: z.ZodNumber;
    playerId: z.ZodString;
    username: z.ZodString;
    nationality: z.ZodString;
    division: z.ZodEnum<["BRONZE", "ARGENT", "OR", "PLATINE", "DIAMANT", "MAITRE", "LEGEND"]>;
    plPoints: z.ZodNumber;
    metric: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    username: string;
    nationality: string;
    plPoints: number;
    division: "BRONZE" | "ARGENT" | "OR" | "PLATINE" | "DIAMANT" | "MAITRE" | "LEGEND";
    rank: number;
    playerId: string;
    metric: number;
}, {
    username: string;
    nationality: string;
    plPoints: number;
    division: "BRONZE" | "ARGENT" | "OR" | "PLATINE" | "DIAMANT" | "MAITRE" | "LEGEND";
    rank: number;
    playerId: string;
    metric: number;
}>;
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
