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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifierRegistry = void 0;
/**
 * verifier.registry.ts — registre DI des vérificateurs de webhooks.
 * Chaque module provider enregistre son verifier au bootstrap ; le controller résout
 * le bon par chemin. Unknown provider → 404 sec (pas de probing interne).
 * Centralise aussi la fabrication de la clé d'idempotence : `<PROVIDER>:<externalId>`
 * (contrainte UNIQUE sur WebhookEvent.idempotencyKey — INV-04).
 */
var common_1 = require("@nestjs/common");
var VerifierRegistry = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var VerifierRegistry = _classThis = /** @class */ (function () {
        function VerifierRegistry_1() {
            this.byPath = new Map();
            this.logger = new common_1.Logger(VerifierRegistry.name);
        }
        VerifierRegistry_1.prototype.register = function (verifier) {
            if (this.byPath.has(verifier.path)) {
                this.logger.warn("Duplicate webhook verifier path ignored: ".concat(verifier.path));
                return;
            }
            this.byPath.set(verifier.path, verifier);
        };
        /** Résolution stricte par chemin exact (sans préfixe /api/v1 — ajouté par le controller). */
        VerifierRegistry_1.prototype.resolve = function (path) {
            return this.byPath.get(path.replace(/^\/api\/v1/, ''));
        };
        VerifierRegistry_1.prototype.registeredPaths = function () {
            return __spreadArray([], this.byPath.keys(), true);
        };
        VerifierRegistry_1.idempotencyKey = function (provider, externalId) {
            return "".concat(provider.toUpperCase(), ":").concat(externalId);
        };
        return VerifierRegistry_1;
    }());
    __setFunctionName(_classThis, "VerifierRegistry");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        VerifierRegistry = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return VerifierRegistry = _classThis;
}();
exports.VerifierRegistry = VerifierRegistry;
