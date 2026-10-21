"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyGuard = exports.IDEMPOTENT_USER_KEY_PREFIX = void 0;
exports.deriveLedgerKey = deriveLedgerKey;
const common_1 = require("@nestjs/common");
const domain_errors_1 = require("../errors/domain-errors");
const KEY_RE = /^[A-Za-z0-9_-]{8,64}$/;
exports.IDEMPOTENT_USER_KEY_PREFIX = 'idem:user:';
let IdempotencyGuard = class IdempotencyGuard {
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const key = req.headers['idempotency-key'];
        if (!key) {
            throw new domain_errors_1.ValidationError({ field: 'Idempotency-Key', reason: 'Header required for monetary mutations.' });
        }
        if (!KEY_RE.test(key)) {
            throw new domain_errors_1.ValidationError({ field: 'Idempotency-Key', reason: 'Must match [A-Za-z0-9_-]{8,64}.', received: key.length });
        }
        req.idempotencyKey = key;
        return true;
    }
};
exports.IdempotencyGuard = IdempotencyGuard;
exports.IdempotencyGuard = IdempotencyGuard = __decorate([
    (0, common_1.Injectable)()
], IdempotencyGuard);
function deriveLedgerKey(kind, marketOrPaymentId, playerIdOrIndex) {
    const suffix = playerIdOrIndex === undefined ? '' : `:${String(playerIdOrIndex)}`;
    return `${kind}:${marketOrPaymentId}${suffix}`;
}
//# sourceMappingURL=idempotency.guard.js.map