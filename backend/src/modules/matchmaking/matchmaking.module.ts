/**
 * matchmaking.module.ts — files + worker d'appariement (INV-22 machine Ticket).
 * Le worker a besoin de GameserversModule (allocation APRÈS commit du match).
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { GameserversModule } from '../gameservers/gameservers.module';
import { MatchmakingService } from './matchmaking.service';
import { MatchmakingWorker } from './matchmaking.worker';

@Module({
  imports: [PrismaModule, GameserversModule],
  providers: [MatchmakingService, MatchmakingWorker],
  exports: [MatchmakingService],
})
export class MatchmakingModule {}
