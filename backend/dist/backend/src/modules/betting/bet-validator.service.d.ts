import type { BetMarket, Player } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { type BettingConfig } from '../../config/betting.config';
import { JurisdictionService } from './jurisdiction.service';
import { BetLimitsService } from './bet-limits.service';
export interface JoinCheck {
    market: BetMarket;
    player: Player;
}
export declare class BetValidatorService {
    private readonly prisma;
    private readonly config;
    private readonly jurisdictions;
    private readonly limits;
    constructor(prisma: PrismaService, config: BettingConfig, jurisdictions: JurisdictionService, limits: BetLimitsService);
    validateMarketCreation(player: Player, currency: 'SOFT' | 'HARD', stake: number): Promise<void>;
    validateJoin(marketId: string, player: Player): Promise<JoinCheck>;
    assertEqualStakes(stakeA: number, stakeB: number): void;
    private assertKillSwitch;
}
