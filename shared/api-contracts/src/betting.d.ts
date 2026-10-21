import { z } from 'zod';
export declare const BET_BOUNDS: {
    readonly SOFT_MIN: 10;
    readonly SOFT_MAX: 10000;
    readonly HARD_MIN_CENTS: 100;
    readonly HARD_MAX_CENTS: 10000;
    readonly TOURNAMENT_MIN: 50;
    readonly TOURNAMENT_MAX: 50000;
    readonly HOUSE_EDGE_BPS: 500;
};
export declare const CreateMarketInputSchema: z.ZodObject<{
    stake: z.ZodNumber;
    currency: z.ZodEnum<["SOFT", "HARD"]>;
    trackId: z.ZodString;
    vehicleId: z.ZodOptional<z.ZodString>;
    opponentUsername: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    trackId: string;
    stake: number;
    currency: "SOFT" | "HARD";
    vehicleId?: string | undefined;
    opponentUsername?: string | undefined;
}, {
    trackId: string;
    stake: number;
    currency: "SOFT" | "HARD";
    vehicleId?: string | undefined;
    opponentUsername?: string | undefined;
}>;
export type CreateMarketInput = z.infer<typeof CreateMarketInputSchema>;
export declare const AcceptChallengeInputSchema: z.ZodObject<{
    stake: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    stake: number;
}, {
    stake: number;
}>;
export type AcceptChallengeInput = z.infer<typeof AcceptChallengeInputSchema>;
export declare const OpenDisputeInputSchema: z.ZodObject<{
    reason: z.ZodEnum<["CHEAT_SUSPECTED", "RESULT_MISMATCH", "DISCONNECT_DISPUTE", "SERVER_FAULT", "OTHER"]>;
    note: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    reason: "CHEAT_SUSPECTED" | "RESULT_MISMATCH" | "DISCONNECT_DISPUTE" | "SERVER_FAULT" | "OTHER";
    note?: string | undefined;
}, {
    reason: "CHEAT_SUSPECTED" | "RESULT_MISMATCH" | "DISCONNECT_DISPUTE" | "SERVER_FAULT" | "OTHER";
    note?: string | undefined;
}>;
export type OpenDisputeInput = z.infer<typeof OpenDisputeInputSchema>;
export declare const ManualSettleInputSchema: z.ZodObject<{
    winningBetIds: z.ZodArray<z.ZodString, "many">;
    cheatReversal: z.ZodDefault<z.ZodBoolean>;
    reason: z.ZodString;
}, "strict", z.ZodTypeAny, {
    reason: string;
    winningBetIds: string[];
    cheatReversal: boolean;
}, {
    reason: string;
    winningBetIds: string[];
    cheatReversal?: boolean | undefined;
}>;
export type ManualSettleInput = z.infer<typeof ManualSettleInputSchema>;
export declare const ListMarketsQuerySchema: z.ZodObject<{
    currency: z.ZodOptional<z.ZodEnum<["SOFT", "HARD"]>>;
    trackId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["OPEN", "CHALLENGED", "LOCKED", "RUNNING", "SETTLING", "SETTLED", "DISPUTED", "CANCELLED"]>>;
    minStake: z.ZodOptional<z.ZodNumber>;
    maxStake: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    cursor: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    limit: number;
    status?: "CANCELLED" | "RUNNING" | "OPEN" | "CHALLENGED" | "LOCKED" | "SETTLING" | "SETTLED" | "DISPUTED" | undefined;
    cursor?: string | undefined;
    trackId?: string | undefined;
    currency?: "SOFT" | "HARD" | undefined;
    minStake?: number | undefined;
    maxStake?: number | undefined;
}, {
    status?: "CANCELLED" | "RUNNING" | "OPEN" | "CHALLENGED" | "LOCKED" | "SETTLING" | "SETTLED" | "DISPUTED" | undefined;
    cursor?: string | undefined;
    limit?: number | undefined;
    trackId?: string | undefined;
    currency?: "SOFT" | "HARD" | undefined;
    minStake?: number | undefined;
    maxStake?: number | undefined;
}>;
export type ListMarketsQuery = z.infer<typeof ListMarketsQuerySchema>;
export declare const BetDtoSchema: z.ZodObject<{
    id: z.ZodString;
    marketId: z.ZodString;
    playerId: z.ZodString;
    username: z.ZodString;
    side: z.ZodNumber;
    stake: z.ZodNumber;
    status: z.ZodEnum<["PENDING", "ACCEPTED", "ESCROWED", "RUNNING", "WON", "LOST", "PUSH", "REFUNDED", "VOIDED"]>;
    result: z.ZodNullable<z.ZodEnum<["WIN", "LOSS", "PUSH", "REFUND", "VOID", "CHEAT_REVERSAL"]>>;
    payout: z.ZodNumber;
    escrowTxId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "PENDING" | "ACCEPTED" | "ESCROWED" | "RUNNING" | "WON" | "LOST" | "PUSH" | "REFUNDED" | "VOIDED";
    id: string;
    username: string;
    createdAt: string;
    playerId: string;
    stake: number;
    marketId: string;
    side: number;
    result: "PUSH" | "WIN" | "LOSS" | "REFUND" | "VOID" | "CHEAT_REVERSAL" | null;
    payout: number;
    escrowTxId: string | null;
}, {
    status: "PENDING" | "ACCEPTED" | "ESCROWED" | "RUNNING" | "WON" | "LOST" | "PUSH" | "REFUNDED" | "VOIDED";
    id: string;
    username: string;
    createdAt: string;
    playerId: string;
    stake: number;
    marketId: string;
    side: number;
    result: "PUSH" | "WIN" | "LOSS" | "REFUND" | "VOID" | "CHEAT_REVERSAL" | null;
    payout: number;
    escrowTxId: string | null;
}>;
export type BetDto = z.infer<typeof BetDtoSchema>;
export declare const MarketPoolSchema: z.ZodObject<{
    totalPool: z.ZodNumber;
    houseCutEstimate: z.ZodNumber;
    netPool: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    totalPool: number;
    houseCutEstimate: number;
    netPool: number;
}, {
    totalPool: number;
    houseCutEstimate: number;
    netPool: number;
}>;
export type MarketPool = z.infer<typeof MarketPoolSchema>;
export declare const BetMarketDtoSchema: z.ZodObject<{
    id: z.ZodString;
    creatorId: z.ZodString;
    opponentId: z.ZodNullable<z.ZodString>;
    matchId: z.ZodNullable<z.ZodString>;
    tournamentRef: z.ZodNullable<z.ZodString>;
    currency: z.ZodEnum<["SOFT", "HARD"]>;
    stake: z.ZodNumber;
    status: z.ZodEnum<["OPEN", "CHALLENGED", "LOCKED", "RUNNING", "SETTLING", "SETTLED", "DISPUTED", "CANCELLED"]>;
    public: z.ZodBoolean;
    trackId: z.ZodString;
    vehicleId: z.ZodNullable<z.ZodString>;
    houseEdgeBps: z.ZodNumber;
    pool: z.ZodObject<{
        totalPool: z.ZodNumber;
        houseCutEstimate: z.ZodNumber;
        netPool: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalPool: number;
        houseCutEstimate: number;
        netPool: number;
    }, {
        totalPool: number;
        houseCutEstimate: number;
        netPool: number;
    }>;
    disputedAt: z.ZodNullable<z.ZodString>;
    disputeReason: z.ZodNullable<z.ZodEnum<["CHEAT_SUSPECTED", "RESULT_MISMATCH", "DISCONNECT_DISPUTE", "SERVER_FAULT", "OTHER"]>>;
    bets: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        marketId: z.ZodString;
        playerId: z.ZodString;
        username: z.ZodString;
        side: z.ZodNumber;
        stake: z.ZodNumber;
        status: z.ZodEnum<["PENDING", "ACCEPTED", "ESCROWED", "RUNNING", "WON", "LOST", "PUSH", "REFUNDED", "VOIDED"]>;
        result: z.ZodNullable<z.ZodEnum<["WIN", "LOSS", "PUSH", "REFUND", "VOID", "CHEAT_REVERSAL"]>>;
        payout: z.ZodNumber;
        escrowTxId: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "PENDING" | "ACCEPTED" | "ESCROWED" | "RUNNING" | "WON" | "LOST" | "PUSH" | "REFUNDED" | "VOIDED";
        id: string;
        username: string;
        createdAt: string;
        playerId: string;
        stake: number;
        marketId: string;
        side: number;
        result: "PUSH" | "WIN" | "LOSS" | "REFUND" | "VOID" | "CHEAT_REVERSAL" | null;
        payout: number;
        escrowTxId: string | null;
    }, {
        status: "PENDING" | "ACCEPTED" | "ESCROWED" | "RUNNING" | "WON" | "LOST" | "PUSH" | "REFUNDED" | "VOIDED";
        id: string;
        username: string;
        createdAt: string;
        playerId: string;
        stake: number;
        marketId: string;
        side: number;
        result: "PUSH" | "WIN" | "LOSS" | "REFUND" | "VOID" | "CHEAT_REVERSAL" | null;
        payout: number;
        escrowTxId: string | null;
    }>, "many">;
    settledAt: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "CANCELLED" | "RUNNING" | "OPEN" | "CHALLENGED" | "LOCKED" | "SETTLING" | "SETTLED" | "DISPUTED";
    id: string;
    createdAt: string;
    matchId: string | null;
    trackId: string;
    stake: number;
    currency: "SOFT" | "HARD";
    vehicleId: string | null;
    creatorId: string;
    opponentId: string | null;
    tournamentRef: string | null;
    public: boolean;
    houseEdgeBps: number;
    pool: {
        totalPool: number;
        houseCutEstimate: number;
        netPool: number;
    };
    disputedAt: string | null;
    disputeReason: "CHEAT_SUSPECTED" | "RESULT_MISMATCH" | "DISCONNECT_DISPUTE" | "SERVER_FAULT" | "OTHER" | null;
    bets: {
        status: "PENDING" | "ACCEPTED" | "ESCROWED" | "RUNNING" | "WON" | "LOST" | "PUSH" | "REFUNDED" | "VOIDED";
        id: string;
        username: string;
        createdAt: string;
        playerId: string;
        stake: number;
        marketId: string;
        side: number;
        result: "PUSH" | "WIN" | "LOSS" | "REFUND" | "VOID" | "CHEAT_REVERSAL" | null;
        payout: number;
        escrowTxId: string | null;
    }[];
    settledAt: string | null;
}, {
    status: "CANCELLED" | "RUNNING" | "OPEN" | "CHALLENGED" | "LOCKED" | "SETTLING" | "SETTLED" | "DISPUTED";
    id: string;
    createdAt: string;
    matchId: string | null;
    trackId: string;
    stake: number;
    currency: "SOFT" | "HARD";
    vehicleId: string | null;
    creatorId: string;
    opponentId: string | null;
    tournamentRef: string | null;
    public: boolean;
    houseEdgeBps: number;
    pool: {
        totalPool: number;
        houseCutEstimate: number;
        netPool: number;
    };
    disputedAt: string | null;
    disputeReason: "CHEAT_SUSPECTED" | "RESULT_MISMATCH" | "DISCONNECT_DISPUTE" | "SERVER_FAULT" | "OTHER" | null;
    bets: {
        status: "PENDING" | "ACCEPTED" | "ESCROWED" | "RUNNING" | "WON" | "LOST" | "PUSH" | "REFUNDED" | "VOIDED";
        id: string;
        username: string;
        createdAt: string;
        playerId: string;
        stake: number;
        marketId: string;
        side: number;
        result: "PUSH" | "WIN" | "LOSS" | "REFUND" | "VOID" | "CHEAT_REVERSAL" | null;
        payout: number;
        escrowTxId: string | null;
    }[];
    settledAt: string | null;
}>;
export type BetMarketDto = z.infer<typeof BetMarketDtoSchema>;
export declare const MarketOddsSideSchema: z.ZodObject<{
    side: z.ZodNumber;
    wageredTotal: z.ZodNumber;
    players: z.ZodNumber;
    impliedPayoutMultiplierFloor: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    players: number;
    side: number;
    wageredTotal: number;
    impliedPayoutMultiplierFloor: number;
}, {
    players: number;
    side: number;
    wageredTotal: number;
    impliedPayoutMultiplierFloor: number;
}>;
export declare const MarketOddsDtoSchema: z.ZodObject<{
    marketId: z.ZodString;
    pool: z.ZodObject<{
        totalPool: z.ZodNumber;
        houseCutEstimate: z.ZodNumber;
        netPool: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalPool: number;
        houseCutEstimate: number;
        netPool: number;
    }, {
        totalPool: number;
        houseCutEstimate: number;
        netPool: number;
    }>;
    sides: z.ZodArray<z.ZodObject<{
        side: z.ZodNumber;
        wageredTotal: z.ZodNumber;
        players: z.ZodNumber;
        impliedPayoutMultiplierFloor: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        players: number;
        side: number;
        wageredTotal: number;
        impliedPayoutMultiplierFloor: number;
    }, {
        players: number;
        side: number;
        wageredTotal: number;
        impliedPayoutMultiplierFloor: number;
    }>, "many">;
    computedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    marketId: string;
    pool: {
        totalPool: number;
        houseCutEstimate: number;
        netPool: number;
    };
    sides: {
        players: number;
        side: number;
        wageredTotal: number;
        impliedPayoutMultiplierFloor: number;
    }[];
    computedAt: string;
}, {
    marketId: string;
    pool: {
        totalPool: number;
        houseCutEstimate: number;
        netPool: number;
    };
    sides: {
        players: number;
        side: number;
        wageredTotal: number;
        impliedPayoutMultiplierFloor: number;
    }[];
    computedAt: string;
}>;
export type MarketOddsDto = z.infer<typeof MarketOddsDtoSchema>;
export declare const MyBetSchema: z.ZodObject<{
    bet: z.ZodObject<{
        id: z.ZodString;
        marketId: z.ZodString;
        playerId: z.ZodString;
        username: z.ZodString;
        side: z.ZodNumber;
        stake: z.ZodNumber;
        status: z.ZodEnum<["PENDING", "ACCEPTED", "ESCROWED", "RUNNING", "WON", "LOST", "PUSH", "REFUNDED", "VOIDED"]>;
        result: z.ZodNullable<z.ZodEnum<["WIN", "LOSS", "PUSH", "REFUND", "VOID", "CHEAT_REVERSAL"]>>;
        payout: z.ZodNumber;
        escrowTxId: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "PENDING" | "ACCEPTED" | "ESCROWED" | "RUNNING" | "WON" | "LOST" | "PUSH" | "REFUNDED" | "VOIDED";
        id: string;
        username: string;
        createdAt: string;
        playerId: string;
        stake: number;
        marketId: string;
        side: number;
        result: "PUSH" | "WIN" | "LOSS" | "REFUND" | "VOID" | "CHEAT_REVERSAL" | null;
        payout: number;
        escrowTxId: string | null;
    }, {
        status: "PENDING" | "ACCEPTED" | "ESCROWED" | "RUNNING" | "WON" | "LOST" | "PUSH" | "REFUNDED" | "VOIDED";
        id: string;
        username: string;
        createdAt: string;
        playerId: string;
        stake: number;
        marketId: string;
        side: number;
        result: "PUSH" | "WIN" | "LOSS" | "REFUND" | "VOID" | "CHEAT_REVERSAL" | null;
        payout: number;
        escrowTxId: string | null;
    }>;
    market: z.ZodObject<{
        id: z.ZodString;
        status: z.ZodEnum<["OPEN", "CHALLENGED", "LOCKED", "RUNNING", "SETTLING", "SETTLED", "DISPUTED", "CANCELLED"]>;
        currency: z.ZodEnum<["SOFT", "HARD"]>;
        trackId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "CANCELLED" | "RUNNING" | "OPEN" | "CHALLENGED" | "LOCKED" | "SETTLING" | "SETTLED" | "DISPUTED";
        id: string;
        trackId: string;
        currency: "SOFT" | "HARD";
    }, {
        status: "CANCELLED" | "RUNNING" | "OPEN" | "CHALLENGED" | "LOCKED" | "SETTLING" | "SETTLED" | "DISPUTED";
        id: string;
        trackId: string;
        currency: "SOFT" | "HARD";
    }>;
}, "strip", z.ZodTypeAny, {
    bet: {
        status: "PENDING" | "ACCEPTED" | "ESCROWED" | "RUNNING" | "WON" | "LOST" | "PUSH" | "REFUNDED" | "VOIDED";
        id: string;
        username: string;
        createdAt: string;
        playerId: string;
        stake: number;
        marketId: string;
        side: number;
        result: "PUSH" | "WIN" | "LOSS" | "REFUND" | "VOID" | "CHEAT_REVERSAL" | null;
        payout: number;
        escrowTxId: string | null;
    };
    market: {
        status: "CANCELLED" | "RUNNING" | "OPEN" | "CHALLENGED" | "LOCKED" | "SETTLING" | "SETTLED" | "DISPUTED";
        id: string;
        trackId: string;
        currency: "SOFT" | "HARD";
    };
}, {
    bet: {
        status: "PENDING" | "ACCEPTED" | "ESCROWED" | "RUNNING" | "WON" | "LOST" | "PUSH" | "REFUNDED" | "VOIDED";
        id: string;
        username: string;
        createdAt: string;
        playerId: string;
        stake: number;
        marketId: string;
        side: number;
        result: "PUSH" | "WIN" | "LOSS" | "REFUND" | "VOID" | "CHEAT_REVERSAL" | null;
        payout: number;
        escrowTxId: string | null;
    };
    market: {
        status: "CANCELLED" | "RUNNING" | "OPEN" | "CHALLENGED" | "LOCKED" | "SETTLING" | "SETTLED" | "DISPUTED";
        id: string;
        trackId: string;
        currency: "SOFT" | "HARD";
    };
}>;
export type MyBet = z.infer<typeof MyBetSchema>;
export declare const BetSettlementDtoSchema: z.ZodObject<{
    marketId: z.ZodString;
    totalPool: z.ZodNumber;
    houseCut: z.ZodNumber;
    netPool: z.ZodNumber;
    payouts: z.ZodRecord<z.ZodString, z.ZodNumber>;
    residual: z.ZodNumber;
    settledBy: z.ZodNullable<z.ZodString>;
    settledAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    marketId: string;
    totalPool: number;
    netPool: number;
    settledAt: string;
    houseCut: number;
    payouts: Record<string, number>;
    residual: number;
    settledBy: string | null;
}, {
    marketId: string;
    totalPool: number;
    netPool: number;
    settledAt: string;
    houseCut: number;
    payouts: Record<string, number>;
    residual: number;
    settledBy: string | null;
}>;
export type BetSettlementDto = z.infer<typeof BetSettlementDtoSchema>;
export declare const HouseBalanceDtoSchema: z.ZodObject<{
    balanceCents: z.ZodNumber;
    escrowOutstanding: z.ZodNumber;
    cumulativeFees: z.ZodNumber;
    pnlToday: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    balanceCents: number;
    escrowOutstanding: number;
    cumulativeFees: number;
    pnlToday: number;
}, {
    balanceCents: number;
    escrowOutstanding: number;
    cumulativeFees: number;
    pnlToday: number;
}>;
export type HouseBalanceDto = z.infer<typeof HouseBalanceDtoSchema>;
export declare const HouseReverseInputSchema: z.ZodObject<{
    marketId: z.ZodString;
    reason: z.ZodString;
}, "strict", z.ZodTypeAny, {
    reason: string;
    marketId: string;
}, {
    reason: string;
    marketId: string;
}>;
export type HouseReverseInput = z.infer<typeof HouseReverseInputSchema>;
