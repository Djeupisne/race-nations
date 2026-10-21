/**
 * RedisService — file d'attente matchmaking, presence chat, rate limits, idempotence courte.
 * Clés préfixées rn: (multi-env sur un même cluster). Connexion lazy + retry exponentiel ;
 * healthcheck /readyz ping (docs/observability.md). Les guards consomment getClient().
 */
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

export type RedisClient = Redis;

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor() {
    this.client = new Redis({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
      keyPrefix: 'rn:',
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false, // fail-fast pour les routes monétaires (le guard décide fail-open/closed)
      retryStrategy: (times) => Math.min(1000 * 2 ** times, 30_000),
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async ping(): Promise<boolean> {
    try {
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit().catch(() => undefined);
  }
}
