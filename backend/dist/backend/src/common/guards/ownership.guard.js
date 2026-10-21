"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnershipGuard = exports.ownership = exports.OWNERSHIP_META_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const domain_errors_1 = require("../errors/domain-errors");
exports.OWNERSHIP_META_KEY = 'ownership:resource';
const ownership = (meta) => (target, key, desc) => {
    const reflectorSetMetadata = Reflect.defineMetadata;
    const holder = desc ? desc.value : key ? target[key] : target;
    reflectorSetMetadata(exports.OWNERSHIP_META_KEY, meta, holder);
};
exports.ownership = ownership;
let OwnershipGuard = class OwnershipGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    async canActivate(context) {
        const meta = this.reflector.get(exports.OWNERSHIP_META_KEY, context.getHandler());
        const req = context.switchToHttp().getRequest();
        const user = req.user;
        if (!user?.userId)
            throw new domain_errors_1.ForbiddenAdminError({}, 'Authentication required for ownership check.');
        if (user.role === 'ADMIN' || user.role === 'MODERATOR')
            return true;
        if (!meta) {
            const playerId = req.params?.playerId;
            if (playerId && user.playerId && playerId === user.playerId)
                return true;
            throw new domain_errors_1.ForbiddenAdminError({}, 'You do not own this resource.');
        }
        const id = meta.idParam && req.params ? req.params[meta.idParam] : undefined;
        if (!id)
            throw new domain_errors_1.NotFoundError(meta.model ?? 'resource', id);
        const ownerPlayerId = req.resourceOwnerPlayerId;
        if (ownerPlayerId === undefined) {
            throw new domain_errors_1.ForbiddenAdminError({}, 'Ownership enrichment missing for resource.');
        }
        if (ownerPlayerId !== user.playerId)
            throw new domain_errors_1.ForbiddenAdminError({}, 'You do not own this resource.');
        return true;
    }
};
exports.OwnershipGuard = OwnershipGuard;
exports.OwnershipGuard = OwnershipGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], OwnershipGuard);
//# sourceMappingURL=ownership.guard.js.map