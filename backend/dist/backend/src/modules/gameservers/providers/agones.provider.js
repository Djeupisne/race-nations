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
var AgonesProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgonesProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_crypto_1 = require("node:crypto");
const AGONES_NS = 'agones-system';
const API_TIMEOUT_MS = 4_000;
let AgonesProvider = AgonesProvider_1 = class AgonesProvider {
    config;
    logger = new common_1.Logger(AgonesProvider_1.name);
    constructor(config) {
        this.config = config;
    }
    async allocate(req) {
        const api = this.config.get('gameservers.agonesApiUrl');
        const token = this.config.get('gameservers.agonesToken');
        if (!api || !token)
            throw new Error('Agones not configured');
        const fleet = `race-nations-${req.region.toLowerCase()}`;
        const url = `${api}/apis/agones.dev/v1/namespaces/${AGONES_NS}/gameservers?labelSelector=matchmaker.io%2Fpool%3D${fleet}&fieldSelector=status.state%3DReady`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(API_TIMEOUT_MS),
        });
        if (!res.ok) {
            this.logger.warn(`Agones list failed status=${res.status} region=${req.region}`);
            throw new Error('No capacity available');
        }
        const body = (await res.json());
        const gs = body.items?.[0];
        if (!gs)
            throw new Error('No Ready GameServer in fleet');
        return {
            address: gs.status.address,
            port: gs.status.ports[0]?.port ?? 7777,
            serverToken: (0, node_crypto_1.randomBytes)(24).toString('hex'),
            infraId: gs.metadata.name,
        };
    }
    async release(infraId) {
        const api = this.config.get('gameservers.agonesApiUrl');
        const token = this.config.get('gameservers.agonesToken');
        if (!api || !token)
            return;
        try {
            await fetch(`${api}/apis/agones.dev/v1/namespaces/${AGONES_NS}/gameservers/${infraId}/shutdown`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(API_TIMEOUT_MS) });
        }
        catch (err) {
            this.logger.warn(`Agones shutdown failed id=${infraId}`);
        }
    }
};
exports.AgonesProvider = AgonesProvider;
exports.AgonesProvider = AgonesProvider = AgonesProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AgonesProvider);
//# sourceMappingURL=agones.provider.js.map