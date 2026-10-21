"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var JurisdictionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JurisdictionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const betting_errors_1 = require("../../common/errors/betting-errors");
const domain_errors_1 = require("../../common/errors/domain-errors");
const CACHE_TTL_MS = 30_000;
let JurisdictionService = JurisdictionService_1 = class JurisdictionService {
    prisma;
    logger = new common_1.Logger(JurisdictionService_1.name);
    cache = new Map();
    constructor(prisma) {
        this.prisma = prisma;
    }
    async get(countryCode) {
        const cc = this.normalize(countryCode);
        const hit = this.cache.get(cc);
        if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS)
            return hit.view;
        const row = await this.prisma.jurisdictionConfig.findUnique({ where: { countryCode: cc } });
        if (!row)
            throw new domain_errors_1.NotFoundError('JurisdictionConfig', cc);
        const view = {
            countryCode: row.countryCode,
            countryName: row.countryName,
            licenseAuthority: row.licenseAuthority,
            licenseStatus: row.licenseStatus,
            bettingActivation: row.bettingActivation,
            dailyHardLimitCents: row.dailyHardLimitCents,
            monthlyHardLimitCents: row.monthlyHardLimitCents,
            yearlyHardLimitCents: row.yearlyHardLimitCents,
        };
        this.cache.set(cc, { view, fetchedAt: Date.now() });
        return view;
    }
    async assertAllowed(countryCode, currency) {
        const view = await this.get(countryCode);
        const ok = currency === 'SOFT'
            ? view.bettingActivation === 'ENABLED_SOFT' || view.bettingActivation === 'ENABLED_HARD'
            : view.bettingActivation === 'ENABLED_HARD';
        if (!ok) {
            this.logger.warn(`Bet blocked country=${view.countryCode} currency=${currency} activation=${view.bettingActivation}`);
            throw new betting_errors_1.JurisdictionBlockedError(view.countryCode, currency);
        }
        return view;
    }
    async dailyHardLimit(countryCode) {
        const v = await this.get(countryCode);
        return v.dailyHardLimitCents;
    }
    invalidate(countryCode) {
        if (countryCode)
            this.cache.delete(this.normalize(countryCode));
        else
            this.cache.clear();
    }
    async list() {
        const rows = await this.prisma.jurisdictionConfig.findMany({ orderBy: { countryCode: 'asc' } });
        return rows.map((r) => ({
            countryCode: r.countryCode,
            countryName: r.countryName,
            licenseAuthority: r.licenseAuthority,
            licenseStatus: r.licenseStatus,
            bettingActivation: r.bettingActivation,
            dailyHardLimitCents: r.dailyHardLimitCents,
            monthlyHardLimitCents: r.monthlyHardLimitCents,
            yearlyHardLimitCents: r.yearlyHardLimitCents,
        }));
    }
    normalize(cc) {
        const up = (cc ?? '').toUpperCase().trim();
        if (!/^[A-Z]{2}$/.test(up))
            throw new domain_errors_1.NotFoundError('JurisdictionConfig', cc);
        return up;
    }
};
exports.JurisdictionService = JurisdictionService;
exports.JurisdictionService = JurisdictionService = JurisdictionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JurisdictionService);
//# sourceMappingURL=jurisdiction.service.js.map