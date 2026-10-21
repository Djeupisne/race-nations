import { PrismaService } from '../../prisma/prisma.service';
import { WalletRepository } from '../wallet/wallet.repository';
import { type Clock } from '../../common/utils/clock';
export declare class SanctionsService {
    private readonly prisma;
    private readonly wallet;
    private readonly clock;
    constructor(prisma: PrismaService, wallet: WalletRepository, clock: Clock);
    issue(params: {
        playerId: string;
        type: 'WARN' | 'CHAT_MUTE' | 'BET_RESTRICTION' | 'TEMP_BAN_7D' | 'PERM_BAN' | 'REWARD_CLAWBACK';
        reason: string;
        evidenceRef?: string;
        issuedById: string;
    }): Promise<{
        sanctionId: string;
        endsAt: Date | null;
    }>;
    appeal(sanctionId: string, playerId: string, note: string): Promise<void>;
    decideAppeal(sanctionId: string, decision: 'UPHELD' | 'LIFTED'): Promise<void>;
    lift(sanctionId: string): Promise<void>;
    clawbackRewards(sanctionId: string, actorUserId: string): Promise<{
        reversedCents: number;
        reversedCredits: number;
    }>;
    listForPlayer(playerId: string): Promise<{
        status: import(".prisma/client").$Enums.SanctionStatus;
        type: import(".prisma/client").$Enums.SanctionType;
        id: string;
        createdAt: Date;
        reason: string;
        startsAt: Date;
        endsAt: Date | null;
    }[]>;
    hasActive(playerId: string, types: Array<'BET_RESTRICTION' | 'TEMP_BAN_7D' | 'PERM_BAN' | 'CHAT_MUTE'>): Promise<boolean>;
}
