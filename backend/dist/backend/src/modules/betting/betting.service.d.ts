import { Prisma } from '@prisma/client';
import type { BetMarket, Player } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletRepository } from '../wallet/wallet.repository';
import { type BettingConfig } from '../../config/betting.config';
import { BetValidatorService } from './bet-validator.service';
import { JurisdictionService } from './jurisdiction.service';
import { BetOddsService } from './bet-odds.service';
export interface CreateMarketParams {
    creator: Player;
    stake: number;
    currency: 'SOFT' | 'HARD';
    trackId: string;
    vehicleId?: string;
    opponentUsername?: string;
}
export declare class BettingService {
    private readonly prisma;
    private readonly wallet;
    private readonly config;
    private readonly validator;
    private readonly jurisdictions;
    private readonly odds;
    private readonly logger;
    constructor(prisma: PrismaService, wallet: WalletRepository, config: BettingConfig, validator: BetValidatorService, jurisdictions: JurisdictionService, odds: BetOddsService);
    createMarket(params: CreateMarketParams): Promise<BetMarket>;
    joinMarket(marketId: string, player: Player): Promise<{
        market: BetMarket;
        bet: Prisma.BetGetPayload<object>;
    }>;
    listMarkets(query: {
        status?: string;
        currency?: string;
        trackId?: string;
        limit: number;
        cursor?: string;
    }): Promise<{
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
    getMarket(marketId: string): Promise<{
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
    myBets(playerId: string, statusFilter?: string): Promise<({
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
    cancelMarket(marketId: string, actor: Player): Promise<BetMarket>;
    oddsOf(marketId: string): Promise<import("./bet-odds.service").MarketOddsView>;
}
