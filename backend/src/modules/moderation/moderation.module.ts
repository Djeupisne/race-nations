/**
 * moderation.module.ts — file de reports + filtre texte (banned-words.json).
 * Les ACTIONS (warn/mute/ban) sont déléguées à SanctionsModule (jamais de double écriture).
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SanctionsModule } from '../sanctions/sanctions.module';
import { ModerationService } from './moderation.service';
import { TextFilterService } from './text-filter.service';
import { ModerationController } from './moderation.controller';

@Module({
  imports: [PrismaModule, SanctionsModule],
  providers: [ModerationService, TextFilterService],
  controllers: [ModerationController],
  exports: [ModerationService, TextFilterService],
})
export class ModerationModule {}
