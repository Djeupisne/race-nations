import type { Request, Response } from 'express';
import { WebhooksService } from './webhooks.service';
export declare class WebhooksController {
    private readonly webhooks;
    constructor(webhooks: WebhooksService);
    stripe(req: Request, res: Response): Promise<import("./webhooks.service").IngestResult>;
    flutterwave(req: Request): Promise<import("./webhooks.service").IngestResult>;
    googlePlay(req: Request): Promise<import("./webhooks.service").IngestResult>;
    apple(req: Request): Promise<import("./webhooks.service").IngestResult>;
    huawei(req: Request): Promise<import("./webhooks.service").IngestResult>;
    recent(provider?: string, limit?: string): Promise<{
        id: string;
        receivedAt: Date;
        provider: string;
        externalId: string;
        signatureValid: boolean;
        processedAt: Date | null;
        failureReason: string | null;
    }[]>;
    echo(body: unknown): Promise<{
        received: boolean;
    }>;
}
