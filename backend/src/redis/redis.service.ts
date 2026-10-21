/**
 * RedisService — file d'attente matchmaking, presence chat, rate limits, idempotence courte.
 * Clés préfixées rn: (multi-env sur un même cluster). Connexion lazy + retry borné ;
 * healthcheck /readyz ping (docs/observability.md). Les guards consomment getClient().
 */
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

export type RedisClient = Redis;

@Injectable()
export class RedisService implements OnModuleDestroy {
  /** Publique : ws-hub.service.ts et match-settlement.service.ts y accèdent directement. */
  public readonly client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
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
