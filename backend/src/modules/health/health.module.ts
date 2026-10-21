/**
 * HealthModule — probes k8s (liveness/readiness). Le contrôleur existant
 * ping directement Prisma/Redis ; ce module ne fait que déclarer le
 * controller et ses dépendances globales.
 */
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
