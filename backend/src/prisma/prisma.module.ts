/**
 * PrismaModule — module global exposant PrismaService (pool unique).
 * Une seule connexion par process ; les transactions passent par le service.
 */
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
