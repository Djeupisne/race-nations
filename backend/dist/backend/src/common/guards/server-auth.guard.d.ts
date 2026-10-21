import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Clock } from '../utils/clock';
export declare class ServerAuthGuard implements CanActivate {
    private readonly prisma;
    private readonly clock;
    constructor(prisma: PrismaService, clock: Clock);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
