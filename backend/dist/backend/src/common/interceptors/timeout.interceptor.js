"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeoutInterceptor = exports.requestTimeout = exports.TIMEOUT_META_KEY = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const domain_errors_1 = require("../errors/domain-errors");
exports.TIMEOUT_META_KEY = 'route:timeout';
const requestTimeout = (meta) => (target, key, desc) => {
    const holder = desc ? desc.value : key ? target[key] : target;
    Reflect.defineMetadata(exports.TIMEOUT_META_KEY, meta, holder);
};
exports.requestTimeout = requestTimeout;
const DEFAULT_MS = 5_000;
let TimeoutInterceptor = class TimeoutInterceptor {
    intercept(context, next) {
        const meta = Reflect.getMetadata?.(exports.TIMEOUT_META_KEY, context.getHandler?.());
        const ms = meta?.ms ?? DEFAULT_MS;
        return next.handle().pipe((0, rxjs_1.timeout)(ms), (0, rxjs_1.catchError)((err) => {
            if (err instanceof rxjs_1.TimeoutError) {
                return (0, rxjs_1.throwError)(() => new domain_errors_1.ServerUnavailableError(meta?.label ?? 'request-budget'));
            }
            return (0, rxjs_1.throwError)(() => err);
        }));
    }
};
exports.TimeoutInterceptor = TimeoutInterceptor;
exports.TimeoutInterceptor = TimeoutInterceptor = __decorate([
    (0, common_1.Injectable)()
], TimeoutInterceptor);
//# sourceMappingURL=timeout.interceptor.js.map