"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiVersionInterceptor = exports.CURRENT_API_VERSION = exports.API_VERSION_HEADER = void 0;
const common_1 = require("@nestjs/common");
exports.API_VERSION_HEADER = 'X-API-Version';
exports.CURRENT_API_VERSION = 'v1';
let ApiVersionInterceptor = class ApiVersionInterceptor {
    intercept(context, next) {
        const res = context.switchToHttp().getResponse();
        res.setHeader(exports.API_VERSION_HEADER, exports.CURRENT_API_VERSION);
        return next.handle();
    }
};
exports.ApiVersionInterceptor = ApiVersionInterceptor;
exports.ApiVersionInterceptor = ApiVersionInterceptor = __decorate([
    (0, common_1.Injectable)()
], ApiVersionInterceptor);
//# sourceMappingURL=api-version.interceptor.js.map