import { Strategy as PassportJwtStrategy } from 'passport-jwt';
import type { AccessTokenClaims } from '@race-nations/api-contracts';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from './auth.dto';
declare const JwtStrategy_base: new (...args: any[]) => PassportJwtStrategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prisma;
    constructor(prisma: PrismaService);
    validate(claims: AccessTokenClaims): Promise<AuthenticatedUser>;
}
export {};
