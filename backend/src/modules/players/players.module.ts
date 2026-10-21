/**
 * PlayersModule — domaine joueur (PL, pays, statut betting-eligibility).
 * Exporte PlayersService pour matchmaking/betting/admin.
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RealtimeModule } from '../../realtime/realtime.module';
import { PlayersService } from './players.service';
import { PlayersController } from './players.controller';

@Module({
  imports: [PrismaModule, RealtimeModule],
  providers: [PlayersService],
  controllers: [PlayersController],
  exports: [PlayersService],
})
export class PlayersModule {}
