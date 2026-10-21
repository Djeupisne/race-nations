import type { AuthenticatedUser } from '../modules/auth/auth.dto';
export declare const WS_UNAUTHORIZED_CLOSE_CODE = 4401;
export declare function verifyWsToken(secret: string, token: string | undefined): AuthenticatedUser | null;
