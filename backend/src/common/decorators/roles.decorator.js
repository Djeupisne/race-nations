"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Roles = exports.ROLES_KEY = void 0;
/**
 * roles.decorator.ts — métadonnée de rôle pour RolesGuard (api.md §9 : /admin/* ADMIN,
 * endpoints modération MODERATOR+). Les rôles sont TOUJOURS lus depuis le JWT validé +
 * la base (JwtStrategy), jamais depuis le client.
 */
var common_1 = require("@nestjs/common");
exports.ROLES_KEY = 'auth:roles';
var Roles = function () {
    var roles = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        roles[_i] = arguments[_i];
    }
    return (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
};
exports.Roles = Roles;
