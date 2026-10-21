import type { BetMarket } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export interface OddsSideView {
    side: number;
    stakedTotal: number;
    players: Array<{
        playerId: string;
        username: string;
        stake: number;
    }>;
    payoutEstimate: number;
    impliedDecimalOdds: number | null;
}
export interface MarketOddsView {
    marketId: string;
    status: BetMarket['status'];
    currency: BetMarket['currency'];
    totalPool: number;
    houseCutEstimate: number;
    netPool: number;
    sides: OddsSideView[];
}
export declare class BetOddsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    oddsForMarket(marketId: string): Promise<MarketOddsView>;
    recomputeCutEstimate(totalPool: number, houseEdgeBps: number): number;
}
