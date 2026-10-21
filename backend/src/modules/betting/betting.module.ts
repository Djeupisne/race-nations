/**
 * betting.module.ts — module pari mutuel 1v1 (docs/betting.md).
 * WalletModule fournit le repository ledger (INV-03) ; BettingService et
 * BetSettlementService sont exportés pour MatchesModule (outbox settlement).
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { JurisdictionService } from './jurisdiction.service';
import { BetLimitsService } from './bet-limits.service';
import { BetValidatorService } from './bet-validator.service';
import { BetOddsService } from './bet-odds.service';
import { BettingService } from './betting.service';
import { BetSettlementService } from './bet-settlement.service';
import { BettingController } from './betting.controller';

@Module({
  imports: [PrismaModule, WalletModule],
  providers: [JurisdictionService, BetLimitsService, BetValidatorService, BetOddsService, BettingService, BetSettlementService],
  controllers: [BettingController],
  exports: [BettingService, BetSettlementService, JurisdictionService],
})
export class BettingModule {}
