import { PrismaService } from '../../prisma/prisma.service';
import { type Clock } from '../../common/utils/clock';
import { type BettingConfig } from '../../config/betting.config';
import { JurisdictionService } from './jurisdiction.service';
export interface StakeCheckContext {
    playerId: string;
    countryCode: string;
    currency: 'SOFT' | 'HARD';
}
export declare class BetLimitsService {
    private readonly prisma;
    private readonly config;
    private readonly clock;
    private readonly jurisdictions;
    constructor(prisma: PrismaService, config: BettingConfig, clock: Clock, jurisdictions: JurisdictionService);
    assertStakeBounds(currency: 'SOFT' | 'HARD', stake: number): void;
    assertWithinLimits(ctx: StakeCheckContext, additionalStake: number): Promise<void>;
    usage(playerId: string, currency: 'SOFT' | 'HARD'): Promise<{
        currency: "SOFT" | "HARD";
        windowHours: number;
        used: number;
        softDailyLimit: 10000;
    }>;
    private sumEscrowSince;
}
