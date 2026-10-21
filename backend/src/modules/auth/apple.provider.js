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
exports.AppleLoginVerifier = void 0;
/**
 * AppleLoginVerifier — vérification des identity tokens Sign in with Apple.
 * JWT RS256 signé par l'alg-id Apple (aud = notre CLIENT_ID, iss =
 * https://appleid.apple.com). Clés publiques JWKS cachées 6 h. Le sub
 * (underlying identifier) est stable et sert de clé d'account-linking.
 */
var common_1 = require("@nestjs/common");
var node_crypto_1 = require("node:crypto");
var domain_errors_1 = require("../../common/errors/domain-errors");
var ISSUER = 'https://appleid.apple.com';
var JWKS_URL = 'https://appleid.apple.com/auth/keys';
var CACHE_TTL_MS = 6 * 60 * 60 * 1000;
var AppleLoginVerifier = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AppleLoginVerifier = _classThis = /** @class */ (function () {
        function AppleLoginVerifier_1(config) {
            this.config = config;
            this.logger = new common_1.Logger(AppleLoginVerifier.name);
            this.cache = null;
        }
        AppleLoginVerifier_1.prototype.verifyIdentityToken = function (idToken) {
            return __awaiter(this, void 0, void 0, function () {
                var parts, header, payload, clientId, keys, jwk, keyObject, ok;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            parts = idToken.split('.');
                            if (parts.length !== 3)
                                throw new domain_errors_1.AuthUnauthenticatedError();
                            try {
                                header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
                                payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
                            }
                            catch (_d) {
                                throw new domain_errors_1.AuthUnauthenticatedError();
                            }
                            if (payload.iss !== ISSUER)
                                throw new domain_errors_1.AuthUnauthenticatedError({}, 'Invalid issuer.');
                            clientId = (_b = (_a = this.config.get('providers.apple.clientId')) !== null && _a !== void 0 ? _a : process.env.APPLE_CLIENT_ID) !== null && _b !== void 0 ? _b : '';
                            if (!clientId || payload.aud !== clientId)
                                throw new domain_errors_1.AuthUnauthenticatedError({}, 'Invalid audience.');
                            if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
                                throw new domain_errors_1.AuthUnauthenticatedError({}, 'Token expired.');
                            }
                            return [4 /*yield*/, this.getKeys()];
                        case 1:
                            keys = _c.sent();
                            jwk = keys.get(String(header.kid));
                            if (!jwk)
                                throw new domain_errors_1.AuthUnauthenticatedError({}, 'Unknown key id.');
                            keyObject = (0, node_crypto_1.createPublicKey)({ key: { kty: 'RSA', n: jwk.n, e: jwk.e }, format: 'jwk' });
                            ok = (0, node_crypto_1.verify)('RSA-SHA256', Buffer.from("".concat(parts[0], ".").concat(parts[1]), 'ascii'), keyObject, Buffer.from(parts[2], 'base64url'));
                            if (!ok)
                                throw new domain_errors_1.AuthUnauthenticatedError({}, 'Signature verification failed.');
                            return [2 /*return*/, { sub: String(payload.sub), email: payload.email }];
                    }
                });
            });
        };
        AppleLoginVerifier_1.prototype.getKeys = function () {
            return __awaiter(this, void 0, void 0, function () {
                var now, res, body, map, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            now = Date.now();
                            if (this.cache && now - this.cache.at < CACHE_TTL_MS)
                                return [2 /*return*/, this.cache.keys];
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 4, , 5]);
                            return [4 /*yield*/, fetch(JWKS_URL, { signal: AbortSignal.timeout(5000) })];
                        case 2:
                            res = _b.sent();
                            if (!res.ok)
                                throw new Error("status ".concat(res.status));
                            return [4 /*yield*/, res.json()];
                        case 3:
                            body = (_b.sent());
                            map = new Map(body.keys.map(function (k) { return [k.kid, k]; }));
                            this.cache = { keys: map, at: now };
                            return [2 /*return*/, map];
                        case 4:
                            _a = _b.sent();
                            if (this.cache) {
                                this.logger.warn('Apple JWKS refresh failed, using stale cache');
                                return [2 /*return*/, this.cache.keys];
                            }
                            throw new domain_errors_1.AuthUnauthenticatedError({}, 'Identity provider unavailable.');
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        return AppleLoginVerifier_1;
    }());
    __setFunctionName(_classThis, "AppleLoginVerifier");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AppleLoginVerifier = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AppleLoginVerifier = _classThis;
}();
exports.AppleLoginVerifier = AppleLoginVerifier;
