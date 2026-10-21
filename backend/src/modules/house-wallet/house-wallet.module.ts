/**
 * house-wallet.module.ts — supervision House Wallet (INV-12/13/16) + contrôleur ADMIN/MODERATOR.
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { HouseWalletService } from './house-wallet.service';
import { HouseWalletController } from './house-wallet.controller';

@Module({
  imports: [PrismaModule, WalletModule],
  providers: [HouseWalletService],
  controllers: [HouseWalletController],
  exports: [HouseWalletService],
})
export class HouseWalletModule {}
