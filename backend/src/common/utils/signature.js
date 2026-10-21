"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signPayload = signPayload;
exports.signRaw = signRaw;
exports.verifySignatureConstantTime = verifySignatureConstantTime;
exports.isTimestampFresh = isTimestampFresh;
exports.verifySignedHeader = verifySignedHeader;
/**
 * signature — HMAC-SHA256 avec comparaison EN TEMPS CONSTANT (INV-26).
 * Utilisé par : webhooks Stripe/Flutterwave (verifiers), authentification
 * game-server → backend (result payloads), nonces anti-replay (INV-25).
 * Interdiction stricte : `===` / `==` sur une signature ou un digest.
 */
var node_crypto_1 = require("node:crypto");
/** Calcule la signature hex lowercase HMAC-SHA256(secret, `${timestamp}.${rawBody}`). */
function signPayload(secret, timestamp, rawBody) {
    return (0, node_crypto_1.createHmac)('sha256', secret)
        .update("".concat(timestamp, ".").concat(rawBody), 'utf8')
        .digest('hex');
}
/** Signature simple sur le corps brut (providers qui ne préfixent pas le timestamp). */
function signRaw(secret, rawBody) {
    return (0, node_crypto_1.createHmac)('sha256', secret).update(rawBody, 'utf8').digest('hex');
}
/**
 * Comparaison temps constant de deux hex strings.
 * Renvoie false sur tout format inattendu (longueur, caractères non-hex) —
 * la normalisation se fait AVANT la comparaison pour éviter les fuites latérales.
 */
function verifySignatureConstantTime(expectedHex, providedHex) {
    if (typeof expectedHex !== 'string' || typeof providedHex !== 'string')
        return false;
    var a = Buffer.from(expectedHex.toLowerCase(), 'utf8');
    var b = Buffer.from(providedHex.toLowerCase(), 'utf8');
    if (a.length !== b.length)
        return false; // longueur fixe hex64 en pratique ; pas de early-exit sur contenu
    return (0, node_crypto_1.timingSafeEqual)(a, b);
}
/** Fenêtre anti-replay : |now - timestamp| <= windowMs (Clock injectée, INV-29). */
function isTimestampFresh(timestampMs, nowMs, windowMs) {
    return Math.abs(nowMs - timestampMs) <= windowMs;
}
/**
 * Vérification complète style Stripe : `t=<ts>,v1=<hex>` multi-signatures acceptées
 * (rotation de secret). Au moins une v1 doit matcher ET le timestamp être frais.
 */
function verifySignedHeader(headerValue, rawBody, secret, nowMs, toleranceMs) {
    if (toleranceMs === void 0) { toleranceMs = 300000; }
    var parts = headerValue.split(',');
    var ts;
    var sigs = [];
    for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
        var p = parts_1[_i];
        var _a = p.split('='), k = _a[0], v = _a[1];
        if (k === 't')
            ts = Number.parseInt(v, 10);
        else if (k === 'v1' && v)
            sigs.push(v);
    }
    if (ts === undefined || Number.isNaN(ts) || sigs.length === 0)
        return { valid: false, reason: 'MALFORMED' };
    if (!isTimestampFresh(ts * 1000, nowMs, toleranceMs))
        return { valid: false, reason: 'TIMESTAMP_STALE' };
    var expected = signPayload(secret, ts, rawBody);
    // Compare TOUTES les signatures candidates (pas de break anticipé sur match → coût constant).
    var matched = false;
    for (var _b = 0, sigs_1 = sigs; _b < sigs_1.length; _b++) {
        var s = sigs_1[_b];
        if (verifySignatureConstantTime(expected, s))
            matched = true;
    }
    return matched ? { valid: true } : { valid: false, reason: 'NO_MATCHING_SIGNATURE' };
}
