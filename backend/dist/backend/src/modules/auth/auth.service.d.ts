import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { type Clock } from '../../common/utils/clock';
import type { RegisterInput, LoginInput, VerifyAgeInput, AuthSession } from './auth.dto';
export interface TokensForUser {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    private readonly clock;
    private static readonly ACCESS_TTL_S;
    private static readonly REFRESH_TTL_S;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, clock: Clock);
    register(input: RegisterInput): Promise<TokensForUser & {
        playerId: string;
    }>;
    login(input: LoginInput): Promise<TokensForUser>;
    refresh(refreshToken: string): Promise<TokensForUser>;
    logout(refreshToken: string): Promise<void>;
    verifyAge(userId: string, input: VerifyAgeInput): Promise<{
        verified: boolean;
        verifiedAt: Date;
    }>;
    session(userId: string): Promise<AuthSession>;
    private issueTokens;
}
