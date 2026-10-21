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
exports.LoggingInterceptor = void 0;
/**
 * LoggingInterceptor — journal structuré d'accès API (docs/observability.md).
 * Une ligne par requête : méthode, route, statut, durée, requestId, userId.
 * Aucune donnée sensible (body, tokens) n'est loggée.
 */
var common_1 = require("@nestjs/common");
var rxjs_1 = require("rxjs");
var LoggingInterceptor = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var LoggingInterceptor = _classThis = /** @class */ (function () {
        function LoggingInterceptor_1() {
            this.logger = new common_1.Logger('HTTP');
        }
        LoggingInterceptor_1.prototype.intercept = function (context, next) {
            var _this = this;
            var http = context.switchToHttp();
            var req = http.getRequest();
            var start = process.hrtime.bigint();
            return next.handle().pipe((0, rxjs_1.tap)({
                next: function () {
                    var _a, _b;
                    var res = http.getResponse();
                    var ms = Number(process.hrtime.bigint() - start) / 1e6;
                    _this.logger.log(JSON.stringify({
                        t: 'http',
                        m: req.method,
                        p: (_a = req.originalUrl) === null || _a === void 0 ? void 0 : _a.split('?')[0],
                        s: res.statusCode,
                        d: Math.round(ms * 10) / 10,
                        rid: req.requestId,
                        uid: (_b = req.user) === null || _b === void 0 ? void 0 : _b.sub,
                    }));
                },
                error: function (err) {
                    var _a;
                    var ms = Number(process.hrtime.bigint() - start) / 1e6;
                    var status = err instanceof Object && 'getStatus' in err
                        ? err.getStatus()
                        : 500;
                    _this.logger.warn(JSON.stringify({
                        t: 'http',
                        m: req.method,
                        p: (_a = req.originalUrl) === null || _a === void 0 ? void 0 : _a.split('?')[0],
                        s: status,
                        d: Math.round(ms * 10) / 10,
                        rid: req.requestId,
                        err: true,
                    }));
                },
            }));
        };
        return LoggingInterceptor_1;
    }());
    __setFunctionName(_classThis, "LoggingInterceptor");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        LoggingInterceptor = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return LoggingInterceptor = _classThis;
}();
exports.LoggingInterceptor = LoggingInterceptor;
