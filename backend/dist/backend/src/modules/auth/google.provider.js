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
var GoogleLoginVerifier_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleLoginVerifier = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_crypto_1 = require("node:crypto");
const domain_errors_1 = require("../../common/errors/domain-errors");
const TOKEN_URL_ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);
const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const CACHE_TTL_MS = 60 * 60 * 1000;
let GoogleLoginVerifier = GoogleLoginVerifier_1 = class GoogleLoginVerifier {
    config;
    logger = new common_1.Logger(GoogleLoginVerifier_1.name);
    cache = null;
    constructor(config) {
        this.config = config;
    }
    async verifyIdToken(idToken) {
        const [headerB64, payloadB64, sigB64] = idToken.split('.');
        if (!headerB64 || !payloadB64 || !sigB64)
            throw new domain_errors_1.AuthUnauthenticatedError();
        const header = this.decodeJson(headerB64);
        const payload = this.decodeJson(payloadB64);
        const iss = typeof payload.iss === 'string' ? payload.iss : '';
        if (!TOKEN_URL_ISSUERS.has(iss))
            throw new domain_errors_1.AuthUnauthenticatedError({}, 'Invalid issuer.');
        const clientId = this.config.get('providers.google.clientId') ?? process.env.GOOGLE_CLIENT_ID ?? '';
        if (!clientId || payload.aud !== clientId)
            throw new domain_errors_1.AuthUnauthenticatedError({}, 'Invalid audience.');
        if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) {
            throw new domain_errors_1.AuthUnauthenticatedError({}, 'Token expired.');
        }
        const jwks = await this.getKeys();
        const jwk = jwks.get(String(header.kid));
        if (!jwk)
            throw new domain_errors_1.AuthUnauthenticatedError({}, 'Unknown key id.');
        const keyObject = (0, node_crypto_1.createPublicKey)({ key: { kty: 'RSA', n: jwk.n, e: jwk.e }, format: 'jwk' });
        const signed = Buffer.from(`${headerB64}.${payloadB64}`, 'ascii');
        const signature = Buffer.from(sigB64, 'base64url');
        let ok = false;
        try {
            ok = (0, node_crypto_1.verify)('RSA-SHA256', signed, keyObject, signature);
        }
        catch {
            ok = false;
        }
        if (!ok)
            throw new domain_errors_1.AuthUnauthenticatedError({}, 'Signature verification failed.');
        return {
            sub: String(payload.sub),
            email: typeof payload.email === 'string' ? payload.email : undefined,
            name: typeof payload.name === 'string' ? payload.name : undefined,
        };
    }
    decodeJson(b64url) {
        try {
            return JSON.parse(Buffer.from(b64url, 'base64url').toString('utf8'));
        }
        catch {
            throw new domain_errors_1.AuthUnauthenticatedError();
        }
    }
    async getKeys() {
        const now = Date.now();
        if (this.cache && now - this.cache.fetchedAt < CACHE_TTL_MS)
            return this.cache.keys;
        try {
            const res = await fetch(JWKS_URL, { signal: AbortSignal.timeout(5_000) });
            if (!res.ok)
                throw new Error(`status ${res.status}`);
            const body = (await res.json());
            const map = new Map(body.keys.filter((k) => k.alg === 'RS256').map((k) => [k.kid, k]));
            this.cache = { keys: map, fetchedAt: now };
            return map;
        }
        catch (err) {
            if (this.cache) {
                this.logger.warn('Google JWKS refresh failed, using stale cache');
                return this.cache.keys;
            }
            throw new domain_errors_1.AuthUnauthenticatedError({}, 'Identity provider unavailable.');
        }
    }
};
exports.GoogleLoginVerifier = GoogleLoginVerifier;
exports.GoogleLoginVerifier = GoogleLoginVerifier = GoogleLoginVerifier_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GoogleLoginVerifier);
//# sourceMappingURL=google.provider.js.map