import { ConfigService } from '@nestjs/config';
export declare class GoogleLoginVerifier {
    private readonly config;
    private readonly logger;
    private cache;
    constructor(config: ConfigService);
    verifyIdToken(idToken: string): Promise<{
        sub: string;
        email?: string;
        name?: string;
    }>;
    private decodeJson;
    private getKeys;
}
