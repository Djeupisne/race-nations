"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.WebhooksService = void 0;
/**
 * webhooks.service.ts — ingestion idempotente des webhooks (INV-04, INV-23, INV-26).
 *
 * Pipeline :
 *   1. verifier (registre DI) → verdict signature (timing-safe, fenêtre timestamp) ;
 *   2. persistance WebhookEvent avec clé d'idempotence `<PROVIDER>:<externalId>` UNIQUE ;
 *      doublon → relecture de l'événement existant, AUCUN second effet de bord (INV-04) ;
 *   3. exécution métier si valid && !processedAt :
 *        PAYMENT_SUCCEEDED → payments.markSucceeded (credit ledger `deposit:<paymentId>`)
 *        PAYMENT_FAILED    → payments.markTerminalFailure
 *   4. P2002 sur la clé = course entre deux livraisons simultanées → treat as replay.
 *
 * Un webhook INVALIDE est tracé (signatureValid=false) et renvoie 200 quand même au
 * provider pour éviter les tempêtes de retry — le runbook alerte sur le taux d'échec.
 */
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var verifier_registry_1 = require("./verifiers/verifier.registry");
var safe_json_1 = require("../../common/utils/safe-json");
var domain_errors_1 = require("../../common/errors/domain-errors");
var WebhooksService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var WebhooksService = _classThis = /** @class */ (function () {
        function WebhooksService_1(prisma, payments, registry) {
            this.prisma = prisma;
            this.payments = payments;
            this.registry = registry;
            this.logger = new common_1.Logger(WebhooksService.name);
        }
        /** Point d'entrée du controller : chemin → verifier → verdict → trace → métier. */
        WebhooksService_1.prototype.ingest = function (path, req) {
            return __awaiter(this, void 0, void 0, function () {
                var verifier, raw, verdict, externalId, idemKey, event, duplicate, e_1;
                var _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            verifier = this.registry.resolve(path);
                            if (!verifier)
                                throw new domain_errors_1.NotFoundError('WebhookEndpoint', path);
                            raw = req.rawBody;
                            if (raw && raw.byteLength > safe_json_1.MAX_PAYLOAD_BYTES) {
                                // Payload trop volumineux : rejet sec avant tout parsing (anti DoS, safe-json §limite).
                                return [2 /*return*/, { accepted: false, duplicate: false, eventId: '', reason: 'PAYLOAD_TOO_LARGE' }];
                            }
                            if (req.body === undefined || req.body === null) {
                                void (0, safe_json_1.safeJsonParse)((_a = raw === null || raw === void 0 ? void 0 : raw.toString('utf8')) !== null && _a !== void 0 ? _a : ''); // normalise/garde — parse express a déjà eu lieu
                            }
                            return [4 /*yield*/, verifier.verify(req)];
                        case 1:
                            verdict = _e.sent();
                            externalId = (_b = verdict.externalId) !== null && _b !== void 0 ? _b : "noid-".concat(Date.now());
                            idemKey = verifier_registry_1.VerifierRegistry.idempotencyKey(verifier.provider, externalId);
                            return [4 /*yield*/, this.prisma.webhookEvent.findUnique({ where: { idempotencyKey: idemKey } })];
                        case 2:
                            event = _e.sent();
                            duplicate = true;
                            if (!!event) return [3 /*break*/, 9];
                            _e.label = 3;
                        case 3:
                            _e.trys.push([3, 5, , 9]);
                            return [4 /*yield*/, this.prisma.webhookEvent.create({
                                    data: {
                                        provider: verifier.provider,
                                        externalId: externalId,
                                        idempotencyKey: idemKey,
                                        payload: ((_c = req.body) !== null && _c !== void 0 ? _c : {}),
                                        signatureValid: verdict.valid,
                                    },
                                })];
                        case 4:
                            event = _e.sent();
                            duplicate = false;
                            return [3 /*break*/, 9];
                        case 5:
                            e_1 = _e.sent();
                            if (!(e_1 instanceof client_1.Prisma.PrismaClientKnownRequestError && e_1.code === 'P2002')) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.prisma.webhookEvent.findUnique({ where: { idempotencyKey: idemKey } })];
                        case 6:
                            // Course : un livreur parallèle a inséré pendant notre lecture → replay.
                            event = _e.sent();
                            duplicate = true;
                            return [3 /*break*/, 8];
                        case 7: throw e_1;
                        case 8: return [3 /*break*/, 9];
                        case 9:
                            if (!event)
                                throw new ServerTraceMissing(); // impossible en pratique — garde typage
                            if (!verdict.valid) {
                                this.logger.warn("Webhook ".concat(verifier.provider, " signature rejected: ").concat((_d = verdict.reason) !== null && _d !== void 0 ? _d : 'unknown', " (event=").concat(event.id, ")"));
                                return [2 /*return*/, { accepted: false, duplicate: duplicate, eventId: event.id, reason: verdict.reason }];
                            }
                            if (event.processedAt) {
                                return [2 /*return*/, { accepted: true, duplicate: true, eventId: event.id }]; // déjà traité → no-op
                            }
                            // --- Exécution métier (idempotente en elle-même via clés ledger) ---
                            return [4 /*yield*/, this.runBusiness(verifier.provider, verdict)];
                        case 10:
                            // --- Exécution métier (idempotente en elle-même via clés ledger) ---
                            _e.sent();
                            return [4 /*yield*/, this.prisma.webhookEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } })];
                        case 11:
                            _e.sent();
                            return [2 /*return*/, { accepted: true, duplicate: duplicate, eventId: event.id }];
                    }
                });
            });
        };
        /** Résout le paymentId backend puis applique la transition paiement. */
        WebhooksService_1.prototype.runBusiness = function (provider, verdict) {
            return __awaiter(this, void 0, void 0, function () {
                var paymentId, p, p;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (verdict.kind !== 'PAYMENT_SUCCEEDED' && verdict.kind !== 'PAYMENT_FAILED')
                                return [2 /*return*/];
                            paymentId = verdict.paymentId;
                            if (!(!paymentId && verdict.providerRef)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.prisma.payment.findFirst({ where: { providerRef: verdict.providerRef }, select: { id: true } })];
                        case 1:
                            p = _b.sent();
                            paymentId = p === null || p === void 0 ? void 0 : p.id;
                            _b.label = 2;
                        case 2:
                            if (!(!paymentId && provider === 'FLUTTERWAVE' && verdict.externalId)) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.prisma.payment.findFirst({ where: { idempotencyKey: "".concat(verdict.externalId).slice(0, 128) }, select: { id: true } })];
                        case 3:
                            p = _b.sent();
                            paymentId = p === null || p === void 0 ? void 0 : p.id;
                            _b.label = 4;
                        case 4:
                            if (!paymentId) {
                                this.logger.error("Webhook ".concat(provider, ": cannot resolve payment for event ").concat(verdict.externalId, " \u2014 manual reconciliation needed"));
                                return [2 /*return*/]; // tracé, non marqué processed implicite ? -> on marque processed + failureReason ci-dessous
                            }
                            if (!(verdict.kind === 'PAYMENT_SUCCEEDED')) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.payments.markSucceeded(paymentId, (_a = verdict.providerRef) !== null && _a !== void 0 ? _a : '')];
                        case 5:
                            _b.sent();
                            return [3 /*break*/, 8];
                        case 6: return [4 /*yield*/, this.payments.markTerminalFailure(paymentId, 'FAILED')];
                        case 7:
                            _b.sent();
                            _b.label = 8;
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        /** Back-office : liste des événements récents par provider (audit/modération). */
        WebhooksService_1.prototype.recent = function (provider, limit) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.webhookEvent.findMany({
                            where: provider ? { provider: provider } : {},
                            orderBy: { receivedAt: 'desc' },
                            take: Math.min(Math.max(limit, 1), 100),
                            select: { id: true, provider: true, externalId: true, signatureValid: true, processedAt: true, receivedAt: true, failureReason: true },
                        })];
                });
            });
        };
        return WebhooksService_1;
    }());
    __setFunctionName(_classThis, "WebhooksService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WebhooksService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WebhooksService = _classThis;
}();
exports.WebhooksService = WebhooksService;
/** Garde interne : trace introuvable après insert (ne doit jamais arriver). */
var ServerTraceMissing = /** @class */ (function (_super) {
    __extends(ServerTraceMissing, _super);
    function ServerTraceMissing() {
        var _this = _super.call(this, 'webhook trace missing after create') || this;
        _this.name = 'ServerTraceMissing';
        return _this;
    }
    return ServerTraceMissing;
}(Error));
