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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
/**
 * AllExceptionsFilter — enveloppe d'erreur API unique et stable
 * (docs/api.md §1). Aucune stack trace ni détail interne ne sort jamais.
 *
 * Mapping :
 *  - AppError (domaine) -> { statusCode, code, message, details? }
 *  - HttpException      -> { statusCode, code: HTTP_<STATUS>, message }
 *  - Prisma P2002       -> 409 CONFLICT
 *  - inconnu            -> 500 INTERNAL + log serveur uniquement
 */
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var app_error_1 = require("../errors/app-error");
var AllExceptionsFilter = function () {
    var _classDecorators = [(0, common_1.Catch)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AllExceptionsFilter = _classThis = /** @class */ (function () {
        function AllExceptionsFilter_1() {
            this.logger = new common_1.Logger('Exceptions');
        }
        AllExceptionsFilter_1.prototype.catch = function (exception, host) {
            var _a;
            var ctx = host.switchToHttp();
            var response = ctx.getResponse();
            var request = ctx.getRequest();
            var requestId = request.requestId;
            var status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            var code = 'INTERNAL_ERROR';
            var message = 'An unexpected error occurred.';
            var details;
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
                    this.logger.error("Prisma ".concat(exception.code), exception.stack);
                }
            }
            else if (exception instanceof common_1.HttpException) {
                status = exception.getStatus();
                var body = exception.getResponse();
                message =
                    typeof body === 'string'
                        ? body
                        : Array.isArray(body.message)
                            ? (body.message.join('; '))
                            : (((_a = body.message) !== null && _a !== void 0 ? _a : exception.message));
                code = "HTTP_".concat(status);
            }
            else {
                this.logger.error("Unhandled exception on ".concat(request.method, " ").concat(request.url), exception instanceof Error ? exception.stack : String(exception));
            }
            // Jamais de 500 avec fuite interne : le client reçoit un code stable.
            if (!requestId || typeof requestId !== 'string') {
                // noop — requestId optionnel hors middleware
            }
            response.status(status).json({
                error: __assign(__assign({ code: code, message: message }, (details !== undefined ? { details: details } : {})), (requestId ? { requestId: requestId } : {})),
            });
        };
        return AllExceptionsFilter_1;
    }());
    __setFunctionName(_classThis, "AllExceptionsFilter");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AllExceptionsFilter = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AllExceptionsFilter = _classThis;
}();
exports.AllExceptionsFilter = AllExceptionsFilter;
