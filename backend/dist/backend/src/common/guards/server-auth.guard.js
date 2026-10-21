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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const signature_1 = require("../utils/signature");
const clock_1 = require("../utils/clock");
const common_2 = require("@nestjs/common");
const domain_errors_1 = require("../errors/domain-errors");
let ServerAuthGuard = class ServerAuthGuard {
    prisma;
    clock;
    constructor(prisma, clock) {
        this.prisma = prisma;
        this.clock = clock;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const serverId = req.headers['x-gameserver-id'];
        const timestamp = req.headers['x-gameserver-timestamp'];
        const signature = req.headers['x-gameserver-signature'];
        if (typeof serverId !== 'string' || typeof timestamp !== 'string' || typeof signature !== 'string') {
            throw new domain_errors_1.ValidationError({ field: 'X-Gameserver-*', reason: 'Id/Timestamp/Signature headers required.' });
        }
        const ts = Number(timestamp);
        if (!Number.isInteger(ts) || !(0, signature_1.isTimestampFresh)(ts, this.clock.nowMs(), 120_000)) {
            throw new domain_errors_1.ValidationError({ field: 'X-Gameserver-Timestamp', reason: 'Stale or malformed timestamp.' });
        }
        const server = await this.prisma.gameServer.findUnique({ where: { id: serverId }, select: { id: true, status: true, sharedSecretRef: true } });
        if (!server || server.status === 'OFFLINE')
            throw new domain_errors_1.AuthUnauthenticatedError();
        const secret = process.env.GAMESERVER_SHARED_SECRET ?? 'dev-only-insecure-gameserver-secret';
        const raw = req.rawBody?.toString('utf8') ?? '';
        if (!(0, signature_1.verifySignedHeader)(`t=${ts},v1=${signature}`, raw, secret, this.clock.nowMs(), 120_000).valid) {
            throw new domain_errors_1.AuthUnauthenticatedError();
        }
        req.gameServerId = server.id;
        return true;
    }
};
exports.ServerAuthGuard = ServerAuthGuard;
exports.ServerAuthGuard = ServerAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_2.Inject)(clock_1.CLOCK)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], ServerAuthGuard);
//# sourceMappingURL=server-auth.guard.js.map