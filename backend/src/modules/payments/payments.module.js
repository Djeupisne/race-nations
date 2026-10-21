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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsModule = void 0;
/**
 * PaymentsModule — dépôts/retraits multi-providers.
 * Les providers sont injectables via leur classe ; le webhook service
 * (WebhooksModule) résout le paymentId et appelle markSucceeded — seul
 * chemin de crédit d'un dépôt (jamais le redirect client).
 */
var common_1 = require("@nestjs/common");
var prisma_module_1 = require("../../prisma/prisma.module");
var wallet_module_1 = require("../wallet/wallet.module");
var audit_module_1 = require("../audit/audit.module");
var payments_service_1 = require("./payments.service");
var payments_controller_1 = require("./payments.controller");
var stripe_provider_1 = require("./stripe.provider");
var flutterwave_provider_1 = require("./flutterwave.provider");
var google_play_provider_1 = require("./google-play.provider");
var apple_store_provider_1 = require("./apple-store.provider");
var huawei_iap_provider_1 = require("./huawei-iap.provider");
var PaymentsModule = function () {
    var _classDecorators = [(0, common_1.Module)({
            imports: [prisma_module_1.PrismaModule, wallet_module_1.WalletModule, audit_module_1.AuditModule],
            providers: [
                payments_service_1.PaymentsService,
                stripe_provider_1.StripeProvider,
                flutterwave_provider_1.FlutterwaveProvider,
                google_play_provider_1.GooglePlayProvider,
                apple_store_provider_1.AppleStoreProvider,
                huawei_iap_provider_1.HuaweiIapProvider,
            ],
            controllers: [payments_controller_1.PaymentsController],
            exports: [payments_service_1.PaymentsService, google_play_provider_1.GooglePlayProvider, apple_store_provider_1.AppleStoreProvider, huawei_iap_provider_1.HuaweiIapProvider],
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var PaymentsModule = _classThis = /** @class */ (function () {
        function PaymentsModule_1() {
        }
        return PaymentsModule_1;
    }());
    __setFunctionName(_classThis, "PaymentsModule");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PaymentsModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PaymentsModule = _classThis;
}();
exports.PaymentsModule = PaymentsModule;
