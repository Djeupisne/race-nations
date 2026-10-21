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
exports.RateLimitGuard = exports.rateLimit = exports.RATE_LIMIT_META_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const domain_errors_1 = require("../errors/domain-errors");
const clock_1 = require("../utils/clock");
function resolveRateLimit(meta) {
    const bucket = meta.bucket ?? meta.keyPrefix ?? 'default';
    const limit = meta.limit ?? meta.points ?? 60;
    const windowMs = meta.windowMs ?? meta.durationMs ?? (meta.windowSeconds !== undefined ? meta.windowSeconds * 1000 : 60_000);
    return { key: bucket, limit, windowMs, failClosed: meta.failClosed ?? false };
}
exports.RATE_LIMIT_META_KEY = 'ratelimit:meta';
const rateLimit = (meta) => (target, key, desc) => {
    const holder = desc ? desc.value : key ? target[key] : target;
    Reflect.defineMetadata(exports.RATE_LIMIT_META_KEY, meta, holder);
};
exports.rateLimit = rateLimit;
const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)
if count >= limit then
  local first = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retryAfter = window
  if first[2] then retryAfter = tonumber(first[2]) + window - now end
  return {0, math.max(1, math.ceil(retryAfter / 1000))}
end
redis.call('ZADD', key, now, now .. '-' .. math.random(1000000))
redis.call('PEXPIRE', key, window)
return {1, 0}
`;
let RateLimitGuard = class RateLimitGuard {
    reflector;
    redis;
    clock;
    constructor(reflector, redis, clock) {
        this.reflector = reflector;
        this.redis = redis;
        this.clock = clock;
    }
    async canActivate(context) {
        const rawMeta = this.reflector.get(exports.RATE_LIMIT_META_KEY, context.getHandler());
        if (!rawMeta)
            return true;
        const meta = resolveRateLimit(rawMeta);
        const req = context.switchToHttp().getRequest();
        const identity = req.user?.playerId ?? req.ip ?? 'anonymous';
        const key = `rl:${meta.key}:${identity}`;
        let result;
        try {
            result = await this.redis.getClient().eval(SLIDING_WINDOW_LUA, 1, key, String(this.clock.nowMs()), String(meta.windowMs), String(meta.limit));
        }
        catch {
            if (meta.failClosed)
                throw new domain_errors_1.RateLimitedError(Math.ceil(meta.windowMs / 1000));
            return true;
        }
        const [allowed, retryAfterSec] = Array.isArray(result) ? result : [result, 0];
        if (allowed !== 1) {
            req.res?.setHeader?.('Retry-After', String(retryAfterSec || Math.ceil(meta.windowMs / 1000)));
            throw new domain_errors_1.RateLimitedError(Number(retryAfterSec) || Math.ceil(meta.windowMs / 1000));
        }
        return true;
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(clock_1.CLOCK)),
    __metadata("design:paramtypes", [core_1.Reflector, Object, Object])
], RateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map