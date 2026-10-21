import { OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
export type RedisClient = Redis;
export declare class RedisService implements OnModuleDestroy {
    readonly client: Redis;
    constructor();
    getClient(): Redis;
    ping(): Promise<boolean>;
    onModuleDestroy(): Promise<void>;
}
