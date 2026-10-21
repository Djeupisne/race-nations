import type { AuthenticatedUser } from '../auth/auth.dto';
import { BettingService } from './betting.service';
import { BetSettlementService } from './bet-settlement.service';
import { BetLimitsService } from './bet-limits.service';
import { PrismaService } from '../../prisma/prisma.service';
export declare class BettingController {
    private readonly betting;
    private readonly settlement;
    private readonly limits;
    private readonly prisma;
    constructor(betting: BettingService, settlement: BetSettlementService, limits: BetLimitsService, prisma: PrismaService);
    createMarket(user: AuthenticatedUser, body: CreateMarketInputSchemaType): Promise<{
        status: import(".prisma/client").$Enums.BetMarketStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        matchId: string | null;
        trackId: string;
        stake: number;
        currency: import(".prisma/client").$Enums.Currency;
        vehicleId: string | null;
        totalPool: number;
        houseCutEstimate: number;
        creatorId: string;
        opponentId: string | null;
        tournamentRef: string | null;
        public: boolean;
        houseEdgeBps: number;
        disputedAt: Date | null;
        disputeReason: import(".prisma/client").$Enums.DisputeReason | null;
        cancelledAt: Date | null;
    }>;
    joinMarket(id: string, user: AuthenticatedUser, _body: unknown): Promise<{
        market: import(".prisma/client").BetMarket;
        bet: import(".prisma/client").Prisma.BetGetPayload<object>;
    }>;
    listMarkets(query: ListMarketsQueryType): Promise<{
        items: {
            status: import(".prisma/client").$Enums.BetMarketStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            matchId: string | null;
            trackId: string;
            stake: number;
            currency: import(".prisma/client").$Enums.Currency;
            vehicleId: string | null;
            totalPool: number;
            houseCutEstimate: number;
            creatorId: string;
            opponentId: string | null;
            tournamentRef: string | null;
            public: boolean;
            houseEdgeBps: number;
            disputedAt: Date | null;
            disputeReason: import(".prisma/client").$Enums.DisputeReason | null;
            cancelledAt: Date | null;
        }[];
        nextCursor: string | null;
    }>;
    getMarket(id: string): Promise<{
        bets: ({
            player: {
                id: string;
                username: string;
                nationality: string;
                plPoints: number;
            };
        } & {
            status: import(".prisma/client").$Enums.BetStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            playerId: string;
            stake: number;
            marketId: string;
            side: number;
            result: import(".prisma/client").$Enums.BetResult | null;
            payout: number;
            escrowTxId: string | null;
        })[];
    } & {
        status: import(".prisma/client").$Enums.BetMarketStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        matchId: string | null;
        trackId: string;
        stake: number;
        currency: import(".prisma/client").$Enums.Currency;
        vehicleId: string | null;
        totalPool: number;
        houseCutEstimate: number;
        creatorId: string;
        opponentId: string | null;
        tournamentRef: string | null;
        public: boolean;
        houseEdgeBps: number;
        disputedAt: Date | null;
        disputeReason: import(".prisma/client").$Enums.DisputeReason | null;
        cancelledAt: Date | null;
    }>;
    odds(id: string): Promise<import("./bet-odds.service").MarketOddsView>;
    myBets(user: AuthenticatedUser, status?: string): Promise<({
        market: {
            status: import(".prisma/client").$Enums.BetMarketStatus;
            id: string;
            trackId: string;
            currency: import(".prisma/client").$Enums.Currency;
            totalPool: number;
        };
    } & {
        status: import(".prisma/client").$Enums.BetStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        playerId: string;
        stake: number;
        marketId: string;
        side: number;
        result: import(".prisma/client").$Enums.BetResult | null;
        payout: number;
        escrowTxId: string | null;
    })[]>;
    limitsUsage(user: AuthenticatedUser): Promise<{
        soft: {
            currency: "SOFT" | "HARD";
            windowHours: number;
            used: number;
            softDailyLimit: 10000;
        };
        hard: {
            currency: "SOFT" | "HARD";
            windowHours: number;
            used: number;
            softDailyLimit: 10000;
        };
        reputation: number;
        minReputationHard: number;
    }>;
    cancel(id: string, user: AuthenticatedUser): Promise<{
        status: import(".prisma/client").$Enums.BetMarketStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        matchId: string | null;
        trackId: string;
        stake: number;
        currency: import(".prisma/client").$Enums.Currency;
        vehicleId: string | null;
        totalPool: number;
        houseCutEstimate: number;
        creatorId: string;
        opponentId: string | null;
        tournamentRef: string | null;
        public: boolean;
        houseEdgeBps: number;
        disputedAt: Date | null;
        disputeReason: import(".prisma/client").$Enums.DisputeReason | null;
        cancelledAt: Date | null;
    }>;
    dispute(id: string, user: AuthenticatedUser, body: DisputeBody): Promise<{
        ok: boolean;
    }>;
    manualSettle(id: string, user: AuthenticatedUser, body: {
        winningSide?: number;
        push?: boolean;
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
    resolveDispute(id: string, body: {
        outcome: 'REFUND_ALL' | 'UPHELD';
    }): Promise<{
        ok: boolean;
    }>;
    private mustPlayer;
}
type CreateMarketInputSchemaType = import('@race-nations/api-contracts').CreateMarketInput;
type ListMarketsQueryType = import('@race-nations/api-contracts').ListMarketsQuery;
type DisputeBody = import('@race-nations/api-contracts').OpenDisputeInput;
export {};
