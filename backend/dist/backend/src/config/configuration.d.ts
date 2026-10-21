export interface AppConfig {
    env: string;
    port: number;
    corsOrigins: string[];
    jwt: {
        accessSecret: string;
        refreshSecret: string;
        accessTtlSec: number;
        refreshTtlSec: number;
    };
    gameservers: {
        bootToken: string;
        hmacSecret: string;
    };
    betting: {
        enabled: boolean;
        depositsEnabled: boolean;
        matchmakingPaused: boolean;
    };
    providers: {
        stripe: {
            secretKey?: string;
            webhookSecret?: string;
        };
        flutterwave: {
            secretHash?: string;
        };
        google: {
            rtdnAudience?: string;
        };
        apple: {
            sharedSecret?: string;
        };
        huawei: {
            publicKey?: string;
        };
    };
}
declare const _default: () => AppConfig;
export default _default;
