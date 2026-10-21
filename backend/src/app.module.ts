/**
 * app.module.ts — racine de l'application NestJS (docs/architecture.md §2).
 *
 * Principes :
 *  - Deny-by-default : JwtAuthGuard global + RolesGuard global (INV-28).
 *    Les routes publiques sont explicitement marquées @Public().
 *  - Observabilité transverse : RequestIdMiddleware, LoggingInterceptor,
 *    TimeoutInterceptor, AllExceptionsFilter.
 *  - Config validée au boot (env.validation) — échec = refus de démarrer.
 */
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';

import { CLOCK, SystemClock } from './common/utils/clock';

import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { ObservabilityModule } from './observability/observability.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RequestIdMiddleware } from './observability/request-id.middleware';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ApiVersionInterceptor } from './common/interceptors/api-version.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PlayersModule } from './modules/players/players.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { GameserversModule } from './modules/gameservers/gameservers.module';
import { MatchmakingModule } from './modules/matchmaking/matchmaking.module';
import { MatchesModule } from './modules/matches/matches.module';
import { BettingModule } from './modules/betting/betting.module';
import { HouseWalletModule } from './modules/house-wallet/house-wallet.module';
import { HealthModule } from './modules/health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { SanctionsModule } from './modules/sanctions/sanctions.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      cache: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    ObservabilityModule,
    RealtimeModule,

    // Domaine
    AuthModule,
    UsersModule,
    PlayersModule,
    WalletModule,
    PaymentsModule,
    WebhooksModule,
    GameserversModule,
    MatchmakingModule,
    MatchesModule,
    BettingModule,
    HouseWalletModule,
    HealthModule,
    AuditModule,
    ModerationModule,
    SanctionsModule,
    AdminModule,
  ],
  providers: [
    // Horloge injectable (INV-29) : SystemClock en prod, FixedClock en test.
    { provide: CLOCK, useClass: SystemClock },
    // Guard global : aucune route n'est accessible sans JWT sauf @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    // Intercepteurs globaux (ordre : logging → version → timeout → handler).
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ApiVersionInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    // Traduction centralisée des erreurs en enveloppe API stable.
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
