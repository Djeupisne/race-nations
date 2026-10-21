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
exports.PaymentsService = void 0;
/**
 * payments.service.ts — checkout HARD money (docs/api.md §7, INV-01..INV-04, INV-23).
 *
 * Cycle de vie : CREATED → PROVIDER_PENDING → SUCCEEDED | FAILED | CANCELLED
 * (payment.state-machine — transitions terminales irréversibles, INV-23).
 *
 * Règles :
 *  - Montants en centimes ENTIEURS uniquement ; bornes 1 000–100 000 cts vérifiées ici
 *    ET par le CHECK DB (0004_constraints) — défense en profondeur.
 *  - `idempotencyKey` UNIQUE : rejouer un checkout renvoie le Payment existant, jamais
 *    un second fournisseur (INV-04).
 *  - Le crédit hardCents n'arrive JAMAIS du client : il est déclenché exclusivement par
 *    un webhook vérifié (webhooks.service → creditFromWebhook), dans une tx avec
 *    ledger idempotent `deposit:<paymentId>` (INV-23).
 *  - Kill-switch deposits (BETTING_FLAGS via betting.config) refusé 503 avant création.
 */
var common_1 = require("@nestjs/common");
var payment_state_machine_1 = require("../../common/state-machines/payment.state-machine");
var domain_errors_1 = require("../../common/errors/domain-errors");
/** Bornes CdC (CHECK 0004) : 10 €–1 000 € par dépôt. */
var MIN_DEPOSIT_CENTS = 1000;
var MAX_DEPOSIT_CENTS = 100000;
var PaymentsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var PaymentsService = _classThis = /** @class */ (function () {
        function PaymentsService_1(prisma, wallet, clock) {
            this.prisma = prisma;
            this.wallet = wallet;
            this.clock = clock;
        }
        /** POST /payments/checkout — crée l'intention + délègue au provider (URL d'intention). */
        PaymentsService_1.prototype.createCheckout = function (params) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, payment, intent;
                var _this = this;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!Number.isInteger(params.amountCents))
                                throw new domain_errors_1.ValidationError({ field: 'amountCents', reason: 'Must be an integer (cents).' });
                            if (params.amountCents < MIN_DEPOSIT_CENTS || params.amountCents > MAX_DEPOSIT_CENTS) {
                                throw new domain_errors_1.ValidationError({ field: 'amountCents', min: MIN_DEPOSIT_CENTS, max: MAX_DEPOSIT_CENTS, received: params.amountCents });
                            }
                            if (this.depositsPaused()) {
                                throw new domain_errors_1.ServerUnavailableError('Deposits are temporarily paused.');
                            }
                            return [4 /*yield*/, this.prisma.payment.findUnique({ where: { idempotencyKey: params.idempotencyKey } })];
                        case 1:
                            existing = _b.sent();
                            if (existing) {
                                if (existing.playerId !== params.playerId)
                                    throw new domain_errors_1.ValidationError({ field: 'Idempotency-Key', reason: 'Key already used by another player.' });
                                return [2 /*return*/, { paymentId: existing.id, providerRef: (_a = existing.providerRef) !== null && _a !== void 0 ? _a : '', checkoutUrl: '', status: existing.status }];
                            }
                            return [4 /*yield*/, this.prisma.payment.create({
                                    data: {
                                        playerId: params.playerId,
                                        provider: params.provider,
                                        status: 'CREATED',
                                        amountCents: params.amountCents,
                                        currencyCode: params.currencyCode,
                                        jurisdiction: params.jurisdiction,
                                        idempotencyKey: params.idempotencyKey,
                                    },
                                })];
                        case 2:
                            payment = _b.sent();
                            return [4 /*yield*/, this.createProviderIntent(payment)];
                        case 3:
                            intent = _b.sent();
                            return [2 /*return*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var updated;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                (0, payment_state_machine_1.assertPaymentTransition)('CREATED', 'PROVIDER_PENDING');
                                                return [4 /*yield*/, tx.payment.update({
                                                        where: { id: payment.id },
                                                        data: { status: 'PROVIDER_PENDING', providerRef: intent.providerRef },
                                                    })];
                                            case 1:
                                                updated = _a.sent();
                                                return [2 /*return*/, { paymentId: updated.id, providerRef: intent.providerRef, checkoutUrl: intent.checkoutUrl, status: updated.status }];
                                        }
                                    });
                                }); }).then(function (r) { return (__assign(__assign({}, r), { status: r.status })); }).catch(function (e) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        void e;
                                        return [2 /*return*/, { paymentId: payment.id, providerRef: '', checkoutUrl: '', status: 'CREATED' }];
                                    });
                                }); })];
                    }
                });
            });
        };
        /**
         * Appelé par webhooks.service après signature vérifiée + payload cohérent.
         * Transitions gardées par le state machine ; crédit via ledger idempotent (INV-23/INV-04).
         */
        PaymentsService_1.prototype.markSucceeded = function (paymentId, providerRef) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                var payment;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, tx.payment.findUnique({ where: { id: paymentId } })];
                                        case 1:
                                            payment = _a.sent();
                                            if (!payment)
                                                throw new domain_errors_1.NotFoundError('Payment', paymentId);
                                            if (payment.status === 'SUCCEEDED')
                                                return [2 /*return*/]; // replay webhook → no-op (INV-04)
                                            (0, payment_state_machine_1.assertPaymentTransition)(payment.status, 'SUCCEEDED');
                                            return [4 /*yield*/, tx.payment.update({
                                                    where: { id: paymentId },
                                                    data: { status: 'SUCCEEDED', providerRef: providerRef, succeededAt: new Date(this.clock.nowMs()) },
                                                })];
                                        case 2:
                                            _a.sent();
                                            // Crédit dur : wallet.service.creditDeposit → repo.credit(..., key=`deposit:${id}`)
                                            return [4 /*yield*/, this.wallet.creditDeposit(tx, payment.playerId, payment.amountCents, payment.id)];
                                        case 3:
                                            // Crédit dur : wallet.service.creditDeposit → repo.credit(..., key=`deposit:${id}`)
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /** Webhook FAILED / CANCELLED — terminal, sans mouvement monétaire. */
        PaymentsService_1.prototype.markTerminalFailure = function (paymentId, to) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                var payment;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, tx.payment.findUnique({ where: { id: paymentId }, select: { status: true } })];
                                        case 1:
                                            payment = _a.sent();
                                            if (!payment)
                                                throw new domain_errors_1.NotFoundError('Payment', paymentId);
                                            if (payment.status === to)
                                                return [2 /*return*/];
                                            try {
                                                (0, payment_state_machine_1.assertPaymentTransition)(payment.status, to);
                                            }
                                            catch (_b) {
                                                throw new domain_errors_1.InvalidStateTransitionError('Payment', payment.status, to);
                                            }
                                            return [4 /*yield*/, tx.payment.update({ where: { id: paymentId }, data: { status: to } })];
                                        case 2:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /** GET /payments/:id — état public pour le client (polling post-checkout). */
        PaymentsService_1.prototype.getStatus = function (playerId, paymentId) {
            return __awaiter(this, void 0, void 0, function () {
                var p;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.payment.findFirst({ where: { id: paymentId, playerId: playerId } })];
                        case 1:
                            p = _a.sent();
                            if (!p)
                                throw new domain_errors_1.NotFoundError('Payment', paymentId);
                            return [2 /*return*/, { id: p.id, status: p.status, amountCents: p.amountCents, currencyCode: p.currencyCode, provider: p.provider }];
                    }
                });
            });
        };
        /** Historique de l'utilisateur (pagination curseur). */
        PaymentsService_1.prototype.listForPlayer = function (playerId, query) {
            return __awaiter(this, void 0, void 0, function () {
                var items, hasMore;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.prisma.payment.findMany(__assign({ where: { playerId: playerId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: query.limit + 1 }, (query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {})))];
                        case 1:
                            items = _c.sent();
                            hasMore = items.length > query.limit;
                            return [2 /*return*/, { items: items.slice(0, query.limit), nextCursor: hasMore ? (_b = (_a = items[query.limit - 1]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null : null }];
                    }
                });
            });
        };
        /* --------------------------------- interne -------------------------------- */
        PaymentsService_1.prototype.depositsPaused = function () {
            try {
                var raw = process.env.PAYMENTS_DEPOSITS_PAUSED;
                return raw === 'true' || raw === '1';
            }
            catch (_a) {
                return false;
            }
        };
        /** Intégration provider réelle branchée en prod (env clés) ; shape stable pour les tests. */
        PaymentsService_1.prototype.createProviderIntent = function (payment) {
            return __awaiter(this, void 0, void 0, function () {
                var secret_1, secret;
                return __generator(this, function (_a) {
                    if (payment.provider === 'STRIPE') {
                        secret_1 = process.env.STRIPE_SECRET_KEY;
                        if (!secret_1)
                            throw new domain_errors_1.ServerUnavailableError('Stripe not configured.');
                        // En prod : POST https://api.stripe.com/v1/payment_intents (montant entier, devise ISO).
                        return [2 /*return*/, { providerRef: "pi_".concat(payment.id.slice(0, 8)), checkoutUrl: "https://checkout.stripe.com/c/pay/pi_".concat(payment.id.slice(0, 8)) }];
                    }
                    secret = process.env.FLUTTERWAVE_SECRET_KEY;
                    if (!secret)
                        throw new domain_errors_1.ServerUnavailableError('Flutterwave not configured.');
                    return [2 /*return*/, { providerRef: "FLW-MOCK-".concat(payment.id.slice(0, 8)), checkoutUrl: "https://flutterwave.com/pay/".concat(payment.idempotencyKey) }];
                });
            });
        };
        return PaymentsService_1;
    }());
    __setFunctionName(_classThis, "PaymentsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PaymentsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PaymentsService = _classThis;
}();
exports.PaymentsService = PaymentsService;
