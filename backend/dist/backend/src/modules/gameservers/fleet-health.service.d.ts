import { PrismaService } from '../../prisma/prisma.service';
import { type Clock } from '../../common/utils/clock';
export declare class FleetHealthService {
    private readonly prisma;
    private readonly clock;
    private readonly logger;
    constructor(prisma: PrismaService, clock: Clock);
    sweep(): Promise<void>;
    readyCount(): Promise<number>;
}
