/**
 * RedisModule — module global exposant RedisService (client ioredis partagé).
 * Utilisé par : idempotency guard, rate limiting, outbox Redis, ws-hub.
 */
import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
