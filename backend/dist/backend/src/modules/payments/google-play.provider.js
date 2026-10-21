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
var GooglePlayProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GooglePlayProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const BASE = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';
let GooglePlayProvider = GooglePlayProvider_1 = class GooglePlayProvider {
    config;
    logger = new common_1.Logger(GooglePlayProvider_1.name);
    token = null;
    constructor(config) {
        this.config = config;
    }
    async verifyPurchase(packageName, sku, purchaseToken) {
        const accessToken = await this.getAccessToken();
        if (!accessToken)
            return null;
        try {
            const url = `${BASE}/${packageName}/purchases/products/${sku}/tokens/${encodeURIComponent(purchaseToken)}?access_token=${accessToken}`;
            const res = await fetch(url, { signal: AbortSignal.timeout(6_000) });
            if (!res.ok) {
                this.logger.warn(`GP verify status=${res.status}`);
                return null;
            }
            const body = (await res.json());
            return { ok: body.purchaseState === 0, ...body };
        }
        catch {
            return null;
        }
    }
    async acknowledge(packageName, sku, purchaseToken) {
        const accessToken = await this.getAccessToken();
        if (!accessToken)
            return;
        try {
            await fetch(`${BASE}/${packageName}/purchases/products/${sku}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge?access_token=${accessToken}`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(6_000) });
        }
        catch {
        }
    }
    async getAccessToken() {
        const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const pemB64 = process.env.GOOGLE_SERVICE_ACCOUNT_PEM_B64;
        if (!email || !pemB64)
            return null;
        const now = Math.floor(Date.now() / 1000);
        if (this.token && this.token.exp > now + 60)
            return this.token.value;
        try {
            const { SignJWT, importPKCS8 } = await Promise.resolve().then(() => __importStar(require('jose')));
            const pk = await importPKCS8(Buffer.from(pemB64, 'base64').toString('utf8'), 'RS256');
            const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/androidpublisher' })
                .setProtectedHeader({ alg: 'RS256' })
                .setIssuer(email)
                .setSubject(email)
                .setAudience('https://oauth2.googleapis.com/token')
                .setIssuedAt(now)
                .setExpirationTime(now + 3600)
                .sign(pk);
            const res = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }).toString(),
                signal: AbortSignal.timeout(6_000),
            });
            if (!res.ok)
                return null;
            const tok = (await res.json());
            this.token = { value: tok.access_token, exp: now + tok.expires_in };
            return tok.access_token;
        }
        catch {
            return null;
        }
    }
};
exports.GooglePlayProvider = GooglePlayProvider;
exports.GooglePlayProvider = GooglePlayProvider = GooglePlayProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GooglePlayProvider);
//# sourceMappingURL=google-play.provider.js.map