import { ConfigService } from '@nestjs/config';
export declare class AppleLoginVerifier {
    private readonly config;
    private readonly logger;
    private cache;
    constructor(config: ConfigService);
    verifyIdentityToken(idToken: string): Promise<{
        sub: string;
        email?: string;
    }>;
    private getKeys;
}
