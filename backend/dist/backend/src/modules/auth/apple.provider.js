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
var AppleLoginVerifier_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleLoginVerifier = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_crypto_1 = require("node:crypto");
const domain_errors_1 = require("../../common/errors/domain-errors");
const ISSUER = 'https://appleid.apple.com';
const JWKS_URL = 'https://appleid.apple.com/auth/keys';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let AppleLoginVerifier = AppleLoginVerifier_1 = class AppleLoginVerifier {
    config;
    logger = new common_1.Logger(AppleLoginVerifier_1.name);
    cache = null;
    constructor(config) {
        this.config = config;
    }
    async verifyIdentityToken(idToken) {
        const parts = idToken.split('.');
        if (parts.length !== 3)
            throw new domain_errors_1.AuthUnauthenticatedError();
        let header, payload;
        try {
            header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
            payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        }
        catch {
            throw new domain_errors_1.AuthUnauthenticatedError();
        }
        if (payload.iss !== ISSUER)
            throw new domain_errors_1.AuthUnauthenticatedError({}, 'Invalid issuer.');
        const clientId = this.config.get('providers.apple.clientId') ?? process.env.APPLE_CLIENT_ID ?? '';
        if (!clientId || payload.aud !== clientId)
            throw new domain_errors_1.AuthUnauthenticatedError({}, 'Invalid audience.');
        if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
            throw new domain_errors_1.AuthUnauthenticatedError({}, 'Token expired.');
        }
        const keys = await this.getKeys();
        const jwk = keys.get(String(header.kid));
        if (!jwk)
            throw new domain_errors_1.AuthUnauthenticatedError({}, 'Unknown key id.');
        const keyObject = (0, node_crypto_1.createPublicKey)({ key: { kty: 'RSA', n: jwk.n, e: jwk.e }, format: 'jwk' });
        const ok = (0, node_crypto_1.verify)('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`, 'ascii'), keyObject, Buffer.from(parts[2], 'base64url'));
        if (!ok)
            throw new domain_errors_1.AuthUnauthenticatedError({}, 'Signature verification failed.');
        return { sub: String(payload.sub), email: payload.email };
    }
    async getKeys() {
        const now = Date.now();
        if (this.cache && now - this.cache.at < CACHE_TTL_MS)
            return this.cache.keys;
        try {
            const res = await fetch(JWKS_URL, { signal: AbortSignal.timeout(5_000) });
            if (!res.ok)
                throw new Error(`status ${res.status}`);
            const body = (await res.json());
            const map = new Map(body.keys.map((k) => [k.kid, k]));
            this.cache = { keys: map, at: now };
            return map;
        }
        catch {
            if (this.cache) {
                this.logger.warn('Apple JWKS refresh failed, using stale cache');
                return this.cache.keys;
            }
            throw new domain_errors_1.AuthUnauthenticatedError({}, 'Identity provider unavailable.');
        }
    }
};
exports.AppleLoginVerifier = AppleLoginVerifier;
exports.AppleLoginVerifier = AppleLoginVerifier = AppleLoginVerifier_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AppleLoginVerifier);
//# sourceMappingURL=apple.provider.js.map