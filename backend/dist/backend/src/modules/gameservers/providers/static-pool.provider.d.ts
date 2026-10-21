import type { AllocationRequest, AllocationResult, IGameServerAllocator } from './allocator.interface';
export declare class StaticPoolProvider implements IGameServerAllocator {
    allocate(_req: AllocationRequest): Promise<AllocationResult>;
    release(_infraId: string): Promise<void>;
}
