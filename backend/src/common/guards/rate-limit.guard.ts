/**
 * RateLimitGuard — fenêtre glissante par identité (JWT playerId ou IP), en Redis.
 * Dépassement → RATE_LIMITED (429) avec Retry-After (docs/api.md §1.2).
 * Clés à faible cardinalité : rl:<bucket>:<id>. Bucket fourni par métadonnée de route
 * (@RateLimit({ bucket: 'bets.create', limit: 30, windowMs: 60_000 })).
 * Si Redis est indisponible : FAIL-CLOSED sur les routes monétaires (refus),
 * fail-open sinon — la dispo ne doit jamais créer de trou financier.
 */
import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitedError } from '../errors/domain-errors';
import { CLOCK, type Clock } from '../utils/clock';

export interface RateLimitMeta {
  bucket: string;
  limit: number;
  windowMs: number;
  /** routes monétaires : refuser si Redis KO (défaut false). */
  failClosed?: boolean;
}

export const RATE_LIMIT_META_KEY = 'ratelimit:meta';
export const rateLimit = (meta: RateLimitMeta) => (target: unknown, key?: string, desc?: PropertyDescriptor) => {
  const holder = desc ? desc.value : key ? target[key as keyof typeof target] : target;
  Reflect.defineMetadata(RATE_LIMIT_META_KEY, meta, holder as object);
};

/** Client minimal requis (ioredis expose exactement ces verbes via RedisService). */
interface SlidingWindowClient {
  eval(script: string, numKeys: number, ...args: Array<string | number>): Promise<number[] | number>;
  ping(): Promise<string>;
}

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

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    // RedisService typé structurellement pour éviter une dépendance circulaire de module.
    private readonly redis: { getClient(): SlidingWindowClient },
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.get<RateLimitMeta>(RATE_LIMIT_META_KEY, context.getHandler());
    if (!meta) return true;
    const req = context.switchToHttp().getRequest<{ user?: { playerId?: string }; ip?: string; res?: { setHeader(k: string, v: string): void } }>();
    const identity = req.user?.playerId ?? req.ip ?? 'anonymous';
    const key = `rl:${meta.bucket}:${identity}`;
    let result: number[] | number;
    try {
      result = await this.redis.getClient().eval(SLIDING_WINDOW_LUA, 1, key, String(this.clock.nowMs()), String(meta.windowMs), String(meta.limit));
    } catch {
      if (meta.failClosed) throw new RateLimitedError(Math.ceil(meta.windowMs / 1000));
      return true; // non-monétaire : disponibilité prioritaire
    }
    const [allowed, retryAfterSec] = Array.isArray(result) ? result : [result, 0];
    if (allowed !== 1) {
      req.res?.setHeader?.('Retry-After', String(retryAfterSec || Math.ceil(meta.windowMs / 1000)));
      throw new RateLimitedError(Number(retryAfterSec) || Math.ceil(meta.windowMs / 1000));
    }
    return true;
  }
}
