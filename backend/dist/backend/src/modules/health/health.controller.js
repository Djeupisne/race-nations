"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const clock_1 = require("../../common/utils/clock");
let HealthController = class HealthController {
    prisma;
    redis;
    clock;
    startedAtMs = Date.now();
    constructor(prisma, redis, clock) {
        this.prisma = prisma;
        this.redis = redis;
        this.clock = clock;
    }
    liveness(res) {
        res.status(200).json({ status: 'ok', uptimeMs: this.clock.nowMs() - this.startedAtMs });
    }
    async readiness(res) {
        const checks = { db: false, redis: false };
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            checks.db = true;
        }
        catch {
            checks.db = false;
        }
        checks.redis = await this.redis.ping();
        const healthy = checks.db && checks.redis;
        res.status(healthy ? 200 : 503).json({
            status: healthy ? 'ready' : 'not_ready',
            checks,
            version: process.env.APP_VERSION ?? 'dev',
        });
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Get)('healthz'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "liveness", null);
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Get)('readyz'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "readiness", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)(),
    __param(2, (0, common_1.Inject)(clock_1.CLOCK)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService, Object])
], HealthController);
//# sourceMappingURL=health.controller.js.map