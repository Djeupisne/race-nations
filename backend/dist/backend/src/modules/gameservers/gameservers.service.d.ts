import type { GameServer } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { type Clock } from '../../common/utils/clock';
export declare class GameserversService {
    private readonly prisma;
    private readonly clock;
    private readonly logger;
    constructor(prisma: PrismaService, clock: Clock);
    register(input: {
        hostname: string;
        wsUrl: string;
        region: string;
        capacity?: number;
    }): Promise<GameServer>;
    allocate(region: string): Promise<{
        serverId: string;
        wsUrl: string;
    }>;
    release(serverId: string): Promise<void>;
    heartbeat(serverId: string, activeMatches: number): Promise<{
        command: string;
    }>;
    drain(serverId: string): Promise<void>;
    retire(serverId: string): Promise<void>;
    fleet(): Promise<Array<{
        id: string;
        hostname: string;
        region: string;
        status: GameServer['status'];
        activeMatches: number;
        capacity: number;
        stale: boolean;
    }>>;
}
