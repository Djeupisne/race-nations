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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ResultValidatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultValidatorService = void 0;
const common_1 = require("@nestjs/common");
const api_contracts_1 = require("@race-nations/api-contracts");
const prisma_service_1 = require("../../prisma/prisma.service");
const clock_1 = require("../../common/utils/clock");
const safe_json_1 = require("../../common/utils/safe-json");
const signature_1 = require("../../common/utils/signature");
const domain_errors_1 = require("../../common/errors/domain-errors");
const MIN_RACE_MS = 60_000;
const MAX_RACE_MS = 30 * 60_000;
let ResultValidatorService = ResultValidatorService_1 = class ResultValidatorService {
    prisma;
    clock;
    logger = new common_1.Logger(ResultValidatorService_1.name);
    constructor(prisma, clock) {
        this.prisma = prisma;
        this.clock = clock;
    }
    async validate(rawBody, providedSignature, serverHeaderId) {
        const parsed = api_contracts_1.RaceResultBodySchema.safeParse(safeJsonOrThrow(rawBody));
        if (!parsed.success) {
            return this.trace(null, rawBody, providedSignature, false, 'SCHEMA_INVALID');
        }
        const body = parsed.data;
        const secret = process.env.GAMESERVER_SHARED_SECRET ?? 'dev-only-insecure-gameserver-secret';
        const expected = (0, signature_1.signRaw)(secret, (0, safe_json_1.stableStringify)(body));
        if (!(0, signature_1.verifySignatureConstantTime)(expected, providedSignature)) {
            return this.trace(body.matchId, rawBody, providedSignature, false, 'BAD_SIGNATURE');
        }
        if (!(0, signature_1.isTimestampFresh)(body.timestampMs, this.clock.nowMs(), 60_000)) {
            return this.trace(body.matchId, rawBody, providedSignature, false, 'STALE_TIMESTAMP');
        }
        const dupNonce = await this.prisma.resultPayload.findUnique({ where: { nonce: body.nonce }, select: { id: true } });
        if (dupNonce) {
            return { accepted: false, payloadId: dupNonce.id, reason: 'REPLAY_NONCE' };
        }
        const match = await this.prisma.match.findUnique({
            where: { id: body.matchId },
            include: { players: { select: { playerId: true } } },
        });
        if (!match)
            return this.trace(body.matchId, rawBody, providedSignature, false, 'UNKNOWN_MATCH');
        if (match.serverId !== serverHeaderId || match.serverId !== body.serverId) {
            return this.trace(body.matchId, rawBody, providedSignature, false, 'SERVER_MISMATCH');
        }
        const entrants = new Set(match.players.map((p) => p.playerId));
        const seenPositions = new Set();
        for (const row of body.rows) {
            if (!entrants.has(row.playerId))
                return this.trace(body.matchId, rawBody, providedSignature, false, 'UNKNOWN_PLAYER_IN_RESULT');
            if (seenPositions.has(row.position))
                return this.trace(body.matchId, rawBody, providedSignature, false, 'DUPLICATE_POSITION');
            seenPositions.add(row.position);
            if (row.finishMs !== null && (row.finishMs < MIN_RACE_MS || row.finishMs > MAX_RACE_MS)) {
                return this.trace(body.matchId, rawBody, providedSignature, false, 'IMPLAUSIBLE_DURATION');
            }
        }
        const payload = await this.persist(body.matchId, rawBody, providedSignature, body.nonce, true, null);
        return { accepted: true, payloadId: payload.id };
    }
    async trace(matchId, rawBody, signature, valid, reason) {
        let payloadId = '';
        if (matchId) {
            const p = await this.persist(matchId, rawBody, signature, `invalid:${Date.now()}:${reason}`, valid, reason);
            payloadId = p.id;
        }
        this.logger.warn(`Result rejected match=${matchId ?? '?'} reason=${reason}`);
        return { accepted: false, payloadId, reason };
    }
    persist(matchId, rawBody, signature, nonce, valid, invalidReason) {
        let body;
        try {
            body = JSON.parse(rawBody.slice(0, 256 * 1024));
        }
        catch {
            body = { raw: rawBody.slice(0, 1024) };
        }
        return this.prisma.resultPayload.create({
            data: { matchId, body, signature, nonce, valid, invalidReason: invalidReason ?? undefined },
        });
    }
};
exports.ResultValidatorService = ResultValidatorService;
exports.ResultValidatorService = ResultValidatorService = ResultValidatorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(clock_1.CLOCK)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], ResultValidatorService);
function safeJsonOrThrow(raw) {
    try {
        return JSON.parse(raw);
    }
    catch {
        throw new domain_errors_1.ValidationError({ field: 'body', reason: 'Invalid JSON.' });
    }
}
//# sourceMappingURL=result-validator.service.js.map