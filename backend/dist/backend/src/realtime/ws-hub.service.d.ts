import type { RedisService } from '../redis/redis.service';
export interface WsEnvelope {
    topic: string;
    payload: unknown;
    ts: string;
}
export declare class WsHubService {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisService);
    toUser(userId: string, topic: string, payload: unknown): Promise<void>;
    broadcast(topic: string, payload: unknown): Promise<void>;
}
