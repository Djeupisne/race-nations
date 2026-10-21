"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WS_UNAUTHORIZED_CLOSE_CODE = void 0;
exports.verifyWsToken = verifyWsToken;
const jsonwebtoken_1 = require("jsonwebtoken");
exports.WS_UNAUTHORIZED_CLOSE_CODE = 4401;
const ISS = 'race-nations-api';
const AUD = 'race-nations-clients';
function verifyWsToken(secret, token) {
    if (!token || token.length > 4096)
        return null;
    try {
        const claims = (0, jsonwebtoken_1.verify)(token, secret, {
            algorithms: ['HS256'],
            issuer: ISS,
            audience: AUD,
        });
        if (claims.typ === 'refresh' || typeof claims.sub !== 'string')
            return null;
        const rawRole = String(claims.role ?? 'PLAYER').toUpperCase();
        const role = rawRole === 'MODERATOR' || rawRole === 'ADMIN' || rawRole === 'SYSTEM' ? rawRole : 'PLAYER';
        const family = typeof claims.fam === 'number' ? claims.fam : 0;
        return { userId: claims.sub, playerId: String(claims.playerId ?? ''), role, family };
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=ws-jwt.helper.js.map