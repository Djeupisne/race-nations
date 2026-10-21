/**
 * GameserversModule — registre des serveurs de match, heartbeat, validation
 * des résultats (INV-25/26). Expose ResultValidatorService aux contrôleurs
 * et FleetHealthService au scheduler global.
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MatchesModule } from '../matches/matches.module';
import { GameserversService } from './gameservers.service';
import { FleetHealthService } from './fleet-health.service';
import { ResultValidatorService } from './result-validator.service';

@Module({
  imports: [PrismaModule],
  providers: [GameserversService, FleetHealthService, ResultValidatorService],
  exports: [GameserversService, FleetHealthService, ResultValidatorService],
})
export class GameserversModule {}
