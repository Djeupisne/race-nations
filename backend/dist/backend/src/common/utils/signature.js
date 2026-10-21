"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signPayload = signPayload;
exports.signRaw = signRaw;
exports.verifySignatureConstantTime = verifySignatureConstantTime;
exports.isTimestampFresh = isTimestampFresh;
exports.verifySignedHeader = verifySignedHeader;
const node_crypto_1 = require("node:crypto");
function signPayload(secret, timestamp, rawBody) {
    return (0, node_crypto_1.createHmac)('sha256', secret)
        .update(`${timestamp}.${rawBody}`, 'utf8')
        .digest('hex');
}
function signRaw(secret, rawBody) {
    return (0, node_crypto_1.createHmac)('sha256', secret).update(rawBody, 'utf8').digest('hex');
}
function verifySignatureConstantTime(expectedHex, providedHex) {
    if (typeof expectedHex !== 'string' || typeof providedHex !== 'string')
        return false;
    const a = Buffer.from(expectedHex.toLowerCase(), 'utf8');
    const b = Buffer.from(providedHex.toLowerCase(), 'utf8');
    if (a.length !== b.length)
        return false;
    return (0, node_crypto_1.timingSafeEqual)(a, b);
}
function isTimestampFresh(timestampMs, nowMs, windowMs) {
    return Math.abs(nowMs - timestampMs) <= windowMs;
}
function verifySignedHeader(headerValue, rawBody, secret, nowMs, toleranceMs = 300_000) {
    const parts = headerValue.split(',');
    let ts;
    const sigs = [];
    for (const p of parts) {
        const [k, v] = p.split('=');
        if (k === 't')
            ts = Number.parseInt(v, 10);
        else if (k === 'v1' && v)
            sigs.push(v);
    }
    if (ts === undefined || Number.isNaN(ts) || sigs.length === 0)
        return { valid: false, reason: 'MALFORMED' };
    if (!isTimestampFresh(ts * 1000, nowMs, toleranceMs))
        return { valid: false, reason: 'TIMESTAMP_STALE' };
    const expected = signPayload(secret, ts, rawBody);
    let matched = false;
    for (const s of sigs) {
        if (verifySignatureConstantTime(expected, s))
            matched = true;
    }
    return matched ? { valid: true } : { valid: false, reason: 'NO_MATCHING_SIGNATURE' };
}
//# sourceMappingURL=signature.js.map