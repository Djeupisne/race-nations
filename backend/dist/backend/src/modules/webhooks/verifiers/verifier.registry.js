"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var VerifierRegistry_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifierRegistry = void 0;
const common_1 = require("@nestjs/common");
let VerifierRegistry = VerifierRegistry_1 = class VerifierRegistry {
    byPath = new Map();
    logger = new common_1.Logger(VerifierRegistry_1.name);
    register(verifier) {
        if (this.byPath.has(verifier.path)) {
            this.logger.warn(`Duplicate webhook verifier path ignored: ${verifier.path}`);
            return;
        }
        this.byPath.set(verifier.path, verifier);
    }
    resolve(path) {
        return this.byPath.get(path.replace(/^\/api\/v1/, ''));
    }
    registeredPaths() {
        return [...this.byPath.keys()];
    }
    static idempotencyKey(provider, externalId) {
        return `${provider.toUpperCase()}:${externalId}`;
    }
};
exports.VerifierRegistry = VerifierRegistry;
exports.VerifierRegistry = VerifierRegistry = VerifierRegistry_1 = __decorate([
    (0, common_1.Injectable)()
], VerifierRegistry);
//# sourceMappingURL=verifier.registry.js.map