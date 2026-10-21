"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const schedule_1 = require("@nestjs/schedule");
const configuration_1 = __importDefault(require("./config/configuration"));
const env_validation_1 = require("./config/env.validation");
const clock_1 = require("./common/utils/clock");
const prisma_module_1 = require("./prisma/prisma.module");
const redis_module_1 = require("./redis/redis.module");
const observability_module_1 = require("./observability/observability.module");
const realtime_module_1 = require("./realtime/realtime.module");
const request_id_middleware_1 = require("./observability/request-id.middleware");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const api_version_interceptor_1 = require("./common/interceptors/api-version.interceptor");
const timeout_interceptor_1 = require("./common/interceptors/timeout.interceptor");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const players_module_1 = require("./modules/players/players.module");
const wallet_module_1 = require("./modules/wallet/wallet.module");
const payments_module_1 = require("./modules/payments/payments.module");
const webhooks_module_1 = require("./modules/webhooks/webhooks.module");
const gameservers_module_1 = require("./modules/gameservers/gameservers.module");
const matchmaking_module_1 = require("./modules/matchmaking/matchmaking.module");
const matches_module_1 = require("./modules/matches/matches.module");
const betting_module_1 = require("./modules/betting/betting.module");
const house_wallet_module_1 = require("./modules/house-wallet/house-wallet.module");
const health_module_1 = require("./modules/health/health.module");
const audit_module_1 = require("./modules/audit/audit.module");
const moderation_module_1 = require("./modules/moderation/moderation.module");
const sanctions_module_1 = require("./modules/sanctions/sanctions.module");
const admin_module_1 = require("./modules/admin/admin.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(request_id_middleware_1.RequestIdMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
                validate: env_validation_1.validateEnv,
                cache: true,
            }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            observability_module_1.ObservabilityModule,
            realtime_module_1.RealtimeModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            players_module_1.PlayersModule,
            wallet_module_1.WalletModule,
            payments_module_1.PaymentsModule,
            webhooks_module_1.WebhooksModule,
            gameservers_module_1.GameserversModule,
            matchmaking_module_1.MatchmakingModule,
            matches_module_1.MatchesModule,
            betting_module_1.BettingModule,
            house_wallet_module_1.HouseWalletModule,
            health_module_1.HealthModule,
            audit_module_1.AuditModule,
            moderation_module_1.ModerationModule,
            sanctions_module_1.SanctionsModule,
            admin_module_1.AdminModule,
        ],
        providers: [
            { provide: clock_1.CLOCK, useClass: clock_1.SystemClock },
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
            { provide: core_1.APP_INTERCEPTOR, useClass: logging_interceptor_1.LoggingInterceptor },
            { provide: core_1.APP_INTERCEPTOR, useClass: api_version_interceptor_1.ApiVersionInterceptor },
            { provide: core_1.APP_INTERCEPTOR, useClass: timeout_interceptor_1.TimeoutInterceptor },
            { provide: core_1.APP_FILTER, useClass: all_exceptions_filter_1.AllExceptionsFilter },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map