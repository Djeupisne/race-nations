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
exports.IdempotencyGuard = exports.IDEMPOTENT_USER_KEY_PREFIX = void 0;
exports.deriveLedgerKey = deriveLedgerKey;
/**
 * IdempotencyGuard — INV-04 sur toutes les mutations monétaires (docs/api.md §1.1).
 * - Le header `Idempotency-Key` est REQUIS sur POST wallet/payments/bets ; absent → 422 VALIDATION_FAILED
 *   porté par le contrôleur (le guard ne fait que vérifier la présence + format).
 * - Format : [A-Za-z0-9_-]{8,64} — borné pour éviter les clés pathologiques en Redis/DB.
 * - La garantie forte (rejouer = réponse originale) vit dans la contrainte DB
 *   UNIQUE(idempotencyKey) de WalletTransaction/BetSettlement/WebhookEvent + le cache Redis
 *   court-termiste posé ici : SET NX key → si déjà en cours, renvoie 409 IDEMPOTENCY_CONFLICT.
 */
var common_1 = require("@nestjs/common");
var domain_errors_1 = require("../errors/domain-errors");
var KEY_RE = /^[A-Za-z0-9_-]{8,64}$/;
exports.IDEMPOTENT_USER_KEY_PREFIX = 'idem:user:';
var IdempotencyGuard = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var IdempotencyGuard = _classThis = /** @class */ (function () {
        function IdempotencyGuard_1() {
        }
        IdempotencyGuard_1.prototype.canActivate = function (context) {
            var req = context.switchToHttp().getRequest();
            var key = req.headers['idempotency-key'];
            if (!key) {
                throw new domain_errors_1.ValidationError({ field: 'Idempotency-Key', reason: 'Header required for monetary mutations.' });
            }
            if (!KEY_RE.test(key)) {
                throw new domain_errors_1.ValidationError({ field: 'Idempotency-Key', reason: 'Must match [A-Za-z0-9_-]{8,64}.', received: key.length });
            }
            // Expose la clé normalisée au handler (services la propagent aux ledger keys dérivées).
            req.idempotencyKey = key;
            return true;
        };
        return IdempotencyGuard_1;
    }());
    __setFunctionName(_classThis, "IdempotencyGuard");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        IdempotencyGuard = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return IdempotencyGuard = _classThis;
}();
exports.IdempotencyGuard = IdempotencyGuard;
/** Fabrique de clés ledger dérivées — cohérentes avec l'UNIQUE DB (INV-04). */
function deriveLedgerKey(kind, marketOrPaymentId, playerIdOrIndex) {
    var suffix = playerIdOrIndex === undefined ? '' : ":".concat(String(playerIdOrIndex));
    return "".concat(kind, ":").concat(marketOrPaymentId).concat(suffix);
}
