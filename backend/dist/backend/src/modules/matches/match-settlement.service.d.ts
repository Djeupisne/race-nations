import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { WalletService } from '../wallet/wallet.service';
import { PlayersService } from '../players/players.service';
import { MatchesService } from './matches.service';
import { BetSettlementService } from '../betting/bet-settlement.service';
export declare const BET_SETTLEMENT_QUEUE = "outbox:bet.settlement";
export declare class MatchSettlementService {
    private readonly prisma;
    private readonly redis;
    private readonly wallet;
    private readonly players;
    private readonly matches;
    private readonly betSettler?;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, wallet: WalletService, players: PlayersService, matches: MatchesService, betSettler?: BetSettlementService | undefined);
    settleValidatedMatch(matchId: string): Promise<void>;
    handleInvalidatedMatch(matchId: string, reason: string): Promise<void>;
    processBetSettlementMessage(raw: string): Promise<void>;
    private inferWinningSide;
    private enqueueBetSettlement;
    private enqueueBetDispute;
    assertValidated(status: string): void;
}
