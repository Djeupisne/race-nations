/**
 * WsHubService — fan-out temps réel applicatif via Redis pub/sub
 * (docs/networking.md §5). Le backend n'est PAS autoritaire sur le gameplay :
 * il ne diffuse que des événements d'état (match found, odds update, wallet).
 *
 * Canaux internes : `ws:<userId>` (cible) et `ws:broadcast:<topic>`.
 * Les clients Steam/Unity se connectent au gateway WebSocket qui s'abonne
 * aux canaux de leurs userIds authentifiés (JWT vérifié au handshake).
 */
import { Injectable, Logger } from '@nestjs/common';
import type { RedisService } from '../redis/redis.service';

export interface WsEnvelope {
  topic: string;
  payload: unknown;
  ts: string;
}

@Injectable()
export class WsHubService {
  private readonly logger = new Logger(WsHubService.name);
  constructor(private readonly redis: RedisService) {}

  /** Publie vers un utilisateur précis (sa/mes connexions actives). */
  async toUser(userId: string, topic: string, payload: unknown): Promise<void> {
    const envelope: WsEnvelope = { topic, payload, ts: new Date().toISOString() };
    try {
      await this.redis.client.publish(`ws:user:${userId}`, JSON.stringify(envelope));
    } catch (err) {
      // Un échec de diffusion n'est jamais bloquant pour la logique métier.
      this.logger.warn(`ws publish failed user=${userId} topic=${topic}`);
    }
  }

  /** Publie vers tous les abonnés d'un topic (odds, queue position…). */
  async broadcast(topic: string, payload: unknown): Promise<void> {
    const envelope: WsEnvelope = { topic, payload, ts: new Date().toISOString() };
    try {
      await this.redis.client.publish(`ws:broadcast:${topic}`, JSON.stringify(envelope));
    } catch (err) {
      this.logger.warn(`ws broadcast failed topic=${topic}`);
    }
  }
}
