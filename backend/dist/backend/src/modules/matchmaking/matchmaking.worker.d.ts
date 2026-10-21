import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GameserversService } from '../gameservers/gameservers.service';
import { type Clock } from '../../common/utils/clock';
export declare function computePlWindow(waitMs: number): number;
export declare class MatchmakingWorker implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly gameservers;
    private readonly clock;
    private readonly logger;
    private timer?;
    private running;
    private readonly config;
    constructor(prisma: PrismaService, gameservers: GameserversService, clock: Clock);
    onModuleInit(): void;
    onModuleDestroy(): void;
    tick(): Promise<void>;
    private expireStaleTickets;
    private pairMode;
    private createMatchAndAssign;
}
