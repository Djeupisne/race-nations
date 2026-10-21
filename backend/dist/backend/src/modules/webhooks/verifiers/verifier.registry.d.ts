import type { WebhookVerifier } from './verifier.interface';
export declare class VerifierRegistry {
    private readonly byPath;
    private readonly logger;
    register(verifier: WebhookVerifier): void;
    resolve(path: string): WebhookVerifier | undefined;
    registeredPaths(): string[];
    static idempotencyKey(provider: string, externalId: string): string;
}
