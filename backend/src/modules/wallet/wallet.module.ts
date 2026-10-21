/**
 * WalletModule — wallets HARD/SOFT + ledger append-only.
 * WalletRepository encapsule TOUTES les mutations de solde (SELECT FOR
 * UPDATE via transaction sérialisée, clés d'idempotence UNIQUE) ; aucun
 * autre module ne touche WalletBalance directement (INV-01..05).
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { WalletRepository } from './wallet.repository';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [WalletRepository, WalletService],
  controllers: [WalletController],
  exports: [WalletRepository, WalletService],
})
export class WalletModule {}
