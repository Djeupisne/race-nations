import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export interface OwnershipMeta {
    model?: 'bet' | 'betMarket' | 'wallet' | 'match' | 'ticket' | 'player';
    idParam?: string;
    resource?: 'self' | 'matchParticipant' | 'bet' | 'betMarket' | 'wallet' | 'match' | 'ticket' | 'player';
}
export declare const OWNERSHIP_META_KEY = "ownership:resource";
export declare const ownership: (meta: OwnershipMeta) => <T extends object>(target: T, key?: keyof T & string, desc?: TypedPropertyDescriptor<any>) => void;
export declare class OwnershipGuard implements CanActivate {
    private readonly reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
