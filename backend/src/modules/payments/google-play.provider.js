"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.GooglePlayProvider = void 0;
/**
 * GooglePlayProvider — vérification des achats in-app Android (RTDN).
 * La commande est déclenchée par le notification Pub/Sub (webhooks.service) ;
 * ici on re-vérifie AUPRÈS DE Google que le purchase est bien :
 *   - purchased (state 0), pas encore consommé/acknowledgé,
 *   - lié à NOTRE orderId (oneTimeProductAcknowledgement + orderId stocké).
 * Sans cette double vérification, un JWT volé créditerait des wallets.
 * Retourne null si le purchase n'est pas éligible au crédit.
 */
var common_1 = require("@nestjs/common");
var BASE = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';
var GooglePlayProvider = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var GooglePlayProvider = _classThis = /** @class */ (function () {
        function GooglePlayProvider_1(config) {
            this.config = config;
            this.logger = new common_1.Logger(GooglePlayProvider.name);
            this.token = null;
        }
        GooglePlayProvider_1.prototype.verifyPurchase = function (packageName, sku, purchaseToken) {
            return __awaiter(this, void 0, void 0, function () {
                var accessToken, url, res, body, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAccessToken()];
                        case 1:
                            accessToken = _b.sent();
                            if (!accessToken)
                                return [2 /*return*/, null];
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 5, , 6]);
                            url = "".concat(BASE, "/").concat(packageName, "/purchases/products/").concat(sku, "/tokens/").concat(encodeURIComponent(purchaseToken), "?access_token=").concat(accessToken);
                            return [4 /*yield*/, fetch(url, { signal: AbortSignal.timeout(6000) })];
                        case 3:
                            res = _b.sent();
                            if (!res.ok) {
                                this.logger.warn("GP verify status=".concat(res.status));
                                return [2 /*return*/, null];
                            }
                            return [4 /*yield*/, res.json()];
                        case 4:
                            body = (_b.sent());
                            return [2 /*return*/, __assign({ ok: body.purchaseState === 0 }, body)];
                        case 5:
                            _a = _b.sent();
                            return [2 /*return*/, null]; // fail-closed : indistinguable = pas de crédit
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        /** Acknowledge (empêche le remboursement auto après 3 j). Best-effort. */
        GooglePlayProvider_1.prototype.acknowledge = function (packageName, sku, purchaseToken) {
            return __awaiter(this, void 0, void 0, function () {
                var accessToken, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAccessToken()];
                        case 1:
                            accessToken = _b.sent();
                            if (!accessToken)
                                return [2 /*return*/];
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, fetch("".concat(BASE, "/").concat(packageName, "/purchases/products/").concat(sku, "/tokens/").concat(encodeURIComponent(purchaseToken), ":acknowledge?access_token=").concat(accessToken), { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(6000) })];
                        case 3:
                            _b.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            _a = _b.sent();
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        GooglePlayProvider_1.prototype.getAccessToken = function () {
            return __awaiter(this, void 0, void 0, function () {
                var email, pemB64, now, _a, SignJWT, importPKCS8, pk, assertion, res, tok, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
                            pemB64 = process.env.GOOGLE_SERVICE_ACCOUNT_PEM_B64;
                            if (!email || !pemB64)
                                return [2 /*return*/, null];
                            now = Math.floor(Date.now() / 1000);
                            if (this.token && this.token.exp > now + 60)
                                return [2 /*return*/, this.token.value];
                            _c.label = 1;
                        case 1:
                            _c.trys.push([1, 7, , 8]);
                            return [4 /*yield*/, Promise.resolve().then(function () { return require('jose'); })];
                        case 2:
                            _a = _c.sent(), SignJWT = _a.SignJWT, importPKCS8 = _a.importPKCS8;
                            return [4 /*yield*/, importPKCS8(Buffer.from(pemB64, 'base64').toString('utf8'), 'RS256')];
                        case 3:
                            pk = _c.sent();
                            return [4 /*yield*/, new SignJWT({ scope: 'https://www.googleapis.com/auth/androidpublisher' })
                                    .setProtectedHeader({ alg: 'RS256' })
                                    .setIssuer(email)
                                    .setSubject(email)
                                    .setAudience('https://oauth2.googleapis.com/token')
                                    .setIssuedAt(now)
                                    .setExpirationTime(now + 3600)
                                    .sign(pk)];
                        case 4:
                            assertion = _c.sent();
                            return [4 /*yield*/, fetch('https://oauth2.googleapis.com/token', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: assertion }).toString(),
                                    signal: AbortSignal.timeout(6000),
                                })];
                        case 5:
                            res = _c.sent();
                            if (!res.ok)
                                return [2 /*return*/, null];
                            return [4 /*yield*/, res.json()];
                        case 6:
                            tok = (_c.sent());
                            this.token = { value: tok.access_token, exp: now + tok.expires_in };
                            return [2 /*return*/, tok.access_token];
                        case 7:
                            _b = _c.sent();
                            return [2 /*return*/, null];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        return GooglePlayProvider_1;
    }());
    __setFunctionName(_classThis, "GooglePlayProvider");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        GooglePlayProvider = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return GooglePlayProvider = _classThis;
}();
exports.GooglePlayProvider = GooglePlayProvider;
