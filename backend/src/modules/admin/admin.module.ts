/**
 * admin.module.ts — back-office : façade auditée des opérations sensibles (INV-28).
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { BettingModule } from '../betting/betting.module';
import { GameserversModule } from '../gameservers/gameservers.module';
import { SanctionsModule } from '../sanctions/sanctions.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [PrismaModule, AuditModule, BettingModule, GameserversModule, SanctionsModule],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
