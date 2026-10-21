import { z } from 'zod';
export declare const RegisterServerSchema: z.ZodObject<{
    hostname: z.ZodString;
    region: z.ZodEnum<["eu-west", "eu-central", "na-east", "na-west", "sa-east", "af-south", "me-south", "ap-south", "ap-east"]>;
    maxPlayers: z.ZodDefault<z.ZodNumber>;
    version: z.ZodString;
}, "strip", z.ZodTypeAny, {
    version: string;
    hostname: string;
    region: "eu-west" | "eu-central" | "na-east" | "na-west" | "sa-east" | "af-south" | "me-south" | "ap-south" | "ap-east";
    maxPlayers: number;
}, {
    version: string;
    hostname: string;
    region: "eu-west" | "eu-central" | "na-east" | "na-west" | "sa-east" | "af-south" | "me-south" | "ap-south" | "ap-east";
    maxPlayers?: number | undefined;
}>;
export type RegisterServerDto = z.infer<typeof RegisterServerSchema>;
export declare const HeartbeatSchema: z.ZodObject<{
    serverId: z.ZodString;
    activeMatches: z.ZodNumber;
    currentMatchIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    ts: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    serverId: string;
    activeMatches: number;
    currentMatchIds: string[];
    ts: number;
}, {
    serverId: string;
    activeMatches: number;
    ts: number;
    currentMatchIds?: string[] | undefined;
}>;
export type HeartbeatDto = z.infer<typeof HeartbeatSchema>;
export declare const ResultPositionSchema: z.ZodObject<{
    playerId: z.ZodString;
    position: z.ZodNumber;
    finishTimeMs: z.ZodNumber;
    laps: z.ZodNumber;
    bestLapMs: z.ZodNumber;
    disconnected: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    playerId: string;
    position: number;
    bestLapMs: number;
    finishTimeMs: number;
    laps: number;
    disconnected: boolean;
}, {
    playerId: string;
    position: number;
    bestLapMs: number;
    finishTimeMs: number;
    laps: number;
    disconnected?: boolean | undefined;
}>;
export declare const MatchResultSchema: z.ZodObject<{
    matchId: z.ZodString;
    serverId: z.ZodString;
    nonce: z.ZodString;
    startedAt: z.ZodNumber;
    finishedAt: z.ZodNumber;
    positions: z.ZodArray<z.ZodObject<{
        playerId: z.ZodString;
        position: z.ZodNumber;
        finishTimeMs: z.ZodNumber;
        laps: z.ZodNumber;
        bestLapMs: z.ZodNumber;
        disconnected: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        playerId: string;
        position: number;
        bestLapMs: number;
        finishTimeMs: number;
        laps: number;
        disconnected: boolean;
    }, {
        playerId: string;
        position: number;
        bestLapMs: number;
        finishTimeMs: number;
        laps: number;
        disconnected?: boolean | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    matchId: string;
    serverId: string;
    startedAt: number;
    finishedAt: number;
    nonce: string;
    positions: {
        playerId: string;
        position: number;
        bestLapMs: number;
        finishTimeMs: number;
        laps: number;
        disconnected: boolean;
    }[];
}, {
    matchId: string;
    serverId: string;
    startedAt: number;
    finishedAt: number;
    nonce: string;
    positions: {
        playerId: string;
        position: number;
        bestLapMs: number;
        finishTimeMs: number;
        laps: number;
        disconnected?: boolean | undefined;
    }[];
}>;
export type MatchResultDto = z.infer<typeof MatchResultSchema>;
export declare const DrainSchema: z.ZodObject<{
    serverId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    serverId: string;
}, {
    serverId: string;
}>;
export type DrainDto = z.infer<typeof DrainSchema>;
