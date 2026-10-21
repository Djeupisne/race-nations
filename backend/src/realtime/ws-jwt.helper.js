"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WS_UNAUTHORIZED_CLOSE_CODE = void 0;
exports.verifyWsToken = verifyWsToken;
/**
 * ws-jwt.helper — vérification du JWT au handshake WebSocket.
 * Le token transite par la query string ?access_token= (clients Steam/Unity
 * sans headers custom). On exige : signature HS256, iss/aud conformes, exp
 * non dépassé, et typ != 'refresh'. Échec = null → close code 4401.
 */
var jsonwebtoken_1 = require("jsonwebtoken");
exports.WS_UNAUTHORIZED_CLOSE_CODE = 4401;
var ISS = 'race-nations-api';
var AUD = 'race-nations-clients';
function verifyWsToken(secret, token) {
    var _a, _b;
    if (!token || token.length > 4096)
        return null;
    try {
        var claims = (0, jsonwebtoken_1.verify)(token, secret, {
            algorithms: ['HS256'],
            issuer: ISS,
            audience: AUD,
        });
        // Les refresh tokens ne donnent JAMAIS accès au WS.
        if (claims.typ === 'refresh' || typeof claims.sub !== 'string')
            return null;
        return { userId: claims.sub, playerId: String((_a = claims.playerId) !== null && _a !== void 0 ? _a : ''), role: String((_b = claims.role) !== null && _b !== void 0 ? _b : 'player') };
    }
    catch (_c) {
        return null;
    }
}
