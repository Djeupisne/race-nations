/**
 * audit.module.ts — journal AdminAuditLog append-only (INV-06/INV-28), exporté
 * pour que AdminModule/BettingModule tracent leurs mutations sensibles.
 */
import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditService],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule {}
