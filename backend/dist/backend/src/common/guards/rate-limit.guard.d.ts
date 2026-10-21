import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Clock } from '../utils/clock';
export interface RateLimitMeta {
    bucket?: string;
    keyPrefix?: string;
    limit?: number;
    points?: number;
    windowMs?: number;
    durationMs?: number;
    windowSeconds?: number;
    failClosed?: boolean;
}
export declare const RATE_LIMIT_META_KEY = "ratelimit:meta";
export declare const rateLimit: (meta: RateLimitMeta) => (target: object, key?: string, desc?: PropertyDescriptor) => void;
interface SlidingWindowClient {
    eval(script: string, numKeys: number, ...args: Array<string | number>): Promise<number[] | number>;
    ping(): Promise<string>;
}
export declare class RateLimitGuard implements CanActivate {
    private readonly reflector;
    private readonly redis;
    private readonly clock;
    constructor(reflector: Reflector, redis: {
        getClient(): SlidingWindowClient;
    }, clock: Clock);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export {};
