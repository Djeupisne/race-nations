/**
 * ObservabilityModule — métriques Prometheus + middleware request-id.
 * Global : tous les modules instrumentent via MetricsService (inc/observe).
 */
import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { RequestIdMiddleware } from './request-id.middleware';

@Global()
@Module({
  providers: [MetricsService],
  controllers: [MetricsController],
  exports: [MetricsService],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
