import { PrismaService } from '../../prisma/prisma.service';
import { type Clock } from '../../common/utils/clock';
export interface ValidationResult {
    accepted: boolean;
    payloadId: string;
    reason?: string;
}
export declare class ResultValidatorService {
    private readonly prisma;
    private readonly clock;
    private readonly logger;
    constructor(prisma: PrismaService, clock: Clock);
    validate(rawBody: string, providedSignature: string, serverHeaderId: string): Promise<ValidationResult>;
    private trace;
    private persist;
}
