"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
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
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var core_1 = require("@nestjs/core");
var schedule_1 = require("@nestjs/schedule");
var configuration_1 = require("./config/configuration");
var env_validation_1 = require("./config/env.validation");
var prisma_module_1 = require("./prisma/prisma.module");
var redis_module_1 = require("./redis/redis.module");
var observability_module_1 = require("./observability/observability.module");
var realtime_module_1 = require("./realtime/realtime.module");
var request_id_middleware_1 = require("./observability/request-id.middleware");
var jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
var roles_guard_1 = require("./common/guards/roles.guard");
var all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
var logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
var api_version_interceptor_1 = require("./common/interceptors/api-version.interceptor");
var timeout_interceptor_1 = require("./common/interceptors/timeout.interceptor");
var auth_module_1 = require("./modules/auth/auth.module");
var users_module_1 = require("./modules/users/users.module");
var players_module_1 = require("./modules/players/players.module");
var wallet_module_1 = require("./modules/wallet/wallet.module");
var payments_module_1 = require("./modules/payments/payments.module");
var webhooks_module_1 = require("./modules/webhooks/webhooks.module");
var gameservers_module_1 = require("./modules/gameservers/gameservers.module");
var matchmaking_module_1 = require("./modules/matchmaking/matchmaking.module");
var matches_module_1 = require("./modules/matches/matches.module");
var betting_module_1 = require("./modules/betting/betting.module");
var house_wallet_module_1 = require("./modules/house-wallet/house-wallet.module");
var health_module_1 = require("./modules/health/health.module");
var audit_module_1 = require("./modules/audit/audit.module");
var moderation_module_1 = require("./modules/moderation/moderation.module");
var sanctions_module_1 = require("./modules/sanctions/sanctions.module");
var admin_module_1 = require("./modules/admin/admin.module");
var AppModule = function () {
    var _classDecorators = [(0, common_1.Module)({
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
                // Domaine
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
                // Guard global : aucune route n'est accessible sans JWT sauf @Public().
                { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
                { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
                // Intercepteurs globaux (ordre : logging → version → timeout → handler).
                { provide: core_1.APP_INTERCEPTOR, useClass: logging_interceptor_1.LoggingInterceptor },
                { provide: core_1.APP_INTERCEPTOR, useClass: api_version_interceptor_1.ApiVersionInterceptor },
                { provide: core_1.APP_INTERCEPTOR, useClass: timeout_interceptor_1.TimeoutInterceptor },
                // Traduction centralisée des erreurs en enveloppe API stable.
                { provide: core_1.APP_FILTER, useClass: all_exceptions_filter_1.AllExceptionsFilter },
            ],
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AppModule = _classThis = /** @class */ (function () {
        function AppModule_1() {
        }
        AppModule_1.prototype.configure = function (consumer) {
            consumer.apply(request_id_middleware_1.RequestIdMiddleware).forRoutes('*');
        };
        return AppModule_1;
    }());
    __setFunctionName(_classThis, "AppModule");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AppModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AppModule = _classThis;
}();
exports.AppModule = AppModule;
