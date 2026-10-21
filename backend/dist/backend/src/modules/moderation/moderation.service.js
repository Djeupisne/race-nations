"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ModerationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const domain_errors_1 = require("../../common/errors/domain-errors");
const bannedWords = __importStar(require("./banned-words.json"));
let ModerationService = ModerationService_1 = class ModerationService {
    prisma;
    logger = new common_1.Logger(ModerationService_1.name);
    lexicon = new Map(Object.entries(bannedWords));
    constructor(prisma) {
        this.prisma = prisma;
    }
    normalize(input) {
        return input
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[0]/g, 'o')
            .replace(/[1]/g, 'i')
            .replace(/[3]/g, 'e')
            .replace(/[4]/g, 'a')
            .replace(/[5]/g, 's')
            .replace(/[7]/g, 't')
            .replace(/[^a-z]/g, '');
    }
    filterText(raw) {
        const normalized = this.normalize(raw);
        const matched = [];
        let severity = 'none';
        for (const [category, terms] of this.lexicon) {
            for (const term of terms) {
                if (normalized.includes(this.normalize(term))) {
                    matched.push(`${category}:${term}`);
                    if (category === 'pii' || category === 'cheat_ad')
                        severity = category;
                    else if (severity === 'none')
                        severity = 'toxic';
                }
            }
        }
        return { clean: matched.length === 0, matchedTerms: matched, severity };
    }
    async queue(limit = 50) {
        const cheatReports = await this.prisma.resultPayload.findMany({
            where: { valid: false },
            orderBy: { receivedAt: 'desc' },
            take: limit,
            select: { id: true, matchId: true, invalidReason: true, receivedAt: true },
        });
        return { cheatReports };
    }
    async reportDetail(payloadId) {
        const p = await this.prisma.resultPayload.findUnique({ where: { id: payloadId } });
        if (!p)
            throw new domain_errors_1.NotFoundError('ResultPayload', payloadId);
        return {
            id: p.id,
            matchId: p.matchId,
            valid: p.valid,
            invalidReason: p.invalidReason,
            receivedAt: p.receivedAt,
            body: p.body,
        };
    }
    async dismissReport(payloadId, note) {
        if (!note || note.trim().length < 5) {
            throw new domain_errors_1.ValidationError({ field: 'note', reason: 'Dismissal requires a note.' });
        }
        const p = await this.prisma.resultPayload.findUnique({ where: { id: payloadId }, select: { id: true } });
        if (!p)
            throw new domain_errors_1.NotFoundError('ResultPayload', payloadId);
        this.logger.log(`Report ${payloadId} dismissed with note: ${note.slice(0, 120)}`);
    }
};
exports.ModerationService = ModerationService;
exports.ModerationService = ModerationService = ModerationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ModerationService);
//# sourceMappingURL=moderation.service.js.map