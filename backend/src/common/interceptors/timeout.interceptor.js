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
exports.TimeoutInterceptor = exports.requestTimeout = exports.TIMEOUT_META_KEY = void 0;
/**
 * TimeoutInterceptor — budget de latence par route (docs/observability.md : SLO p95).
 * Délpassement → SERVER_UNAVAILABLE (503) avec la requête annulée côté réponse ;
 * les mutations monétaires doivent être idempotentes (INV-04) pour que le client
 * puisse rejouer en sécurité après un timeout.
 * Budgets : lecture 2 s, écriture standard 5 s, settlement/paiement 10 s (worker asynchrone au-delà).
 */
var common_1 = require("@nestjs/common");
var rxjs_1 = require("rxjs");
var domain_errors_1 = require("../errors/domain-errors");
exports.TIMEOUT_META_KEY = 'route:timeout';
var requestTimeout = function (meta) { return function (target, key, desc) {
    var holder = desc ? desc.value : key ? target[key] : target;
    Reflect.defineMetadata(exports.TIMEOUT_META_KEY, meta, holder);
}; };
exports.requestTimeout = requestTimeout;
var DEFAULT_MS = 5000;
var TimeoutInterceptor = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var TimeoutInterceptor = _classThis = /** @class */ (function () {
        function TimeoutInterceptor_1() {
        }
        TimeoutInterceptor_1.prototype.intercept = function (context, next) {
            var _a, _b, _c;
            var meta = (_a = Reflect.getMetadata) === null || _a === void 0 ? void 0 : _a.call(Reflect, exports.TIMEOUT_META_KEY, (_b = context.getHandler) === null || _b === void 0 ? void 0 : _b.call(context));
            var ms = (_c = meta === null || meta === void 0 ? void 0 : meta.ms) !== null && _c !== void 0 ? _c : DEFAULT_MS;
            return next.handle().pipe((0, rxjs_1.timeout)(ms), (0, rxjs_1.catchError)(function (err) {
                if (err instanceof rxjs_1.TimeoutError) {
                    return (0, rxjs_1.throwError)(function () { var _a; return new domain_errors_1.ServerUnavailableError((_a = meta === null || meta === void 0 ? void 0 : meta.label) !== null && _a !== void 0 ? _a : 'request-budget'); });
                }
                return (0, rxjs_1.throwError)(function () { return err; });
            }));
        };
        return TimeoutInterceptor_1;
    }());
    __setFunctionName(_classThis, "TimeoutInterceptor");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TimeoutInterceptor = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TimeoutInterceptor = _classThis;
}();
exports.TimeoutInterceptor = TimeoutInterceptor;
