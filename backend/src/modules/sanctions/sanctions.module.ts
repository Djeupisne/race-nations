/**
 * sanctions.module.ts — cycle de vie sanctions (machine Sanction INV-22) + clawback
 * via WalletRepository (append-only, INV-06/INV-18).
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { SanctionsService } from './sanctions.service';
import { SanctionsController } from './sanctions.controller';

@Module({
  imports: [PrismaModule, WalletModule],
  providers: [SanctionsService],
  controllers: [SanctionsController],
  exports: [SanctionsService],
})
export class SanctionsModule {}
