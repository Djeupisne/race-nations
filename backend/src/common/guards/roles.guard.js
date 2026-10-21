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
exports.RolesGuard = void 0;
/**
 * roles.guard.ts — autorisation par rôle (RBAC minimal, api.md §9).
 * - Lit @Roles(...) via Reflector ; hiérarchie implicite SYSTEM > ADMIN > MODERATOR > PLAYER.
 * - Si aucune métadonnée : la route n'exige qu'une authentification (laissée au JwtAuthGuard).
 * - Refus → ForbiddenAdminError (403 FORBIDDEN_ADMIN) — pas de distinction "existe mais interdit"
 *   sur les chemins admin (anti-énumération).
 */
var common_1 = require("@nestjs/common");
var roles_decorator_1 = require("../decorators/roles.decorator");
var domain_errors_1 = require("../errors/domain-errors");
var RANK = { PLAYER: 0, MODERATOR: 1, ADMIN: 2, SYSTEM: 3 };
var RolesGuard = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var RolesGuard = _classThis = /** @class */ (function () {
        function RolesGuard_1(reflector) {
            this.reflector = reflector;
        }
        RolesGuard_1.prototype.canActivate = function (context) {
            var required = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);
            if (!required || required.length === 0)
                return true;
            var user = context.switchToHttp().getRequest().user;
            if (!user)
                throw new domain_errors_1.AuthUnauthenticatedError(); // guard enregistré après le JwtAuthGuard
            var minRank = Math.min.apply(Math, required.map(function (r) { return RANK[r]; }));
            if (RANK[user.role] < minRank)
                throw new domain_errors_1.ForbiddenAdminError();
            return true;
        };
        return RolesGuard_1;
    }());
    __setFunctionName(_classThis, "RolesGuard");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RolesGuard = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RolesGuard = _classThis;
}();
exports.RolesGuard = RolesGuard;
