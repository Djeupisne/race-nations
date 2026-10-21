"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
/**
 * current-user.decorator.ts — raccourci typé vers req.user injecté par JwtStrategy.
 * Usage : `@CurrentUser() user: AuthenticatedUser` dans tous les contrôleurs authentifiés.
 * Retourne undefined sur les routes @Public() non signées → les handlers doivent refuser
 * explicitement si l'identité est requise (défense en profondeur, INV-28).
 */
var common_1 = require("@nestjs/common");
exports.CurrentUser = (0, common_1.createParamDecorator)(function (data, ctx) {
    var request = ctx.switchToHttp().getRequest();
    var user = request.user;
    return data && user ? user[data] : user;
});
