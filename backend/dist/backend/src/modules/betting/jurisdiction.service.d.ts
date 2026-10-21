import { PrismaService } from '../../prisma/prisma.service';
export interface JurisdictionView {
    countryCode: string;
    countryName: string;
    licenseAuthority: string | null;
    licenseStatus: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DENIED';
    bettingActivation: 'DISABLED' | 'PENDING' | 'ENABLED_SOFT' | 'ENABLED_HARD';
    dailyHardLimitCents: number | null;
    monthlyHardLimitCents: number | null;
    yearlyHardLimitCents: number | null;
}
export declare class JurisdictionService {
    private readonly prisma;
    private readonly logger;
    private cache;
    constructor(prisma: PrismaService);
    get(countryCode: string): Promise<JurisdictionView>;
    assertAllowed(countryCode: string, currency: 'SOFT' | 'HARD'): Promise<JurisdictionView>;
    dailyHardLimit(countryCode: string): Promise<number | null>;
    invalidate(countryCode?: string): void;
    list(): Promise<JurisdictionView[]>;
    private normalize;
}
