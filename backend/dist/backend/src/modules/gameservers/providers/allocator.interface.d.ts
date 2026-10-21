export interface AllocationRequest {
    matchId: string;
    region: string;
    maxPlayers: number;
}
export interface AllocationResult {
    address: string;
    port: number;
    serverToken: string;
    infraId: string;
}
export declare const GAME_SERVER_ALLOCATOR = "GAME_SERVER_ALLOCATOR";
export interface IGameServerAllocator {
    allocate(req: AllocationRequest): Promise<AllocationResult>;
    release(infraId: string): Promise<void>;
}
