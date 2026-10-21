"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const app_error_1 = require("../errors/app-error");
let AllExceptionsFilter = class AllExceptionsFilter {
    logger = new common_1.Logger('Exceptions');
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const requestId = request.requestId;
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let code = 'INTERNAL_ERROR';
        let message = 'An unexpected error occurred.';
        let details;
        if (exception instanceof app_error_1.AppError) {
            status = exception.statusCode;
            code = exception.code;
            message = exception.message;
            details = exception.details;
        }
        else if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (exception.code === 'P2002') {
                status = common_1.HttpStatus.CONFLICT;
                code = 'CONFLICT';
                message = 'A resource with the same unique key already exists.';
            }
            else if (exception.code === 'P2025') {
                status = common_1.HttpStatus.NOT_FOUND;
                code = 'NOT_FOUND';
                message = 'Resource not found.';
            }
            else {
                status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
                code = 'DB_ERROR';
                message = 'A database error occurred.';
                this.logger.error(`Prisma ${exception.code}`, exception.stack);
            }
        }
        else if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const body = exception.getResponse();
            message =
                typeof body === 'string'
                    ? body
                    : Array.isArray(body.message)
                        ? (body.message.join('; '))
                        : ((body.message ?? exception.message));
            code = `HTTP_${status}`;
        }
        else {
            this.logger.error(`Unhandled exception on ${request.method} ${request.url}`, exception instanceof Error ? exception.stack : String(exception));
        }
        if (!requestId || typeof requestId !== 'string') {
        }
        response.status(status).json({
            error: {
                code,
                message,
                ...(details !== undefined ? { details } : {}),
                ...(requestId ? { requestId } : {}),
            },
        });
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map