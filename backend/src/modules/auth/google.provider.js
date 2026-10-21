"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleLoginVerifier = void 0;
/**
 * GoogleLoginVerifier — vérification des ID tokens Google (OAuth login).
 * On valide : signature JWS via les clés publiques openid-configuration
 * (cache 1 h), aud == CLIENT_ID, iss ∈ {accounts.google.com, https://
 * accounts.google.com}, exp non dépassé. Aucune donnée n'est stockée sans
 * cette validation (docs/api.md §2.1). Échec = AuthUnauthenticatedError.
 */
var common_1 = require("@nestjs/common");
var node_crypto_1 = require("node:crypto");
var domain_errors_1 = require("../../common/errors/domain-errors");
var TOKEN_URL_ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);
var JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
var CACHE_TTL_MS = 60 * 60 * 1000;
var GoogleLoginVerifier = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var GoogleLoginVerifier = _classThis = /** @class */ (function () {
        function GoogleLoginVerifier_1(config) {
            this.config = config;
            this.logger = new common_1.Logger(GoogleLoginVerifier.name);
            this.cache = null;
        }
        GoogleLoginVerifier_1.prototype.verifyIdToken = function (idToken) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, headerB64, payloadB64, sigB64, header, payload, clientId, jwks, jwk, keyObject, signed, signature, ok;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            _a = idToken.split('.'), headerB64 = _a[0], payloadB64 = _a[1], sigB64 = _a[2];
                            if (!headerB64 || !payloadB64 || !sigB64)
                                throw new domain_errors_1.AuthUnauthenticatedError();
                            header = this.decodeJson(headerB64);
                            payload = this.decodeJson(payloadB64);
                            // Claims obligatoires
                            if (!TOKEN_URL_ISSUERS.has(payload.iss))
                                throw new domain_errors_1.AuthUnauthenticatedError({}, 'Invalid issuer.');
                            clientId = (_c = (_b = this.config.get('providers.google.clientId')) !== null && _b !== void 0 ? _b : process.env.GOOGLE_CLIENT_ID) !== null && _c !== void 0 ? _c : '';
                            if (!clientId || payload.aud !== clientId)
                                throw new domain_errors_1.AuthUnauthenticatedError({}, 'Invalid audience.');
                            if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) {
                                throw new domain_errors_1.AuthUnauthenticatedError({}, 'Token expired.');
                            }
                            return [4 /*yield*/, this.getKeys()];
                        case 1:
                            jwks = _d.sent();
                            jwk = jwks.get(String(header.kid));
                            if (!jwk)
                                throw new domain_errors_1.AuthUnauthenticatedError({}, 'Unknown key id.');
                            keyObject = (0, node_crypto_1.createPublicKey)({ key: { kty: 'RSA', n: jwk.n, e: jwk.e }, format: 'jwk' });
                            signed = Buffer.from("".concat(headerB64, ".").concat(payloadB64), 'ascii');
                            signature = Buffer.from(sigB64, 'base64url');
                            ok = false;
                            try {
                                ok = (0, node_crypto_1.verify)('RSA-SHA256', signed, keyObject, signature);
                            }
                            catch (_e) {
                                ok = false;
                            }
                            if (!ok)
                                throw new domain_errors_1.AuthUnauthenticatedError({}, 'Signature verification failed.');
                            return [2 /*return*/, { sub: String(payload.sub), email: payload.email, name: payload.name }];
                    }
                });
            });
        };
        GoogleLoginVerifier_1.prototype.decodeJson = function (b64url) {
            try {
                return JSON.parse(Buffer.from(b64url, 'base64url').toString('utf8'));
            }
            catch (_a) {
                throw new domain_errors_1.AuthUnauthenticatedError();
            }
        };
        GoogleLoginVerifier_1.prototype.getKeys = function () {
            return __awaiter(this, void 0, void 0, function () {
                var now, res, body, map, err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            now = Date.now();
                            if (this.cache && now - this.cache.fetchedAt < CACHE_TTL_MS)
                                return [2 /*return*/, this.cache.keys];
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, , 5]);
                            return [4 /*yield*/, fetch(JWKS_URL, { signal: AbortSignal.timeout(5000) })];
                        case 2:
                            res = _a.sent();
                            if (!res.ok)
                                throw new Error("status ".concat(res.status));
                            return [4 /*yield*/, res.json()];
                        case 3:
                            body = (_a.sent());
                            map = new Map(body.keys.filter(function (k) { return k.alg === 'RS256'; }).map(function (k) { return [k.kid, k]; }));
                            this.cache = { keys: map, fetchedAt: now };
                            return [2 /*return*/, map];
                        case 4:
                            err_1 = _a.sent();
                            // En cas d'indisibilité Google, on réutilise un cache périmé plutôt
                            // que de bloquer tous les logins — mais jamais on n'accepte sans clé.
                            if (this.cache) {
                                this.logger.warn('Google JWKS refresh failed, using stale cache');
                                return [2 /*return*/, this.cache.keys];
                            }
                            throw new domain_errors_1.AuthUnauthenticatedError({}, 'Identity provider unavailable.');
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        return GoogleLoginVerifier_1;
    }());
    __setFunctionName(_classThis, "GoogleLoginVerifier");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        GoogleLoginVerifier = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return GoogleLoginVerifier = _classThis;
}();
exports.GoogleLoginVerifier = GoogleLoginVerifier;
