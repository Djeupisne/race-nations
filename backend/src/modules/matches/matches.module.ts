/**
 * matches.module.ts — cycle de vie des matchs + settlement sportif (INV-24/25/31/32).
 * MatchSettlementService consomme la file Redis outbox alimentée par markValidated()
 * et délègue le règlement financier à BetSettlementService (BettingModule).
 */
import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { WalletModule } from '../wallet/wallet.module';
import { PlayersModule } from '../players/players.module';
import { BettingModule } from '../betting/betting.module';
import { MatchesService } from './matches.service';
import { MatchSettlementService } from './match-settlement.service';
import { MatchesController } from './matches.controller';

@Module({
  imports: [PrismaModule, RedisModule, WalletModule, PlayersModule, forwardRef(() => BettingModule)],
  providers: [MatchesService, MatchSettlementService],
  controllers: [MatchesController],
  exports: [MatchesService, MatchSettlementService],
})
export class MatchesModule {}
