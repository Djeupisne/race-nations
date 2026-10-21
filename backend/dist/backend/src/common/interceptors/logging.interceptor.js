"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let LoggingInterceptor = class LoggingInterceptor {
    logger = new common_1.Logger('HTTP');
    intercept(context, next) {
        const http = context.switchToHttp();
        const req = http.getRequest();
        const start = process.hrtime.bigint();
        return next.handle().pipe((0, rxjs_1.tap)({
            next: () => {
                const res = http.getResponse();
                const ms = Number(process.hrtime.bigint() - start) / 1e6;
                this.logger.log(JSON.stringify({
                    t: 'http',
                    m: req.method,
                    p: req.originalUrl?.split('?')[0],
                    s: res.statusCode,
                    d: Math.round(ms * 10) / 10,
                    rid: req.requestId,
                    uid: req.user?.sub,
                }));
            },
            error: (err) => {
                const ms = Number(process.hrtime.bigint() - start) / 1e6;
                const status = err instanceof Object && 'getStatus' in err
                    ? err.getStatus()
                    : 500;
                this.logger.warn(JSON.stringify({
                    t: 'http',
                    m: req.method,
                    p: req.originalUrl?.split('?')[0],
                    s: status,
                    d: Math.round(ms * 10) / 10,
                    rid: req.requestId,
                    err: true,
                }));
            },
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map