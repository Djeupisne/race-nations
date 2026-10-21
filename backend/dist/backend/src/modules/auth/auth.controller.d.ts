import { AuthService } from './auth.service';
import { type AuthenticatedUser, type LoginInput, type LogoutInput, type RefreshInput, type RegisterInput, type VerifyAgeInput } from './auth.dto';
interface WithIdempotencyKey {
    idempotencyKey?: string;
}
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    register(input: RegisterInput): Promise<{
        accessToken: string;
        refreshToken: string;
        tokenType: "Bearer";
        expiresIn: number;
        playerId: string;
    }>;
    login(input: LoginInput): Promise<{
        accessToken: string;
        refreshToken: string;
        tokenType: "Bearer";
        expiresIn: number;
    }>;
    refresh(input: RefreshInput): Promise<{
        accessToken: string;
        refreshToken: string;
        tokenType: "Bearer";
        expiresIn: number;
    }>;
    logout(input: LogoutInput): Promise<void>;
    me(user: AuthenticatedUser & WithIdempotencyKey): Promise<{
        username: string;
        countryCode: string;
        nationality: string;
        userId: string;
        role: "PLAYER" | "MODERATOR" | "ADMIN" | "SYSTEM";
        ageVerified: boolean;
        bettingHardAllowed: boolean;
        accessTokenExpiresAt: string;
    }>;
    verifyAge(user: AuthenticatedUser, input: VerifyAgeInput): Promise<{
        verified: boolean;
        verifiedAt: Date;
    }>;
}
export {};
