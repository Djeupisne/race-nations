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
exports.FlutterwaveVerifier = void 0;
/**
 * flutterwave.verifier.ts — signature Flutterwave : verif-hash header == sha256hex(secret + rawBody)
 * (doc officielle v3). tx_ref porte l'idempotencyKey backend ; le paymentId est résolu par le service.
 */
var common_1 = require("@nestjs/common");
var node_crypto_1 = require("node:crypto");
var signature_1 = require("../../../common/utils/signature");
var FlutterwaveVerifier = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var FlutterwaveVerifier = _classThis = /** @class */ (function () {
        function FlutterwaveVerifier_1() {
            this.provider = 'FLUTTERWAVE';
            this.path = '/webhooks/flutterwave';
        }
        FlutterwaveVerifier_1.prototype.verify = function (req) {
            return __awaiter(this, void 0, void 0, function () {
                var provided, secret, raw, expected, body, externalId, status;
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
                return __generator(this, function (_m) {
                    provided = req.headers['verif-hash'];
                    if (typeof provided !== 'string')
                        return [2 /*return*/, { valid: false, reason: 'MALFORMED' }];
                    secret = (_a = process.env.FLUTTERWAVE_WEBHOOK_HASH) !== null && _a !== void 0 ? _a : '';
                    raw = (_c = (_b = req.rawBody) === null || _b === void 0 ? void 0 : _b.toString('utf8')) !== null && _c !== void 0 ? _c : JSON.stringify((_d = req.body) !== null && _d !== void 0 ? _d : {});
                    expected = (0, node_crypto_1.createHash)('sha256').update(secret + raw, 'utf8').digest('hex');
                    if (!(0, signature_1.verifySignatureConstantTime)(expected, provided))
                        return [2 /*return*/, { valid: false, reason: 'NO_MATCHING_SIGNATURE' }];
                    body = ((_e = req.body) !== null && _e !== void 0 ? _e : {});
                    externalId = String((_f = body.id) !== null && _f !== void 0 ? _f : '');
                    if (!externalId)
                        return [2 /*return*/, { valid: false, reason: 'MALFORMED' }];
                    status = (_g = body.data) === null || _g === void 0 ? void 0 : _g.status;
                    if (status === 'successful' || status === 'completed') {
                        return [2 /*return*/, { valid: true, externalId: externalId, providerRef: (_j = (_h = body.data) === null || _h === void 0 ? void 0 : _h.flw_ref) !== null && _j !== void 0 ? _j : (_k = body.data) === null || _k === void 0 ? void 0 : _k.payment_id, kind: 'PAYMENT_SUCCEEDED' }];
                    }
                    if (status === 'failed' || status === 'cancelled') {
                        return [2 /*return*/, { valid: true, externalId: externalId, providerRef: (_l = body.data) === null || _l === void 0 ? void 0 : _l.flw_ref, kind: 'PAYMENT_FAILED' }];
                    }
                    return [2 /*return*/, { valid: true, externalId: externalId, kind: 'OTHER' }];
                });
            });
        };
        return FlutterwaveVerifier_1;
    }());
    __setFunctionName(_classThis, "FlutterwaveVerifier");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FlutterwaveVerifier = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FlutterwaveVerifier = _classThis;
}();
exports.FlutterwaveVerifier = FlutterwaveVerifier;
