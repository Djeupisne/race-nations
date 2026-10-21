import { ConfigService } from '@nestjs/config';
import type { AllocationRequest, AllocationResult, IGameServerAllocator } from './allocator.interface';
export declare class AgonesProvider implements IGameServerAllocator {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService);
    allocate(req: AllocationRequest): Promise<AllocationResult>;
    release(infraId: string): Promise<void>;
}
