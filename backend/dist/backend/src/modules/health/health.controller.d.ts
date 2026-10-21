import type { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { type Clock } from '../../common/utils/clock';
export declare class HealthController {
    private readonly prisma;
    private readonly redis;
    private readonly clock;
    private startedAtMs;
    constructor(prisma: PrismaService, redis: RedisService, clock: Clock);
    liveness(res: Response): void;
    readiness(res: Response): Promise<void>;
}
